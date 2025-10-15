
import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/PageTitle";
import { getAllBlogPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";

export const metadata: Metadata = {
  title: "Blog - Apna Esport",
  description: "Latest news, tips, and articles from the Apna Esport community. Stay updated on tournaments, game strategies, and more.",
};

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="space-y-8">
      <PageTitle
        title="Apna Esport Blog"
        subtitle="News, updates, and winning strategies from the heart of the community."
      />
      
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Posts Yet</h3>
            <p className="text-muted-foreground mt-2">
                Check back soon for news and articles!
            </p>
        </div>
      )}
    </div>
  );
}
