import { Suspense } from "react";
import { getRoadmapByStatus, getUserVotedItems } from "@/actions/roadmap";
import { RoadmapBoard } from "@/components/roadmap";
import { getOptionalAuth } from "@/lib/action-utils";
import { RoadmapPageClient } from "./roadmap-client";

export const metadata = {
  title: "Roadmap | ledgr",
  description: "See what we're working on and vote for features you want.",
};

async function RoadmapContent() {
  const [roadmapResult, votedResult, auth] = await Promise.all([
    getRoadmapByStatus(),
    getUserVotedItems(),
    getOptionalAuth(),
  ]);

  if (!roadmapResult.success) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load roadmap. Please try again later.</p>
      </div>
    );
  }

  const votedItemIds = votedResult.success ? votedResult.data : [];
  const isAuthenticated = !!auth;

  return (
    <RoadmapPageClient
      items={roadmapResult.data}
      votedItemIds={votedItemIds}
      isAuthenticated={isAuthenticated}
    />
  );
}

export default function RoadmapPage() {
  return (
    <div className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Product Roadmap
          </h1>
          <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">
            See what we're building and help shape the future of ledgr.
            Vote for features you want to see prioritized.
          </p>
        </div>

        {/* Roadmap Board */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col">
                  <div className="h-8 w-32 bg-stone-200 rounded animate-pulse mb-4" />
                  <div className="space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="h-24 bg-stone-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <RoadmapContent />
        </Suspense>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-stone-500">
            Have a feature request?{" "}
            <a
              href="/login"
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Sign in
            </a>{" "}
            to submit feedback.
          </p>
        </div>
      </div>
    </div>
  );
}
