"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // TanStack's retry scheduler pauses a scheduled retry until
            // the tab regains focus (see query-core's retryer.ts
            // `canContinue`) — if a request fails right as the user
            // switches away, a retry can get stuck waiting for a focus
            // event indefinitely, with no error ever surfacing. This app
            // only talks to its own local backend, so automatic retries
            // buy little resilience anyway; failing fast and letting the
            // user explicitly retry is more predictable.
            retry: false,
            refetchOnWindowFocus: false,
            // No offline-first use case either — always attempt the
            // request rather than pausing on a stray `offline` event.
            networkMode: "always",
          },
          mutations: {
            networkMode: "always",
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
