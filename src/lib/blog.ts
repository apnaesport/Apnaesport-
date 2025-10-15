
import posts from './blog-posts.json';

export interface BlogPost {
    slug: string;
    title: string;
    description: string;
    date: string;
    author: string;
    image: string;
    tags: string[];
    content: string;
}

export function getAllBlogPosts(): BlogPost[] {
    // The JSON file is an object with a "posts" key
    const allPosts = posts.posts as BlogPost[];
    
    // Sort posts by date in descending order (newest first)
    return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
    const allPosts = getAllBlogPosts();
    return allPosts.find(post => post.slug === slug);
}
