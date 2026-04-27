import { PaymentGateway } from "@/components/payment-gateway";

type Props = { params: Promise<{ slug: string }> };

export default async function ConfirmationPage({ params }: Props) {
  const { slug } = await params;
  return <PaymentGateway slug={slug} />;
}
