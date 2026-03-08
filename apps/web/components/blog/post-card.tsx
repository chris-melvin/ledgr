import Link from "next/link";
import type { PostMeta } from "@/lib/blog";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-stone-200 bg-white p-6 transition-all hover:border-teal-300 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-stone-500">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <span>&middot;</span>
        <span>{post.author}</span>
      </div>

      <h2 className="font-serif text-xl font-semibold text-stone-900 group-hover:text-teal-700 transition-colors">
        {post.title}
      </h2>

      {post.description && (
        <p className="mt-2 text-stone-600 line-clamp-2">{post.description}</p>
      )}

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
