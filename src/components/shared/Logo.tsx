
import Link from "next/link";
import { Gamepad2 } from "lucide-react"; // Changed to Gamepad2 for a more generic esport feel

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-primary hover:text-accent transition-colors ${sizeClasses[size]} ${className}`}>
      <Gamepad2 className={`h-auto ${size === 'sm' ? 'w-5' : size === 'md' ? 'w-6' : 'w-7'}`} />
      <span>Apna Esport</span>
    </Link>
  );
}
