
import { PageTitle } from "@/components/shared/PageTitle";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import MonetizationClient from "./MonetizationClient";

export default function AdminMonetizationPage() {

  return (
    <SiteSettingsProvider>
      <div className="space-y-8">
        <PageTitle
          title="Monetization & Promotions"
          subtitle="Manage the promotion board and ad placements across the site."
        />
        <MonetizationClient />
      </div>
    </SiteSettingsProvider>
  );
}
