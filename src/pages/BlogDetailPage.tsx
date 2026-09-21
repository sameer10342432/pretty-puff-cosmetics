import React, { useMemo } from 'react';
import {
  ChevronRight,
  Clock,
  Calendar,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Tag,
} from 'lucide-react';
import { blogService } from '../services/blogService';
import { PRODUCTS } from '../data/products';
import { Product } from '../types';
import { BlogSEO } from '../components/blog/BlogSEO';
import { TableOfContents } from '../components/blog/TableOfContents';
import { SocialShare } from '../components/blog/SocialShare';
import { AuthorBox } from '../components/blog/AuthorBox';
import { BlogSidebar } from '../components/blog/BlogSidebar';
import { ArticleProductCard } from '../components/blog/ArticleProductCard';
import { BlogCard } from '../components/blog/BlogCard';
import { useShop } from '../context/ShopContext';

export const BlogDetailPage: React.FC = () => {
  const { currentBlogSlug, navigateTo } = useShop();

  const post = useMemo(() => {
    if (!currentBlogSlug) return undefined;
    return blogService.getPostBySlug(currentBlogSlug);
  }, [currentBlogSlug]);

  const categories = useMemo(() => blogService.getCategories(), []);
  const popularPosts = useMemo(() => blogService.getPopularPosts(4), []);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return blogService.getRelatedPosts(post, 3);
  }, [post]);

  const spotlightProduct = useMemo(() => {
    if (!post) return PRODUCTS[0];
    if (post.relatedProductIds.length > 0) {
      return (
        PRODUCTS.find(p => p.id === post.relatedProductIds[0]) || PRODUCTS[0]
      );
    }
    return PRODUCTS[0];
  }, [post]);

  // Extract Table of Contents items from sections
  const tocItems = useMemo(() => {
    if (!post) return [];
    return post.sections.map(section => ({
      id: section.id,
      title: section.heading,
      level: section.level,
    }));
  }, [post]);

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="mt-4 font-serif text-2xl font-bold text-stone-900">
          Article Not Found
        </h1>
        <p className="mt-2 text-xs text-stone-600">
          The article you are looking for may have been moved or updated.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('blog')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Beauty Journal
        </button>
      </div>
    );
  }

  const formattedPublished = new Date(post.publishedAt).toLocaleDateString(
    'en-US',
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const formattedUpdated = post.updatedAt
    ? new Date(post.updatedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div id="pretty-puff-blog-detail" className="min-h-screen bg-[#FCF9F7]/40 pb-20">
      <BlogSEO post={post} />

      {/* Breadcrumb Bar */}
      <nav
        id="blog-breadcrumb-nav"
        aria-label="Breadcrumb"
        className="border-b border-stone-200/70 bg-white/70 backdrop-blur-xs py-3.5"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
            <li>
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="hover:text-stone-900 transition-colors"
              >
                Home
              </button>
            </li>
            <ChevronRight className="h-3 w-3 text-stone-400" />
            <li>
              <button
                type="button"
                onClick={() => navigateTo('blog')}
                className="hover:text-stone-900 transition-colors"
              >
                Beauty Journal
              </button>
            </li>
            <ChevronRight className="h-3 w-3 text-stone-400" />
            <li>
              <button
                type="button"
                onClick={() =>
                  navigateTo('blog', { blogCategory: post.categorySlug })
                }
                className="hover:text-stone-900 transition-colors"
              >
                {post.category}
              </button>
            </li>
            <ChevronRight className="h-3 w-3 text-stone-400" />
            <li className="line-clamp-1 font-medium text-stone-900" aria-current="page">
              {post.title}
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Content Layout */}
      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Article Body (8 cols) */}
          <article className="lg:col-span-8">
            {/* Category Pill */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigateTo('blog', { blogCategory: post.categorySlug })
                }
                className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold tracking-wider text-rose-700 uppercase transition-colors hover:bg-rose-200"
              >
                {post.category}
              </button>
              {post.isFeatured && (
                <span className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                  <Sparkles className="h-3 w-3 text-rose-500" />
                  Featured Story
                </span>
              )}
            </div>

            {/* Article Headline */}
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl lg:leading-tight">
              {post.title}
            </h1>

            {/* Subtitle / Excerpt */}
            <p className="mt-4 text-base leading-relaxed text-stone-600 sm:text-lg">
              {post.excerpt}
            </p>

            {/* Author & Meta Strip */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-stone-200/80 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-11 w-11 rounded-full object-cover border border-rose-100 shadow-2xs"
                />
                <div>
                  <h3 className="text-xs font-semibold text-stone-900">
                    {post.author.name}
                  </h3>
                  <p className="text-[11px] text-stone-500">{post.author.role}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  {formattedPublished}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  {post.readingTime} min read
                </span>
                {formattedUpdated && (
                  <span className="text-[11px] text-stone-400">
                    (Updated {formattedUpdated})
                  </span>
                )}
              </div>
            </div>

            {/* Social Share Bar (Top) */}
            <div className="mt-2">
              <SocialShare
                title={post.title}
                imageUrl={post.featuredImage}
              />
            </div>

            {/* Featured Image Hero */}
            <figure className="my-6 overflow-hidden rounded-2xl border border-stone-200/60 bg-stone-100 shadow-xs">
              <img
                src={post.featuredImage}
                alt={post.featuredImageAlt}
                className="w-full object-cover max-h-[500px]"
              />
              <figcaption className="p-3 text-center text-xs text-stone-500 italic bg-white/80">
                {post.featuredImageAlt}
              </figcaption>
            </figure>

            {/* Table of Contents */}
            <TableOfContents items={tocItems} />

            {/* Structured Content Sections */}
            <div className="article-body space-y-10 text-stone-800">
              {post.sections.map(section => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 space-y-4"
                >
                  {section.level === 2 ? (
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                      {section.heading}
                    </h2>
                  ) : (
                    <h3 className="font-serif text-xl font-bold text-stone-900 sm:text-2xl">
                      {section.heading}
                    </h3>
                  )}

                  {/* Paragraphs */}
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-sm leading-relaxed sm:text-base">
                      {p}
                    </p>
                  ))}

                  {/* Pro Tip Callout */}
                  {section.tip && (
                    <aside
                      aria-label="Pro Tip"
                      className="my-5 rounded-xl border-l-4 border-rose-500 bg-rose-50/70 p-4.5 sm:p-5 shadow-2xs"
                    >
                      <h4 className="flex items-center gap-1.5 font-serif text-sm font-bold text-rose-900">
                        <Sparkles className="h-4 w-4 text-rose-600" />
                        {section.tip.title}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-rose-950 sm:text-sm">
                        {section.tip.text}
                      </p>
                    </aside>
                  )}

                  {/* Editorial Quote */}
                  {section.quote && (
                    <blockquote className="my-6 border-l-2 border-stone-400 pl-4 font-serif text-base italic text-stone-700 sm:text-lg">
                      &ldquo;{section.quote}&rdquo;
                    </blockquote>
                  )}

                  {/* Bullet List */}
                  {section.bulletList && (
                    <ul className="my-4 space-y-2 pl-5 text-sm list-disc text-stone-700 marker:text-rose-500">
                      {section.bulletList.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Numbered List */}
                  {section.numberedList && (
                    <ol className="my-4 space-y-2 pl-5 text-sm list-decimal text-stone-700 marker:font-bold marker:text-rose-600">
                      {section.numberedList.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Comparison / Informational Table */}
                  {section.table && (
                    <div className="my-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-2xs">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-stone-50 font-semibold text-stone-900 border-b border-stone-200">
                          <tr>
                            {section.table.headers.map((h, idx) => (
                              <th key={idx} className="px-4 py-3">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-600">
                          {section.table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-rose-50/30 transition-colors">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-4 py-3">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Recommended Products Callout */}
                  {section.recommendedProductIds &&
                    section.recommendedProductIds.map(productId => {
                      const product = PRODUCTS.find(p => p.id === productId);
                      if (!product) return null;
                      return <ArticleProductCard key={product.id} product={product} />;
                    })}
                </section>
              ))}
            </div>

            {/* Tags Cloud */}
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-6">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                <Tag className="h-3.5 w-3.5 text-rose-500" />
                Tags:
              </span>
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Social Share Bar (Bottom) */}
            <div className="mt-6 border-y border-stone-200 py-3">
              <SocialShare
                title={post.title}
                imageUrl={post.featuredImage}
              />
            </div>

            {/* Author Box */}
            <AuthorBox author={post.author} />

            {/* You May Also Like Section (3 Related Articles) */}
            {relatedPosts.length > 0 && (
              <section
                id="related-articles-section"
                aria-labelledby="related-articles-heading"
                className="mt-12 border-t border-stone-200 pt-10"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h3
                    id="related-articles-heading"
                    className="font-serif text-2xl font-bold text-stone-900"
                  >
                    You May Also Like
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('blog', { blogCategory: post.categorySlug })
                    }
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    More in {post.category} →
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {relatedPosts.map(relPost => (
                    <BlogCard key={relPost.id} post={relPost} />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Desktop Sticky Sidebar (4 cols) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <BlogSidebar
                categories={categories}
                popularPosts={popularPosts}
                spotlightProduct={spotlightProduct}
                activeCategorySlug={post.categorySlug}
                onSearch={query => navigateTo('blog', { search: query })}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
