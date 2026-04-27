import { EnterInformation } from "@/components/enter-information";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function InfoPage({ params }: Props) {
  const { slug } = await params;
  return <EnterInformation slug={slug} />;
}
