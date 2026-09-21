export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface TableOfContentItem {
  id: string;
  title: string;
  level: number; // 2 for H2, 3 for H3
}

export interface BlogCalloutTip {
  title: string;
  text: string;
}

export interface BlogContentSection {
  id: string;
  heading: string;
  level: 2 | 3;
  paragraphs: string[];
  bulletList?: string[];
  numberedList?: string[];
  quote?: string;
  tip?: BlogCalloutTip;
  image?: {
    url: string;
    alt: string;
    caption?: string;
  };
  table?: {
    headers: string[];
    rows: string[][];
  };
  recommendedProductIds?: string[]; // IDs from PRODUCTS data
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  featuredImageAlt: string;
  category: string;
  categorySlug: string;
  tags: string[];
  author: BlogAuthor;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number; // in minutes
  isFeatured: boolean;
  isPopular?: boolean;
  isPublished: boolean;
  sections: BlogContentSection[];
  relatedProductIds: string[]; // Connected to PRODUCTS
  relatedArticleSlugs: string[]; // Slugs of related posts
  // SEO Metadata
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  canonicalUrl?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  count?: number;
}
