type BlogContentProps = {
  content: string;
};

export function BlogContent({ content }: BlogContentProps) {
  return <div className="blog-content mt-10" dangerouslySetInnerHTML={{ __html: content }} />;
}
