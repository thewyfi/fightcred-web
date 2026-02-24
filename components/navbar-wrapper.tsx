"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr: false to avoid tRPC hook issues during prerender
const NavbarClient = dynamic(
  () => import("@/components/navbar").then((m) => ({ default: m.Navbar })),
  {
    ssr: false,
    loading: () => <div className="h-14 border-b border-[#333] bg-[#0A0A0A]" />,
  }
);

export function NavbarWrapper() {
  return <NavbarClient />;
}
