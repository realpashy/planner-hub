import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  card?: boolean;
}

export function LoadingSkeleton({ lines = 3, className, card = true }: LoadingSkeletonProps) {
  return (
    <div className={cn(card && "rounded-[1.6rem] border border-border/70 bg-card/80 p-4 shadow-sm", className)}>
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3 rounded-full" />
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className={cn("h-4 rounded-full", index === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}
