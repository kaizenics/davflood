import { cn } from "@/lib/utils";

/** shadcn/ui Skeleton, on this theme's `raised` surface. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-raised animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
