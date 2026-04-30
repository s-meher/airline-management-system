"use client";

import { DemoBookingProvider } from "@/lib/store/demoBookings";

export function Providers({ children }: { children: React.ReactNode }) {
  return <DemoBookingProvider>{children}</DemoBookingProvider>;
}

