import { History } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "History — SocialLens" };

export default function HistoryPage() {
  return (
    <ComingSoon
      icon={History}
      title="History is coming soon"
      description="Every analysis you run will be listed here, searchable and sortable by score, status, and date."
    />
  );
}
