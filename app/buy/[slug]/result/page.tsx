import { BookingResult } from "@/components/payment-gateway/booking-result";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function ResultPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const isSuccess = sp.vnp_ResponseCode === "00";

  const invoiceId = sp.vnp_TxnRef ?? "";
  const amount = sp.vnp_Amount
    ? Math.round(parseInt(sp.vnp_Amount, 10) / 100)
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
