import { mpesaClient } from './client'

export class MpesaService {
  static generateReference(prefix: string = 'SKY'): string {
    const ts = Date.now().toString(36).toUpperCase()
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${ts}-${rand}`
  }

  static normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '')
    if (cleaned.startsWith('+254')) return cleaned.substring(1)
    if (cleaned.startsWith('0')) return '254' + cleaned.substring(1)
    if (!cleaned.startsWith('254')) return '254' + cleaned
    return cleaned
  }

  static async stkPush(params: {
    phone: string
    amount: number
    accountRef: string
    description: string
    callbackUrl?: string
  }) {
    return mpesaClient.stkPush({
      phoneNumber: this.normalizePhone(params.phone),
      amount: params.amount,
      accountReference: params.accountRef,
      transactionDesc: params.description,
    })
  }

  static async b2cPayment(params: {
    phone: string
    amount: number
    remarks: string
    occasion: string
    callbackUrl?: string
    timeoutUrl?: string
  }) {
    const conversationId = `SKY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return mpesaClient.b2cPayment({
      phoneNumber: this.normalizePhone(params.phone),
      amount: params.amount,
      remarks: params.remarks,
      occasion: params.occasion,
      conversationId,
    })
  }

  static processSTKCallback(body: any) {
    const stkCallback = body?.Body?.stkCallback
    if (!stkCallback) {
      return { success: false, resultCode: -1, resultDesc: 'Invalid callback body' }
    }

    const metadata = stkCallback.CallbackMetadata?.Item || []
    const getMeta = (name: string) =>
      metadata.find((i: any) => i.Name === name)?.Value

    return {
      success: stkCallback.ResultCode === 0,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc,
      checkoutRequestId: stkCallback.CheckoutRequestID,
      merchantRequestId: stkCallback.MerchantRequestID,
      amount: getMeta('Amount') ? parseFloat(String(getMeta('Amount'))) : null,
      mpesaReceiptNumber: getMeta('MpesaReceiptNumber')?.toString(),
      phone: getMeta('PhoneNumber')?.toString(),
      transactionDate: getMeta('TransactionDate')?.toString(),
    }
  }

  static processB2CCallback(body: any) {
    const result = body?.Result
    if (!result) {
      return { success: false, resultCode: -1, resultDesc: 'Invalid callback body' }
    }

    const params = result.ResultParameters?.ResultParameter || []
    const getParam = (key: string) =>
      params.find((p: any) => p.Key === key)?.Value

    return {
      success: result.ResultCode === 0,
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc,
      conversationId: result.ConversationID,
      originatorConversationId: result.OriginatorConversationID,
      amount: getParam('TransactionAmount') ? parseFloat(String(getParam('TransactionAmount'))) : null,
      mpesaReceiptNumber: getParam('TransactionReceipt')?.toString(),
      phone: getParam('ReceiverPartyPublicName')?.toString(),
    }
  }
}
