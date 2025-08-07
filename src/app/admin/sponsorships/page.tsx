
import { PageTitle } from "@/components/shared/PageTitle";
import { getSponsorshipRequestsFromFirestore } from "@/lib/tournamentStore";
import type { SponsorshipRequest } from "@/lib/types";
import AdminSponsorshipsClient from "./AdminSponsorshipsClient";

// Helper to convert Firestore Timestamps to serializable format
const serializeRequests = (requests: SponsorshipRequest[]): any[] => {
  return requests.map(req => {
    const newReq = { ...req };
    if (newReq.createdAt && typeof (newReq.createdAt as any).toDate === 'function') {
      (newReq.createdAt as any) = (newReq.createdAt as any).toDate().toISOString();
    }
    return newReq;
  });
};

export default async function AdminSponsorshipsPage() {
  const rawRequests = await getSponsorshipRequestsFromFirestore();
  const requests = serializeRequests(rawRequests);

  return (
    <div className="space-y-8">
      <PageTitle
        title="Sponsorship Management"
        subtitle="Review and manage incoming sponsorship and partnership requests."
      />
      <AdminSponsorshipsClient initialRequests={requests} />
    </div>
  );
}
