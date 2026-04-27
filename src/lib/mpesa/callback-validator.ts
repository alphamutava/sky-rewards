const SAFARICOM_IP_RANGES = (process.env.MPESA_ALLOWED_IPS || "").split(",").map((ip) => ip.trim()).filter(Boolean);

function ipToNumber(ip: string): number {
  return ip.split(".").reduce((sum, octet) => (sum >>> 0) * 256 + parseInt(octet), 0) >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = bits ? (~0 << (32 - parseInt(bits))) >>> 0 : 0xFFFFFFFF;
  return (ipToNumber(ip) & mask) === (ipToNumber(range) & mask);
}

export function validateMpesaCallback(request: Request): {
  valid: boolean;
  reason?: string;
  ipAddress?: string;
} {
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET;
  if (!expectedSecret) {
    console.error("[M-Pesa] MPESA_CALLBACK_SECRET not configured — rejecting callback");
    return { valid: false, reason: "Callback secret not configured" };
  }

  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (secret !== expectedSecret) {
    return { valid: false, reason: "Invalid callback secret" };
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const sourceIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

  if (process.env.MPESA_ENVIRONMENT === "production" && SAFARICOM_IP_RANGES.length > 0) {
    const isAllowedIp = SAFARICOM_IP_RANGES.some((range) => {
      if (range.includes("/")) {
        return isIpInCidr(sourceIp, range);
      }
      return sourceIp === range;
    });

    if (!isAllowedIp) {
      return { valid: false, reason: `IP ${sourceIp} not in Safaricom allowlist`, ipAddress: sourceIp };
    }
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return { valid: false, reason: "Invalid content type" };
  }

  return { valid: true, ipAddress: sourceIp };
}

