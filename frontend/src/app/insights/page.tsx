import { LineChart } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Insights — SocialLens" };

export default function InsightsPage() {
  return (
    <ComingSoon
      icon={LineChart}
      title="Insights are coming soon"
      description="Track your average scores over time and see the most common weaknesses across everything you've analyzed."
    />
  );
}
