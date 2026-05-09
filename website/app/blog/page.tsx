import type { Metadata } from "next";

import { Footer } from "../../components/footer";
import { CategoryFilter } from "./components/CategoryFilter";
import { BlogSearchSection } from "./components/BlogSearchSection";
import { getBlogPosts } from "./data";

type BlogListPageProps = {
  searchParams?: {
    category?: string;
  };
};

export const metadata: Metadata = {
  title: "Tutoring Tips Blog for Ottawa Parents | Kriana Tutoring",
  description:
    "Read tutoring tips, math help ideas, reading support strategies, and parent resources from Kriana Tutoring for Ottawa-area families."
};

export default function BlogListPage({ searchParams }: BlogListPageProps) {
  const activeCategory = searchParams?.category;
  const posts = getBlogPosts(activeCategory);

  return (
    <>
      <main className="min-h-screen">
        <section className="px-6 pb-12 pt-10 sm:px-10 lg:pt-14">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(232,249,255,0.92),rgba(255,247,237,0.9))] px-6 py-10 shadow-[0_20px_60px_rgba(6,11,26,0.08)] sm:px-10 sm:py-14">
              <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-brand-sky/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-brand-amber/20 blur-3xl" />
              <div className="relative max-w-3xl">
                <span className="inline-flex rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#0A5B8C] ring-1 ring-[#D3E8F5]">
                  Kriana Resources
                </span>
                <h1 className="mt-5 text-4xl font-semibold leading-tight text-[#0A2D5A] sm:text-5xl">
                  Helpful tutoring articles for Ottawa parents who want calm, confident learners.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  Explore practical parent tips, learning strategies, and Kriana insights on math tutoring for kids,
                  reading help, and homework routines that support stronger learning at home.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur-sm sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[#0A2D5A]">Browse articles</h2>
                  <p className="mt-2 text-slate-600">
                    Filter by topic or explore the latest posts.
                  </p>
                </div>
                <CategoryFilter activeCategory={activeCategory} />
              </div>

              {posts.length > 0 ? (
                <BlogSearchSection posts={posts} />
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-600">
                  No posts found for that category yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
