import { SeatMapDesigner } from "@/components/organizer/seat-map/seat-map-designer";

type Props = { params: Promise<{ eventCode: string }> };

export default async function OrganizerSeatMapPage({ params }: Props) {
  const { eventCode } = await params;
  return <SeatMapDesigner eventCode={eventCode} />;
}
