import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function today(): string {
  return new Date().toISOString().split("T")[0]!;
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  published: boolean;
  tags: string[];
}

export interface Post extends PostMeta {
  content: string;
}

function parseFrontmatter(slug: string, fileContent: string): Post {
  const { data, content } = matter(fileContent);
  return {
    slug,
    title: data.title ?? "Untitled",
    description: data.description ?? "",
    date: data.date ?? "",
    author: data.author ?? "ledgr team",
    published: data.published !== false,
    tags: data.tags ?? [],
    content,
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
      const { content: _, ...meta } = parseFrontmatter(slug, raw);
      return meta;
    })
    .filter((post) => post.published && post.date <= today())
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const post = parseFrontmatter(slug, raw);
  if (!post.published) return null;
  if (post.date > today()) return null;
  return post;
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}
