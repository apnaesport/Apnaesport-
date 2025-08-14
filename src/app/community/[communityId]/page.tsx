
import type { Metadata } from 'next';
import { getCommunityById, getCommunityMembers } from '@/lib/tournamentStore';
import { notFound } from 'next/navigation';
import { PageTitle } from '@/components/shared/PageTitle';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Badge } from '@/components/ui/badge';
import { Users, Gamepad2, BarChart3, Medal, Home, Camera } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CommunityMember } from '@/lib/types';

interface CommunityPageProps {
    params: { communityId: string };
}

// Helper to get initials from a name
const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

const MemberList = ({ members }: { members: CommunityMember[] }) => {
    if (!members || members.length === 0) {
        return <p className="text-muted-foreground text-center py-4">No members found.</p>;
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
                <Card key={member.uid} className="flex items-center p-4 gap-4">
                    <Avatar>
                        <AvatarImage src={member.avatarUrl} alt={member.displayName} />
                        <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{member.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const community = await getCommunityById(params.communityId);
  if (!community) {
    return { title: 'Community Not Found' };
  }
  return {
    title: `${community.name} | Community`,
    description: community.tagline,
  };
}

export default async function CommunityDetailPage({ params }: CommunityPageProps) {
    const community = await getCommunityById(params.communityId);
    if (!community) {
        notFound();
    }
    const members = await getCommunityMembers(params.communityId);

    return (
        <div className="space-y-8">
            {/* Community Header */}
            <header className="relative h-48 md:h-64 rounded-lg overflow-hidden group shadow-xl border border-border">
                <ImageWithFallback
                    src={community.bannerUrl}
                    fallbackSrc={`https://placehold.co/1200x300.png?text=${encodeURIComponent(community.name)}`}
                    alt={`${community.name} banner`}
                    fill
                    className="object-cover"
                    data-ai-hint="community banner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 md:p-6 lg:p-8 w-full flex flex-col sm:flex-row justify-between items-end gap-4">
                    <div className="flex items-center gap-4">
                         <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                             <ImageWithFallback
                                src={community.logoUrl}
                                fallbackSrc={`https://placehold.co/80x80.png?text=${community.name.substring(0, 2)}`}
                                alt={`${community.name} logo`}
                                fill
                                className="rounded-lg border-2 border-background shadow-md object-cover"
                                data-ai-hint="community logo"
                            />
                        </div>
                        <div>
                             <PageTitle title={community.name} className="mb-0 text-white text-shadow !text-2xl md:!text-3xl" />
                             <p className="text-sm text-slate-200 drop-shadow-sm max-w-md">{community.tagline}</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                         <Button size="lg" className="shadow-lg">Join Community</Button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users />Members</CardTitle><CardDescription className="text-2xl font-bold">{community.memberCount}</CardDescription></CardHeader></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Gamepad2 />Game</CardTitle><CardDescription className="text-2xl font-bold">{community.gameName || 'Variety'}</CardDescription></CardHeader></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 />Level</CardTitle><CardDescription className="text-2xl font-bold">{community.level}</CardDescription></CardHeader></Card>
                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Medal />Points</CardTitle><CardDescription className="text-2xl font-bold">{community.points}</CardDescription></CardHeader></Card>
            </div>
            
            {/* Tabs for Content */}
            <Tabs defaultValue="home" className="w-full">
                <TabsList>
                    <TabsTrigger value="home"><Home className="mr-2 h-4 w-4"/>Home</TabsTrigger>
                    <TabsTrigger value="tournaments" disabled>Tournaments</TabsTrigger>
                    <TabsTrigger value="members"><Users className="mr-2 h-4 w-4"/>Members ({members.length})</TabsTrigger>
                    <TabsTrigger value="media" disabled><Camera className="mr-2 h-4 w-4"/>Media</TabsTrigger>
                    <TabsTrigger value="leaderboard" disabled>Leaderboard</TabsTrigger>
                </TabsList>
                <TabsContent value="home" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-center py-8">Announcements from the community owner will appear here. (Feature coming soon)</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="members" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Community Members</CardTitle></CardHeader>
                        <CardContent>
                            <MemberList members={members} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}
