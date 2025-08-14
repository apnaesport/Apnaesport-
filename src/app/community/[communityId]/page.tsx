
// This is a placeholder file for the community detail page.
// We will build this out in the next step.

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CommunityDetailPage({ params }: { params: { communityId: string } }) {
    return (
        <div className="space-y-8">
            <PageTitle
                title={`Community: ${params.communityId}`}
                subtitle="This page is under construction. More features coming soon!"
                actions={
                    <Button asChild>
                        <Link href="/community">Back to Communities</Link>
                    </Button>
                }
            />
             <div className="text-center py-10">
                <p className="text-muted-foreground">Detailed community view with tabs for home, tournaments, members, and more will be here.</p>
            </div>
        </div>
    )
}
