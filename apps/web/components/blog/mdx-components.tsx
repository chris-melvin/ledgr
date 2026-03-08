import type { ComponentPropsWithoutRef } from "react";
import Link from "next/link";

type MDXComponents = Record<string, React.ComponentType<ComponentPropsWithoutRef<any>>>;

export const mdxComponents: MDXComponents = {
  a: ({ href, children, ...props }) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className="text-teal-600 hover:text-teal-700" {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-600 hover:text-teal-700"
        {...props}
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children, ...props }) => (
    <blockquote className="border-l-4 border-teal-300 pl-4 italic text-stone-600" {...props}>
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }) => (
    <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-sm text-stone-800" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre className="overflow-x-auto rounded-lg bg-stone-900 p-4 font-mono text-sm text-stone-100" {...props}>
      {children}
    </pre>
  ),
  img: ({ alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} className="rounded-lg" {...props} />
  ),
};
