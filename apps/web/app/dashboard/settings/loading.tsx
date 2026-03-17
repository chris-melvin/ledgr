import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 h-14 px-4 flex items-center gap-3 border-b border-stone-200/60 bg-white/80 backdrop-blur-sm">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-20" />
      </header>

      {/* Content skeleton */}
      <main className="max-w-3xl mx-auto p-4 pb-20">
        {/* Tab strip skeleton */}
        <Skeleton className="h-9 w-full rounded-lg mb-6" />

        {/* Settings card skeleton */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
