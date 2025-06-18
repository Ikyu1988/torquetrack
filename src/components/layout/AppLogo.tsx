import Link from "next/link";
import { Wrench } from "lucide-react"; // Using Wrench as a placeholder icon

export function AppLogo({ collapsed } : { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity duration-200">
      <Wrench className={`h-8 w-8 ${collapsed ? 'h-7 w-7' : 'h-8 w-8'} text-primary`} />
      {!collapsed && <span className="font-headline text-2xl font-bold text-primary">TorqueTrack</span>}
    </Link>
  );
}
