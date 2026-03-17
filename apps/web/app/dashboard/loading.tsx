import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="h-screen flex flex-col bg-[#FDFBF7]">
      {/* Header skeleton */}
      <header className="flex-shrink-0 h-14 sm:h-12 px-3 sm:px-4 flex items-center justify-between border-b border-neutral-200 bg-white/80">
        <Skeleton className="h-5 w-16" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </header>

      {/* Tab strip skeleton */}
      <div className="flex-shrink-0 flex justify-center py-2 border-b border-neutral-100 bg-white/60">
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>

      {/* Content skeleton */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto p-3 sm:p-4 space-y-4">
          {/* Week strip skeleton */}
          <div className="flex justify-between gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>

          {/* Hero card skeleton */}
          <Skeleton className="h-48 w-full rounded-2xl" />

          {/* Expense list skeleton */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="divide-y divide-neutral-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
