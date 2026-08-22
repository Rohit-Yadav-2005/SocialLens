"use client";

import { useQuery } from "@tanstack/react-query";

import { getInsights } from "@/lib/api";

export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: getInsights,
  });
}
