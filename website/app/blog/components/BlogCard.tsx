import Link from "next/link";

import { blogCategoryStyles, formatBlogDate } from "../data";
import type { BlogPost } from "../types";

type BlogCardProps = Pick<BlogPost, "title" | "slug" | "category" | "date" | "excerpt">;

export function BlogCard({ title, slug, category, date, excerpt }: BlogCardProps) {
  const categoryStyle = blogCategoryStyles[category];

  return (
    <article className="flex h-full flex-col rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-soft ring-1 ring-slate-100/80 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(6,11,26,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${categoryStyle.pill}`}>
          {category}
        </span>
        <time className="shrink-0 text-sm text-slate-500" dateTime={date}>
          {formatBlogDate(date)}
        </time>
      </div>
      <h2 className="mt-5 text-2xl font-semibold leading-tight text-[#0A2D5A]">{title}</h2>
      <p className="mt-4 flex-1 text-base leading-7 text-slate-600 [display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
        {excerpt}
      </p>
      <div className="mt-6">
        <Link
          href={`/blog/${slug}`}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-sky to-brand-teal px-5 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_6px_20px_rgba(74,144,226,0.28)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_26px_rgba(74,144,226,0.35)]"
        >
          Read More
        </Link>
      </div>
    </article>
  );
}
