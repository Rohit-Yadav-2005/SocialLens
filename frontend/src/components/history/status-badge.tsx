import { Badge } from "@/components/ui/badge";
import type { DocumentStatus } from "@/types/api";

const STATUS_LABEL: Record<DocumentStatus, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  processed: "Processed",
  analyzing: "Analyzing",
  analyzed: "Analyzed",
  failed: "Failed",
};

const STATUS_VARIANT: Record<DocumentStatus, "default" | "secondary" | "outline" | "destructive"> = {
  uploaded: "outline",
  processing: "outline",
  processed: "secondary",
  analyzing: "outline",
  analyzed: "default",
  failed: "destructive",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
