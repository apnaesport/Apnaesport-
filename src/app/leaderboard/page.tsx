

import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { LeaderboardClientPage } from "./LeaderboardClientPage";
import { getAllUsersFromFirestore } from "@/lib/tournamentStore";

export const metadata: Metadata = {
  title: "Leaderboard - Top Players | Apna Esport",
  description: "See the top players on Apna Esport. Check your rank, view points, and see who's dominating the competition in our official leaderboard.",
};

export default async function LeaderboardPage() {
  const allUsers = await getAllUsersFromFirestore();
  const sortedUsers = allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <>
      <PageTitle title="Leaderboard" subtitle="Top players on Apna Esport. Points are illustrative for now." />
      <LeaderboardClientPage allUsers={sortedUsers} />
    </>
  );
}
