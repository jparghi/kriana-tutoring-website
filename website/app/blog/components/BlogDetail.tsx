import Link from "next/link";

import { blogCategoryStyles, formatBlogDate, getRelatedBlogPosts } from "../data";
import type { BlogPost } from "../types";
import { BlogContent } from "./BlogContent";

type BlogDetailProps = {
  post: BlogPost;
};

export function BlogDetail({ post }: BlogDetailProps) {
  const categoryStyle = blogCategoryStyles[post.category];
  const relatedPosts = getRelatedBlogPosts(post.slug, post.category);

  return (
    <article className="rounded-[2rem] border border-white/70 bg-white/95 p-6 shadow-soft ring-1 ring-slate-100/80 sm:p-8 lg:p-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${categoryStyle.pill}`}>
          {post.category}
        </span>
        <time className="text-sm text-slate-500" dateTime={post.date}>
          {formatBlogDate(post.date)}
        </time>
      </div>

      <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-[#0A2D5A] sm:text-4xl lg:text-5xl">
        {post.title}
      </h1>

      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{post.excerpt}</p>

      <BlogContent content={post.content} />

      <section className="mt-12 rounded-[1.75rem] border border-slate-200 bg-slate-50 px-6 py-8 sm:px-8">
        <h2 className="text-2xl font-semibold text-[#0A2D5A]">Explore more Kriana resources</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Keep exploring with quick links to our homepage, tutoring services, and more parent-friendly articles.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Visit Homepage
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            View Tutoring Services
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Browse All Blog Posts
          </Link>
        </div>
        {relatedPosts.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                href={`/blog/${relatedPost.slug}`}
                className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-brand-sky/40"
              >
                <h3 className="text-lg font-semibold text-[#0A2D5A]">{relatedPost.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{relatedPost.excerpt}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-12 rounded-[1.75rem] bg-[#0A2D5A] px-6 py-8 text-white shadow-[0_18px_50px_rgba(10,45,90,0.18)] sm:px-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8CD9FF]">Need support now?</p>
        <h2 className="mt-3 text-2xl font-semibold">Book a Free Assessment</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/85">
          If your child is struggling with math or reading, Kriana Tutoring offers personalized support in a confidence-building environment. Book a free assessment today.
        </p>
        <Link
          href="/contact#consultation-form"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#0A2D5A] transition-all duration-200 hover:scale-[1.02]"
        >
          Book a Free Assessment
        </Link>
      </section>
    </article>
  );
}
