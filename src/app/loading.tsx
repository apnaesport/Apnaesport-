
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function Loading() {
  // A global loading spinner that appears during page navigation.
  return <LoadingSpinner fullPage showLogo showProgressBar />;
}
