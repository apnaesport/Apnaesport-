
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/lib/blog';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 group">
      <CardHeader className="p-0 relative h-56">
        <Link href={`/blog/${post.slug}`} aria-label={post.title}>
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
        </Link>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <div className="mb-2 flex flex-wrap gap-2">
            {post.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
        </div>
        <CardTitle className="text-xl mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </CardTitle>
        <CardDescription className="line-clamp-3">{post.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex justify-between items-center text-sm text-muted-foreground">
        <span>{format(new Date(post.date), 'MMM dd, yyyy')}</span>
        <Button asChild variant="link" className="p-0 h-auto">
            <Link href={`/blog/${post.slug}`}>
                Read More <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
