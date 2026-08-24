import type { MetadataRoute } from "next";

import { blogPosts } from "./blog/data";
import { servicePages } from "./tutoring/data";

const baseUrl = "https://www.krianatutoring.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/about", "/birthday", "/blog", "/contact", "/practice-tests", "/register", "/robotics", "/tutoring", "/worksheets"];

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  })) satisfies MetadataRoute.Sitemap;

  const blogEntries = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.8
  }));

  const serviceEntries = servicePages.map((service) => ({
    url: `${baseUrl}/tutoring/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8
  }));

  return [...staticEntries, ...blogEntries, ...serviceEntries];
}
