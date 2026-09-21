import React, { useEffect } from 'react';
import { BlogPost } from '../../types/blog';

interface BlogSEOProps {
  post?: BlogPost;
  categoryName?: string;
  isMainPage?: boolean;
}

export const BlogSEO: React.FC<BlogSEOProps> = ({ post, categoryName, isMainPage }) => {
  useEffect(() => {
    // 1. Determine Title & Description
    let pageTitle = 'Pretty Puff Beauty Journal | Makeup Tips, Skincare & Beauty Guides';
    let metaDesc =
      'Explore expert beauty tips, dermatologist-approved skincare guides, makeup tutorials, and product recommendations from the Pretty Puff editorial team.';
    let currentUrl = window.location.href;
    let ogImage =
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80';

    if (post) {
      pageTitle = `${post.seoTitle || post.title} | Pretty Puff Beauty Journal`;
      metaDesc = post.metaDescription || post.excerpt;
      ogImage = post.featuredImage;
    } else if (categoryName && categoryName !== 'All Articles') {
      pageTitle = `${categoryName} Beauty Tips & Guides | Pretty Puff Journal`;
      metaDesc = `Discover professional ${categoryName.toLowerCase()} tutorials, skincare advice, and cosmetic guides from Pretty Puff.`;
    }

    // Set Title
    document.title = pageTitle;

    // Helper for updating/creating meta tags
    const setMetaTag = (nameAttr: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta
    setMetaTag('name', 'description', metaDesc);

    // OpenGraph
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', metaDesc);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', post ? 'article' : 'website');
    setMetaTag('property', 'og:site_name', 'Pretty Puff');

    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', metaDesc);
    setMetaTag('name', 'twitter:image', ogImage);

    // Canonical link tag
    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);

    // JSON-LD Structured Data
    const scriptId = 'pretty-puff-blog-jsonld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    if (post) {
      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.metaDescription || post.excerpt,
        image: [post.featuredImage],
        datePublished: `${post.publishedAt}T08:00:00+05:00`,
        dateModified: `${post.updatedAt || post.publishedAt}T10:00:00+05:00`,
        author: {
          '@type': 'Person',
          name: post.author.name,
          jobTitle: post.author.role,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Pretty Puff',
          logo: {
            '@type': 'ImageObject',
            url: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=400&q=80',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': currentUrl,
        },
        keywords: [post.focusKeyword, ...post.secondaryKeywords, ...post.tags].join(', '),
      };

      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: window.location.origin,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Beauty Journal',
            item: `${window.location.origin}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.category,
            item: `${window.location.origin}/blog/${post.categorySlug}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: post.title,
            item: currentUrl,
          },
        ],
      };

      scriptTag.text = JSON.stringify([articleSchema, breadcrumbSchema]);
    } else {
      const blogHubSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Pretty Puff Beauty Journal',
        description: metaDesc,
        url: currentUrl,
        publisher: {
          '@type': 'Organization',
          name: 'Pretty Puff',
        },
      };
      scriptTag.text = JSON.stringify(blogHubSchema);
    }

    return () => {
      // Clean up script on unmount
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [post, categoryName, isMainPage]);

  return null;
};
