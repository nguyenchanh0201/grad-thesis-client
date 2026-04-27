import { Payment } from "@/components/payment";

type Props = { params: Promise<{ slug: string }> };

export default async function PaymentPage({ params }: Props) {
  const { slug } = await params;
  return <Payment slug={slug} />;
}
