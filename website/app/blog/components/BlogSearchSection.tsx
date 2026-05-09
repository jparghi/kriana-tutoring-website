"use client";

import { useState } from "react";
import { BlogList } from "./BlogList";
import type { BlogPost } from "../types";

type BlogSearchSectionProps = {
  posts: BlogPost[];
};

export function BlogSearchSection({ posts }: BlogSearchSectionProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(query.toLowerCase())
      )
    : posts;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 shadow-sm focus:border-brand-sky focus:outline-none focus:ring-2 focus:ring-brand-sky/30 sm:max-w-sm"
        />
      </div>

      {filtered.length > 0 ? (
        <BlogList posts={filtered} />
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-600">
          No articles match &ldquo;{query}&rdquo;.
        </div>
      )}
    </div>
  );
}
