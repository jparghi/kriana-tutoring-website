import { BlogCard } from "./BlogCard";
import type { BlogPost } from "../types";

type BlogListProps = {
  posts: BlogPost[];
};

export function BlogList({ posts }: BlogListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <BlogCard
          key={post.id}
          title={post.title}
          slug={post.slug}
          category={post.category}
          date={post.date}
          excerpt={post.excerpt}
          image={post.image}
          imageAlt={post.imageAlt}
        />
      ))}
    </div>
  );
}
