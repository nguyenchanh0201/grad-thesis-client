import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

const VNPAY_SANDBOX_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

export async function POST(req: NextRequest) {
  const {
    invoiceId,
    amount,
    slug,
  }: { invoiceId: string; amount: number; slug: string } = await req.json();

  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  if (!tmnCode || !hashSecret) {
    const mockUrl = new URL(`/buy/${slug}/result`, baseUrl);
    mockUrl.searchParams.set("mock", "success");
    mockUrl.searchParams.set("invoiceId", invoiceId);
    mockUrl.searchParams.set("amount", String(amount));
    return NextResponse.json({ paymentUrl: mockUrl.toString() });
  }

  const returnUrl = new URL(`/buy/${slug}/result`, baseUrl).toString();
  const ipAddr =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "127.0.0.1";

  const now = new Date();
  const createDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const params: Record<string, string> = {
    vnp_Amount: String(amount * 100),
    vnp_Command: "pay",
    vnp_CreateDate: createDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: ipAddr,
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan don hang ${invoiceId}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: returnUrl,
    vnp_TmnCode: tmnCode,
    vnp_TxnRef: invoiceId,
    vnp_Version: "2.1.0",
  };

  // Sort alphabetically — required by VNPay signature spec
  const sorted = Object.fromEntries(
    Object.entries(params).sort(([a], [b]) => a.localeCompare(b)),
  );

  const signData = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const secureHash = createHmac("sha512", hashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  sorted.vnp_SecureHash = secureHash;

  const paymentUrl = `${VNPAY_SANDBOX_URL}?${new URLSearchParams(sorted).toString()}`;
  return NextResponse.json({ paymentUrl });
}
