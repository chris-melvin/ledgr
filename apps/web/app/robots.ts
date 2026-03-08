import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/admin/", "/api/", "/auth/", "/setup"],
      },
    ],
    sitemap: "https://ledgr.ink/sitemap.xml",
  };
}
