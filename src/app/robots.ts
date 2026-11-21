import type { MetadataRoute } from "next";
import { PROTECTED_PATHS } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

/**
 * Public pages may be crawled and indexed. The authenticated application area
 * (dashboard and all module routes) and the auth pages are excluded.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PROTECTED_PATHS, "/auth/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}