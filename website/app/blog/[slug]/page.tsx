import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "../../../components/footer";
import { breadcrumbSchema, siteUrl, toJsonLd } from "../../../lib/seo";
import { BlogDetail } from "../components/BlogDetail";
import { blogPosts, getBlogPostBySlug } from "../data";

type BlogPostPageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: BlogPostPageProps): Metadata {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Blog Post Not Found",
      description: "The requested Kriana Tutoring article could not be found."
    };
  }

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    alternates: { canonical: `${siteUrl}/blog/${post.slug}` }
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const postBreadcrumb = breadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Blog", url: `${siteUrl}/blog` },
    { name: post.title, url: `${siteUrl}/blog/${post.slug}` }
  ]);

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    author: {
      "@type": "Organization",
      name: "Kriana Tutoring"
    },
    publisher: {
      "@type": "Organization",
      name: "Kriana Tutoring",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/images/kriana-logo-icon-large.png`
      }
    }
  };

  return (
    <>
      <main className="min-h-screen px-6 pb-20 pt-10 sm:px-10 lg:pt-14">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(postBreadcrumb) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(blogPostingSchema) }}
        />
        <div className="mx-auto max-w-5xl">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-semibold uppercase tracking-[0.18em] text-[#0A5B8C] hover:text-[#0A2D5A]"
          >
            ← Back to Blog
          </Link>
          <div className="mt-6">
            <BlogDetail post={post} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
