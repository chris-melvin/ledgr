import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft } from "lucide-react";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { mdxComponents } from "@/components/blog/mdx-components";

export const revalidate = 86400;

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} - ledgr blog`,
    description: post.description,
    alternates: {
      canonical: `https://ledgr.ink/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://ledgr.ink/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      siteName: "ledgr",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: post.author,
      url: "https://ledgr.ink",
    },
    publisher: {
      "@type": "Organization",
      name: "ledgr",
      url: "https://ledgr.ink",
    },
    url: `https://ledgr.ink/blog/${slug}`,
    keywords: post.tags.join(", "),
  };

  return (
    <div className="py-16 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blog
        </Link>

        <header className="mb-10">
          {post.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
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
        </header>

        <article className="prose prose-stone prose-lg max-w-none">
          <MDXRemote source={post.content} components={mdxComponents} />
        </article>
      </div>
    </div>
  );
}
