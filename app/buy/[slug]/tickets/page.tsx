import { TicketSelection } from "@/components/ticket-selection";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TicketsPage({ params }: Props) {
  const { slug } = await params;
  return <TicketSelection slug={slug} />;
}
