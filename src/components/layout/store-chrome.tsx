"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Only determines whether the shared store chrome should be visible.
 * Never import the server-side Footer or CMS database helpers here.
 * Server Components can safely be passed as children through this boundary.
 */
export function StoreChromeVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>{children}</>;
}
