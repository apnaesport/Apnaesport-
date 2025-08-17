
import type { Metadata } from 'next';
import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, Star, Users } from 'lucide-react';
import { CreatorCard, type Creator } from '@/components/creators/CreatorCard';
import { TopCreatorItem, type TopCreator } from '@/components/creators/TopCreatorItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: "Creator Hub",
  description: "Discover and support rising gaming creators on Apna Esport. Vote for your favorite streamers, view top-ranked creators, and join the community.",
  keywords: ["Apna Esport creators", "gaming creators", "streamer showcase", "top gaming streamers", "creator on rise"],
};

// Placeholder data for creators
const creators: Creator[] = [
  {
    name: 'RexPlays',
    tags: 'FPS',
    followers: '45k',
    votes: '5.2k',
    avatarUrl: 'https://placehold.co/56x56.png',
    dataAiHint: 'female gamer',
  },
  {
    name: 'NeonNinja',
    tags: 'MOBA',
    followers: '18k',
    votes: '2.0k',
    avatarUrl: 'https://placehold.co/56x56.png',
    dataAiHint: 'male gamer',
  },
  {
    name: 'PixelPioneer',
    tags: 'Indie',
    followers: '8.7k',
    votes: '1.1k',
    avatarUrl: 'https://placehold.co/56x56.png',
    dataAiHint: 'male gamer glasses',
  },
   {
    name: 'StormCaller',
    tags: 'Battle Royale',
    followers: '32k',
    votes: '4.8k',
    avatarUrl: 'https://placehold.co/56x56.png',
    dataAiHint: 'female gamer angry',
  },
  {
    name: 'GhostRider',
    tags: 'Racing',
    followers: '25k',
    votes: '3.5k',
    avatarUrl: 'https://placehold.co/56x56.png',
    dataAiHint: 'male gamer serious',
  },
   {
    name: 'PuzzleQueen',
    tags: 'Strategy',
    followers: '12k',
    votes: '1.9k',
    avatarUrl: 'https://placehold.co/56x56.png',
    dataAiHint: 'female gamer happy',
  },
];

const topCreators: TopCreator[] = [
  { rank: 1, name: 'RexPlays', tags: 'FPS • 45k', tier: 'gold' },
  { rank: 2, name: 'StormCaller', tags: 'Battle Royale • 32k', tier: 'silver' },
  { rank: 3, name: 'NeonNinja', tags: 'MOBA • 18k', tier: 'bronze' },
];

export default function CreatorHubPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card/50 border border-primary/20 shadow-lg">
           <CardContent className="p-6">
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent rounded-full mb-4 shadow-[0_0_15px_hsl(var(--primary))]"/>
              <PageTitle
                title="Where Rising Creators Get Noticed"
                subtitle="Apna Esport Creator helps small and mid-level gaming creators grow with community voting, featured showcases, and verified creator badges."
                className="mb-0"
              />
              <div className="mt-6 flex gap-4 items-center">
                  <Button><Star className="mr-2 h-4 w-4"/> Get Featured</Button>
                  <Button variant="outline">Create Campaign</Button>
              </div>
           </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search creators by name, game, or tag..." className="pl-9"/>
            </div>
            <Button variant="ghost"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {creators.map(creator => <CreatorCard key={creator.name} creator={creator} />)}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Join the Hub</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                 <Button className="w-full">Join as Creator</Button>
                 <Button variant="outline" className="w-full">Explore Creators</Button>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Creators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCreators.map(creator => <TopCreatorItem key={creator.rank} creator={creator} />)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
