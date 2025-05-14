
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function Loading() {
  // This component is used by Next.js for navigation fallbacks.
  // We'll provide a generic "Loading page..." message here initially.
  return <LoadingSpinner fullPage showLogo showProgressBar text="Loading page..." />;
}
