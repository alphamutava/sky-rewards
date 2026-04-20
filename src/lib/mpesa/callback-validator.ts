const SAFARICOM_IP_RANGES = (process.env.MPESA_ALLOWED_IPS || "").split(",").map((ip) => ip.trim());

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  const ipNum = ip.split(".").reduce((sum, octet) => (sum << 8) + parseInt(octet), 0);
  const rangeNum = range.split(".").reduce((sum, octet) => (sum << 8) + parseInt(octet), 0);
  return (ipNum & mask) === (rangeNum & mask);
}

export function validateMpesaCallback(request: Request): {
  valid: boolean;
  reason?: string;
  ipAddress?: string;
} {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (secret !== process.env.MPESA_CALLBACK_SECRET) {
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
