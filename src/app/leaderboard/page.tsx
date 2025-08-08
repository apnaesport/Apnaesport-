

import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { LeaderboardClientPage } from "./LeaderboardClientPage";

export const metadata: Metadata = {
  title: "Leaderboard - Top Players | Apna Esport",
  description: "See the top players on Apna Esport. Check your rank, view points, and see who's dominating the competition in our official leaderboard.",
};

export default function LeaderboardPage() {
  return (
    <>
      <PageTitle title="Leaderboard" subtitle="Top players on Apna Esport. Points are illustrative for now." />
      <LeaderboardClientPage />
    </>
  );
}
