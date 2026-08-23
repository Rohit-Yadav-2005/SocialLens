import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: string;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <Card className="lift group relative overflow-hidden p-5">
      <span
        aria-hidden="true"
        className="bg-spectral absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
      />
      <CardContent className="p-0">
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </p>
        <p data-numeric className="font-display mt-2 text-4xl leading-none font-semibold">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
