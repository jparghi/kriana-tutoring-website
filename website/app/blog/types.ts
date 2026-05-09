export const BLOG_CATEGORIES = [
  "Parent Tips",
  "Learning Strategies",
  "Kriana Approach"
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  category: BlogCategory;
  date: string;
  excerpt: string;
  content: string;
  image?: string;
  imageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
};
