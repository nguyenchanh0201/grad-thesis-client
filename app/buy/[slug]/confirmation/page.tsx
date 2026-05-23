import { PaymentConfirmation } from "@/components/payment-confirmation";

type Props = { params: Promise<{ slug: string }> };

export default async function ConfirmationPage({ params }: Props) {
  const { slug } = await params;
  return <PaymentConfirmation slug={slug} />;
}
