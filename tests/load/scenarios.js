import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // 1. Creator browsing campaigns (Read-heavy)
    browse_campaigns: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 }, // Ramp up
        { duration: '1m', target: 50 },  // Steady state
        { duration: '30s', target: 0 },  // Ramp down
      ],
      exec: 'browseCampaigns',
    },
    // 2. M-Pesa Callback Webhook (Write-heavy)
    mpesa_callbacks: {
      executor: 'constant-arrival-rate',
      rate: 20, // 20 requests per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 100,
      exec: 'mpesaCallback',
    },
  },
  thresholds: {
    // Performance Budget
    'http_req_duration{scenario:browse_campaigns}': ['p(95)<200', 'p(99)<500'],
    'http_req_duration{scenario:mpesa_callbacks}': ['p(95)<300'],
    'http_req_failed': ['rate<0.01'], // Less than 1% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function browseCampaigns() {
  const res = http.get(`${BASE_URL}/api/campaigns?status=ACTIVE&limit=20`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'returns campaigns array': (r) => JSON.parse(r.body).campaigns !== undefined,
  });
  
  sleep(1);
}

export function mpesaCallback() {
  const payload = JSON.stringify({
    Result: {
      ResultType: 0,
      ResultCode: 0,
      ResultDesc: "The service request is processed successfully.",
      OriginatorConversationID: `origin-${Math.random()}`,
      ConversationID: `conv-${Math.random()}`,
      TransactionID: `TRX${Math.floor(Math.random() * 1000000)}`,
      ResultParameters: {
        ResultParameter: [
          { Name: "ReceiptNo", Value: "O123456789" }
        ]
      }
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/mpesa/callback/b2c/result`, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
