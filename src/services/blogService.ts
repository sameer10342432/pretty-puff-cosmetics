import { BLOG_CATEGORIES } from '../data/blogCategories';
import { BLOG_POSTS } from '../data/blogPosts';
import { BlogCategory, BlogPost } from '../types/blog';

export const blogService = {
  // Retrieve all published articles
  getAllPosts(): BlogPost[] {
    return BLOG_POSTS.filter(post => post.isPublished);
  },

  // Retrieve featured article
  getFeaturedPost(): BlogPost {
    return (
      BLOG_POSTS.find(post => post.isFeatured && post.isPublished) ||
      BLOG_POSTS[0]
    );
  },

  // Retrieve post by slug
  getPostBySlug(slug: string): BlogPost | undefined {
    return BLOG_POSTS.find(
      post => post.slug.toLowerCase() === slug.toLowerCase() && post.isPublished
    );
  },

  // Filter posts by category slug
  getPostsByCategory(categorySlug: string): BlogPost[] {
    if (!categorySlug || categorySlug === 'all') {
      return this.getAllPosts();
    }
    return BLOG_POSTS.filter(
      post =>
        post.categorySlug.toLowerCase() === categorySlug.toLowerCase() &&
        post.isPublished
    );
  },

  // Search posts by title, excerpt, category, keywords, tags
  searchPosts(query: string, categorySlug?: string): BlogPost[] {
    let posts = this.getPostsByCategory(categorySlug || 'all');
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return posts;

    return posts.filter(post => {
      const matchTitle = post.title.toLowerCase().includes(cleanQuery);
      const matchExcerpt = post.excerpt.toLowerCase().includes(cleanQuery);
      const matchCategory = post.category.toLowerCase().includes(cleanQuery);
      const matchTags = post.tags.some(tag => tag.toLowerCase().includes(cleanQuery));
      const matchKeywords =
        post.focusKeyword.toLowerCase().includes(cleanQuery) ||
        post.secondaryKeywords.some(kw => kw.toLowerCase().includes(cleanQuery));
      const matchSections = post.sections.some(
        sec =>
          sec.heading.toLowerCase().includes(cleanQuery) ||
          sec.paragraphs.some(p => p.toLowerCase().includes(cleanQuery))
      );

      return (
        matchTitle ||
        matchExcerpt ||
        matchCategory ||
        matchTags ||
        matchKeywords ||
        matchSections
      );
    });
  },

  // Get popular reads
  getPopularPosts(limit: number = 4): BlogPost[] {
    return BLOG_POSTS.filter(post => post.isPopular && post.isPublished).slice(
      0,
      limit
    );
  },

  // Get related articles for a given post
  getRelatedPosts(currentPost: BlogPost, limit: number = 3): BlogPost[] {
    // 1. Check explicit related slugs
    if (currentPost.relatedArticleSlugs && currentPost.relatedArticleSlugs.length > 0) {
      const explicit = currentPost.relatedArticleSlugs
        .map(slug => this.getPostBySlug(slug))
        .filter((p): p is BlogPost => !!p && p.id !== currentPost.id);
      if (explicit.length >= limit) {
        return explicit.slice(0, limit);
      }
    }

    // 2. Fallback to same category or matching tags
    const sameCategory = BLOG_POSTS.filter(
      p =>
        p.id !== currentPost.id &&
        p.isPublished &&
        p.categorySlug === currentPost.categorySlug
    );

    const sameTags = BLOG_POSTS.filter(
      p =>
        p.id !== currentPost.id &&
        p.isPublished &&
        p.tags.some(t => currentPost.tags.includes(t)) &&
        !sameCategory.some(sc => sc.id === p.id)
    );

    const combined = [...sameCategory, ...sameTags];
    if (combined.length >= limit) {
      return combined.slice(0, limit);
    }

    // 3. Fallback to any published articles
    const others = BLOG_POSTS.filter(
      p => p.id !== currentPost.id && p.isPublished && !combined.some(c => c.id === p.id)
    );

    return [...combined, ...others].slice(0, limit);
  },

  // Retrieve all categories with counts
  getCategories(): BlogCategory[] {
    const allPosts = this.getAllPosts();
    return BLOG_CATEGORIES.map(cat => {
      if (cat.slug === 'all') {
        return { ...cat, count: allPosts.length };
      }
      const count = allPosts.filter(
        p => p.categorySlug.toLowerCase() === cat.slug.toLowerCase()
      ).length;
      return { ...cat, count };
    });
  },

  // Retrieve category info by slug
  getCategoryBySlug(slug: string): BlogCategory | undefined {
    return BLOG_CATEGORIES.find(
      c => c.slug.toLowerCase() === slug.toLowerCase()
    );
  },
};
