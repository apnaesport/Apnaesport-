
import Link from "next/link";
import { Swords } from "lucide-react"; // Using Swords icon for gaming theme

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-primary hover:text-accent transition-colors ${sizeClasses[size]} ${className}`}>
      <Swords className={`h-auto ${size === 'sm' ? 'w-5' : size === 'md' ? 'w-6' : 'w-7'}`} />
      <span>TournamentHub</span>
    </Link>
  );
}
