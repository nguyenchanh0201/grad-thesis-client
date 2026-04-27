import { BookingResult } from "@/components/payment-gateway/booking-result";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function ResultPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const isMock = "mock" in sp;
  const isSuccess = isMock
    ? sp.mock === "success"
    : sp.vnp_ResponseCode === "00";

  const invoiceId = sp.vnp_TxnRef ?? sp.invoiceId ?? "";
  const amount = sp.vnp_Amount
    ? Math.round(parseInt(sp.vnp_Amount) / 100)
    : sp.amount
      ? parseInt(sp.amount)
      : 0;
  const transactionNo = sp.vnp_TransactionNo;

  return (
    <BookingResult
      slug={slug}
      isSuccess={isSuccess}
      invoiceId={invoiceId}
      amount={amount}
      transactionNo={transactionNo}
    />
  );
}
