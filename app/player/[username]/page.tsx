export const runtime = 'edge';
import PlayerPageContent from "./PlayerPageContent";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function PlayerPage({ params }: Props) {
  return <PlayerPageContent params={params} />;
}
