"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Trophy, Swords, User, LayoutList, LogOut } from "lucide-react";

const navLinks = [
  { href: "/", label: "Events", icon: LayoutList },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/picks", label: "My Picks", icon: Swords },
  { href: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/login"; },
  });

  return (
    <header className="sticky top-0 z-50 border-b border-[#333] bg-[#0A0A0A]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#D20A0A] flex items-center justify-center font-black text-white text-sm group-hover:bg-[#b00808] transition-colors">
              FC
            </div>
            <span className="font-bold text-white text-lg tracking-tight hidden sm:block">
              Fight<span className="text-[#D20A0A]">Cred</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = href === "/" ? pathname === "/" : (pathname ?? "").startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#D20A0A]/15 text-[#D20A0A]"
                      : "text-[#9A9A9A] hover:text-white hover:bg-[#1A1A1A]"
                  )}
                >
                  <Icon size={15} />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth area */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                {profile && (
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#333] hover:border-[#D20A0A]/50 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#D20A0A] flex items-center justify-center text-xs font-bold text-white">
                      {profile.username?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm text-white font-medium">{profile.username}</span>
                    <span className="text-xs text-[#C9A84C] font-bold">{profile.credibilityScore}</span>
                  </Link>
                )}
                <button
                  onClick={() => logoutMutation.mutate()}
                  className="p-2 rounded-lg text-[#9A9A9A] hover:text-white hover:bg-[#1A1A1A] transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D20A0A] hover:bg-[#b00808] text-white text-sm font-semibold transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
