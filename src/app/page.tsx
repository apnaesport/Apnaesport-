
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// This page is no longer directly used because of the redirect in next.config.js.
// However, it's kept as a fallback during development or if the redirect is removed.
export default function HomePage() {
  return <LoadingSpinner fullPage showLogo showProgressBar text="Initializing Apna Esport..." />;
}
