import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

const DealerLandingSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    {/* Hero */}
    <div className="relative h-[420px] w-full overflow-hidden bg-muted/40">
      <div className="container mx-auto flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
        <Skeleton className="h-20 w-20 rounded-2xl" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
    </div>
    {/* Stats */}
    <div className="border-y border-border bg-card">
      <div className="container mx-auto grid grid-cols-2 gap-px md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
    {/* Inventory */}
    <div className="container mx-auto px-4 py-12">
      <Skeleton className="mb-2 h-7 w-40" />
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-7 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DealerLandingSkeleton;
