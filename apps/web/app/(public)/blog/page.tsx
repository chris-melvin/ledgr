import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { PostCard } from "@/components/blog/post-card";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Blog - ledgr",
  description:
    "Budgeting tips, financial advice, and product updates from the ledgr team.",
  alternates: {
    canonical: "https://ledgr.ink/blog",
  },
  openGraph: {
    title: "The ledgr Blog",
    description:
      "Budgeting tips, financial advice, and product updates from the ledgr team.",
    url: "https://ledgr.ink/blog",
    type: "website",
    siteName: "ledgr",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
            <BookOpen className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            The ledgr Blog
          </h1>
          <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">
            Budgeting tips, financial insights, and product updates.
          </p>
        </div>

        {/* Post Listing */}
        {posts.length > 0 ? (
          <div className="grid gap-6">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
            <p className="text-stone-500">No posts yet. Check back soon!</p>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-stone-600">
            Have questions or want to contribute a guest post?{" "}
            <a
              href="mailto:hello@ledgr.ink"
              className="text-teal-600 hover:text-teal-700 font-medium"
            >
              Get in touch
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
