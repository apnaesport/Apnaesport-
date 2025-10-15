
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllBlogPosts, getPostBySlug } from '@/lib/blog';
import { PageTitle } from '@/components/shared/PageTitle';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type BlogPostPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | Apna Esport Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: new Date(post.date).toISOString(),
      images: [post.image],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <div className="relative h-60 md:h-80 w-full rounded-lg overflow-hidden mb-4">
            <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
            />
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            <span>{format(new Date(post.date), 'MMMM dd, yyyy')}</span>
            <span>&bull;</span>
            <span>{post.author}</span>
        </div>
        <PageTitle title={post.title} className="mb-0" />
        <div className="mt-2 flex flex-wrap gap-2">
            {post.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
        </div>
      </header>
      
      <div 
        className="prose dark:prose-invert max-w-none prose-lg" 
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
