import { Skeleton } from "@/components/ui/skeleton";

const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Navbar skeleton */}
    <div className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Skeleton className="h-8 w-32" />
        <div className="hidden gap-4 md:flex">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
    {/* Content skeleton */}
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-8 w-64" />
      <Skeleton className="mb-4 h-4 w-96" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default PageSkeleton;
