import axios from 'axios'
import { type Prisma } from '@prisma/client'

// Use Decimal from Prisma namespace
type Decimal = Prisma.Decimal

const MPESA_BASE_URL =
  process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage?: string
}

interface B2CResponse {
  ConversationID: string
  OriginatorConversationID: string
  ResponseCode: string
  ResponseDescription: string
}

export class MpesaService {
  private static accessTokenCache: { token: string; expiresAt: number } | null = null

  /**
   * Get OAuth access token from Daraja
   */
  static async getAccessToken(): Promise<string> {
    // Check cache (valid for 55 minutes)
    if (this.accessTokenCache && Date.now() < this.accessTokenCache.expiresAt) {
      return this.accessTokenCache.token
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET

    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa credentials not configured')
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

    try {
      const response = await axios.get(
        `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      )

      const token = response.data.access_token
      // Cache for 55 minutes (token expires in 1 hour)
      this.accessTokenCache = {
        token,
        expiresAt: Date.now() + 55 * 60 * 1000,
      }

      return token
    } catch (error) {
      console.error('M-Pesa token error:', error)
      throw new Error('Failed to get M-Pesa access token')
    }
  }

  /**
   * Generate password for STK Push
   */
  private static generateSTKPassword(): { password: string; timestamp: string } {
    const shortcode = process.env.MPESA_SHORTCODE || '174379'
    const passkey = process.env.MPESA_PASSKEY || ''
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14)

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    return { password, timestamp }
  }

  /**
   * Normalize Kenyan phone number
   */
  static normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '')

    if (cleaned.startsWith('+254')) {
      return cleaned.substring(1)
    }

    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1)
    }

    if (!cleaned.startsWith('254')) {
      return '254' + cleaned
    }

    return cleaned
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa)
   */
  static async stkPush(params: {
    phone: string
    amount: number
    accountRef: string
    description: string
    callbackUrl: string
  }): Promise<STKPushResponse> {
    const { phone, amount, accountRef, description, callbackUrl } = params

    const token = await this.getAccessToken()
    const { password, timestamp } = this.generateSTKPassword()
    const normalizedPhone = this.normalizePhone(phone)

    const shortcode = process.env.MPESA_SHORTCODE || '174379'

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: normalizedPhone,
      PartyB: shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountRef.slice(0, 12),
      TransactionDesc: description.slice(0, 13),
    }

    try {
      const response = await axios.post<STKPushResponse>(
        `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error: any) {
      console.error('STK Push error:', error.response?.data || error.message)
      throw new Error(`STK Push failed: ${error.response?.data?.errorMessage || error.message}`)
    }
  }

  /**
   * Query STK Push status
   */
  static async querySTKStatus(checkoutRequestId: string): Promise<any> {
    const token = await this.getAccessToken()
    const { password, timestamp } = this.generateSTKPassword()
    const shortcode = process.env.MPESA_SHORTCODE || '174379'

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }

    try {
      const response = await axios.post(
        `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error: any) {
      console.error('STK Query error:', error.response?.data || error.message)
      throw new Error(`STK Query failed: ${error.response?.data?.errorMessage || error.message}`)
    }
  }

  /**
   * Initiate B2C payment (payout to user)
   */
  static async b2cPayment(params: {
    phone: string
    amount: number
    remarks: string
    occasion: string
    callbackUrl: string
    timeoutUrl: string
  }): Promise<B2CResponse> {
    const { phone, amount, remarks, occasion, callbackUrl, timeoutUrl } = params

    const token = await this.getAccessToken()
    const normalizedPhone = this.normalizePhone(phone)

    const shortcode = process.env.MPESA_B2C_SHORTCODE
    const initiator = process.env.MPESA_B2C_INITIATOR
    const securityCredential = process.env.MPESA_B2C_SECURITY_CREDENTIAL

    if (!shortcode || !initiator || !securityCredential) {
      throw new Error('B2C configuration incomplete')
    }

    const payload = {
      InitiatorName: initiator,
      SecurityCredential: securityCredential,
      CommandID: 'BusinessPayment',
      Amount: Math.round(amount),
      PartyA: shortcode,
      PartyB: normalizedPhone,
      Remarks: remarks.slice(0, 100),
      QueueTimeOutURL: timeoutUrl,
      ResultURL: callbackUrl,
      Occasion: occasion.slice(0, 100),
    }

    try {
      const response = await axios.post<B2CResponse>(
        `${MPESA_BASE_URL}/mpesa/b2c/v1/paymentrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error: any) {
      console.error('B2C payment error:', error.response?.data || error.message)
      throw new Error(`B2C payment failed: ${error.response?.data?.errorMessage || error.message}`)
    }
  }

  /**
   * Process STK Push callback from Safaricom
   */
  static processSTKCallback(body: any): {
    success: boolean
    checkoutRequestId: string
    mpesaReceiptNumber?: string
    amount?: number
    phone?: string
    resultCode: number
    resultDesc: string
  } {
    const callback = body?.Body?.stkCallback

    if (!callback) {
      throw new Error('Invalid callback body')
    }

    const resultCode = callback.ResultCode
    const resultDesc = callback.ResultDesc
    const checkoutRequestId = callback.CheckoutRequestID

    if (resultCode === 0) {
      const callbackMetadata = callback.CallbackMetadata?.Item || []

      const getValue = (name: string) => {
        const item = callbackMetadata.find((i: any) => i.Name === name)
        return item?.Value
      }

      return {
        success: true,
        checkoutRequestId,
        mpesaReceiptNumber: getValue('MpesaReceiptNumber'),
        amount: getValue('Amount'),
        phone: getValue('PhoneNumber'),
        resultCode,
        resultDesc,
      }
    }

    return {
      success: false,
      checkoutRequestId,
      resultCode,
      resultDesc,
    }
  }

  /**
   * Process B2C callback
   */
  static processB2CCallback(body: any): {
    success: boolean
    conversationId: string
    originatorConversationId: string
    resultCode: number
    resultDesc: string
    mpesaReceiptNumber?: string
    amount?: number
    phone?: string
  } {
    const result = body?.Result

    if (!result) {
      throw new Error('Invalid B2C callback body')
    }

    const resultCode = result.ResultCode
    const resultDesc = result.ResultDesc
    const conversationId = result.ConversationID
    const originatorConversationId = result.OriginatorConversationID

    const resultParams = result.ResultParameters?.ResultParameter || []

    const getValue = (key: string) => {
      const param = resultParams.find((p: any) => p.Key === key)
      return param?.Value
    }

    return {
      success: resultCode === 0,
      conversationId,
      originatorConversationId,
      resultCode,
      resultDesc,
      mpesaReceiptNumber: getValue('TransactionReceipt'),
      amount: getValue('TransactionAmount'),
      phone: getValue('ReceiverPartyPublicName'),
    }
  }

  /**
   * Generate unique reference code
   */
  static generateReference(prefix: string = 'SKY'): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }
}
