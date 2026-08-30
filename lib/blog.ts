import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { BlogPost, SEED_BLOG_POSTS } from '../src/lib/blog';

const contentDirectory = path.join(process.cwd(), 'content/blog');

export async function getAllBlogPostsServer(): Promise<BlogPost[]> {
  try {
    if (!fs.existsSync(contentDirectory)) {
      return SEED_BLOG_POSTS;
    }
    const fileNames = fs.readdirSync(contentDirectory);
    const allPostsData = await Promise.all(
      fileNames
        .filter((fileName) => fileName.endsWith('.md'))
        .map(async (fileName) => {
          const slug = fileName.replace(/\.md$/, '');
          const fullPath = path.join(contentDirectory, fileName);
          const fileContents = fs.readFileSync(fullPath, 'utf8');
          const matterResult = matter(fileContents);

          const processedContent = await remark()
            .use(html)
            .process(matterResult.content);
          const contentHtml = processedContent.toString();

          return {
            slug,
            title: matterResult.data.title || slug,
            description: matterResult.data.description || '',
            date: matterResult.data.date || '2026-08-01',
            author: matterResult.data.author || 'KDP Studio Team',
            category: matterResult.data.category || 'General',
            tags: matterResult.data.tags || [],
            readTime: matterResult.data.readTime || '5 min read',
            featured: Boolean(matterResult.data.featured),
            content: contentHtml,
            excerpt: matterResult.content.slice(0, 150).replace(/[#*_`]/g, '') + '...',
          } as BlogPost;
        })
    );

    return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch (e) {
    return SEED_BLOG_POSTS;
  }
}

export async function getBlogPostServer(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) {
      return SEED_BLOG_POSTS.find((p) => p.slug === slug) || null;
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    const processedContent = await remark()
      .use(html)
      .process(matterResult.content);
    const contentHtml = processedContent.toString();

    return {
      slug,
      title: matterResult.data.title || slug,
      description: matterResult.data.description || '',
      date: matterResult.data.date || '2026-08-01',
      author: matterResult.data.author || 'KDP Studio Team',
      category: matterResult.data.category || 'General',
      tags: matterResult.data.tags || [],
      readTime: matterResult.data.readTime || '5 min read',
      featured: Boolean(matterResult.data.featured),
      content: contentHtml,
      excerpt: matterResult.content.slice(0, 150).replace(/[#*_`]/g, '') + '...',
    } as BlogPost;
  } catch (e) {
    return SEED_BLOG_POSTS.find((p) => p.slug === slug) || null;
  }
}

export type { BlogPost } from '../src/lib/blog';
export { SEED_BLOG_POSTS, getAllBlogPosts, getBlogPost, getBlogPostsByCategory, getFeaturedPosts, getAllCategories, getAllTags } from '../src/lib/blog';
