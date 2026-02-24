export const runtime = 'edge';
import EventPageContent from "./EventPageContent";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: Props) {
  return <EventPageContent params={params} />;
}
