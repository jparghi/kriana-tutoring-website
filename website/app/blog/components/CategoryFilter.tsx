import Link from "next/link";

import { BLOG_CATEGORIES } from "../types";

type CategoryFilterProps = {
  activeCategory?: string;
};

export function CategoryFilter({ activeCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/blog"
        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
          !activeCategory
            ? "bg-[#0A2D5A] text-white shadow-[0_10px_24px_rgba(10,45,90,0.18)]"
            : "bg-white text-[#0A2D5A] ring-1 ring-slate-200 hover:bg-slate-50"
        }`}
      >
        All Posts
      </Link>
      {BLOG_CATEGORIES.map((category) => {
        const isActive = category === activeCategory;

        return (
          <Link
            key={category}
            href={`/blog?category=${encodeURIComponent(category)}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? "bg-[#0A2D5A] text-white shadow-[0_10px_24px_rgba(10,45,90,0.18)]"
                : "bg-white text-[#0A2D5A] ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {category}
          </Link>
        );
      })}
    </div>
  );
}
