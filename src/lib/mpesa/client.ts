import axios, { AxiosInstance } from "axios";
import type { MpesaTokenResponse, STKPushResponse, B2CResponse } from "./types";

class MpesaClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    const baseURL =
      process.env.MPESA_ENVIRONMENT === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";

    this.client = axios.create({ baseURL });
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      throw new Error("Missing M-Pesa Consumer Key or Secret");
    }

    const auth = Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString("base64");

    const { data } = await this.client.get<MpesaTokenResponse>(
      "/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );

    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (parseInt(data.expires_in || "3599") - 60) * 1000;
    return this.token;
  }

  private getTimestamp(): string {
    const now = new Date();
    return (
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0")
    );
  }

  async stkPush(params: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
  }): Promise<STKPushResponse> {
    // Check env vars
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const callbackBaseUrl = process.env.MPESA_CALLBACK_BASE_URL;
    const callbackSecret = process.env.MPESA_CALLBACK_SECRET;

    if (!shortcode || !passkey || !callbackBaseUrl) {
      throw new Error(`Missing M-Pesa env vars: SHORTCODE=${!!shortcode}, PASSKEY=${!!passkey}, CALLBACK_BASE_URL=${!!callbackBaseUrl}`);
    }

    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const { data } = await this.client.post<STKPushResponse>(
      "/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(params.amount),
        PartyA: params.phoneNumber,
        PartyB: shortcode,
        PhoneNumber: params.phoneNumber,
        CallBackURL: `${process.env.MPESA_CALLBACK_BASE_URL}/api/mpesa/callback/stk?secret=${callbackSecret}`,
        AccountReference: params.accountReference,
        TransactionDesc: params.transactionDesc,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data;
  }

  async b2cPayment(params: {
    phoneNumber: string;
    amount: number;
    remarks: string;
    occasion: string;
    conversationId: string;
  }): Promise<B2CResponse> {
    const token = await this.getAccessToken();
    const callbackSecret = process.env.MPESA_CALLBACK_SECRET;

    const { data } = await this.client.post<B2CResponse>(
      "/mpesa/b2c/v3/paymentrequest",
      {
        OriginatorConversationID: params.conversationId,
        InitiatorName: process.env.MPESA_B2C_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL,
        CommandID: "BusinessPayment",
        Amount: Math.round(params.amount),
        PartyA: process.env.MPESA_B2C_SHORTCODE,
        PartyB: params.phoneNumber,
        Remarks: params.remarks,
        QueueTimeOutURL: `${process.env.MPESA_CALLBACK_BASE_URL}/api/mpesa/callback/b2c/timeout?secret=${callbackSecret}`,
        ResultURL: `${process.env.MPESA_CALLBACK_BASE_URL}/api/mpesa/callback/b2c/result?secret=${callbackSecret}`,
        Occasion: params.occasion,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data;
  }

  async stkQuery(checkoutRequestId: string) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const { data } = await this.client.post(
      "/mpesa/stkpushquery/v1/query",
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data;
  }
}

export const mpesaClient = new MpesaClient();
