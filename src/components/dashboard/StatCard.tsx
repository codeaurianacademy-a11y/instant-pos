import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, hint, tone = "default", icon }: StatCardProps) {
  return (
    <Card className="hover:border-slate-300 transition-all duration-150 shadow-xs">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>
        <p className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight text-foreground">{value}</p>
        {hint && (
          <p
            className={cn(
              "mt-2 text-xs font-medium inline-flex items-center gap-1",
              tone === "warning" && "text-amber-600 font-semibold",
              tone === "danger" && "text-red-600 font-semibold",
              tone === "success" && "text-emerald-600 font-semibold",
              tone === "default" && "text-muted"
            )}
          >
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
