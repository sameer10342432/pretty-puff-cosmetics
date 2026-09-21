import React, { useState, useMemo } from 'react';
import { BookOpen, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { blogService } from '../services/blogService';
import { PRODUCTS } from '../data/products';
import { BlogCard } from '../components/blog/BlogCard';
import { BlogCategoryNav } from '../components/blog/BlogCategoryNav';
import { BlogSearch } from '../components/blog/BlogSearch';
import { BlogSidebar } from '../components/blog/BlogSidebar';
import { BlogSEO } from '../components/blog/BlogSEO';
import { useShop } from '../context/ShopContext';

const POSTS_PER_PAGE = 6;

export const BlogMainPage: React.FC = () => {
  const { currentBlogCategory, navigateTo } = useShop();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const categories = useMemo(() => blogService.getCategories(), []);
  const activeCategory = currentBlogCategory || 'all';

  const currentCategoryObj = useMemo(
    () => blogService.getCategoryBySlug(activeCategory),
    [activeCategory]
  );

  // Featured article (only shown when category is 'all' and no search)
  const featuredPost = useMemo(() => blogService.getFeaturedPost(), []);

  // Filtered posts based on category and search query
  const filteredPosts = useMemo(() => {
    return blogService.searchPosts(searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);

  // Posts for the grid (excluding featured post when on 'all' without active search)
  const gridPosts = useMemo(() => {
    if (activeCategory === 'all' && !searchQuery) {
      return filteredPosts.filter(p => p.id !== featuredPost.id);
    }
    return filteredPosts;
  }, [filteredPosts, activeCategory, searchQuery, featuredPost]);

  const displayedPosts = useMemo(() => {
    return gridPosts.slice(0, visibleCount);
  }, [gridPosts, visibleCount]);

  const hasMore = visibleCount < gridPosts.length;

  const popularPosts = useMemo(() => blogService.getPopularPosts(4), []);
  const spotlightProduct = useMemo(
    () => PRODUCTS.find(p => p.id === 'prod-01') || PRODUCTS[0],
    []
  );

  const handleSelectCategory = (slug: string) => {
    setSearchQuery('');
    setVisibleCount(POSTS_PER_PAGE);
    navigateTo('blog', { blogCategory: slug });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setVisibleCount(POSTS_PER_PAGE);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + POSTS_PER_PAGE);
  };

  return (
    <div id="pretty-puff-blog-main" className="min-h-screen bg-[#FCF9F7]/60 pb-20">
      <BlogSEO
        categoryName={currentCategoryObj?.name}
        isMainPage={activeCategory === 'all' && !searchQuery}
      />

      {/* Editorial Header Banner */}
      <header className="border-b border-rose-100/60 bg-linear-to-b from-rose-50/70 via-stone-50/40 to-transparent pt-12 pb-10 text-center sm:pt-16 sm:pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-3 py-1 text-xs font-semibold tracking-wider text-rose-700 uppercase">
            <Sparkles className="h-3 w-3" />
            Editorial Journal
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-5xl">
            Pretty Puff Beauty Journal
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
            Beauty tips, skincare advice, makeup inspiration, and everything you need to feel your prettiest.
          </p>

          {/* Search & Category Filter Bar */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <BlogSearch
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              resultCount={filteredPosts.length}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Category Navigation Tabs */}
        <div className="my-6">
          <BlogCategoryNav
            categories={categories}
            activeCategorySlug={activeCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Featured Article Hero (When on 'All Articles' and no search) */}
        {activeCategory === 'all' && !searchQuery && featuredPost && (
          <section aria-labelledby="featured-story-heading" className="my-8">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="featured-story-heading"
                className="font-serif text-xl font-bold text-stone-900 sm:text-2xl"
              >
                Featured Story
              </h2>
              <span className="text-xs font-medium text-rose-600">Must-read this week</span>
            </div>
            <BlogCard post={featuredPost} featured={true} />
          </section>
        )}

        {/* Category Heading (When viewing specific category) */}
        {activeCategory !== 'all' && currentCategoryObj && (
          <div className="my-6 rounded-2xl border border-rose-100/60 bg-white p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold tracking-wider text-rose-600 uppercase">
                  Category Archive
                </span>
                <h2 className="font-serif text-2xl font-bold text-stone-900 sm:text-3xl">
                  {currentCategoryObj.name}
                </h2>
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'Article' : 'Articles'}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
              {currentCategoryObj.description}
            </p>
          </div>
        )}

        {/* Layout: Main Grid (8 cols) + Sidebar (4 cols) */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Articles Stream */}
          <div className="lg:col-span-8">
            <div className="mb-6 flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {searchQuery
                  ? `Search Results (${filteredPosts.length})`
                  : activeCategory === 'all'
                  ? 'Latest Articles'
                  : `All in ${currentCategoryObj?.name || 'Category'}`}
              </h3>
              <div className="text-xs text-stone-500">
                Showing {displayedPosts.length} of {gridPosts.length}
              </div>
            </div>

            {/* No Results State */}
            {displayedPosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-2xs">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-stone-900">
                  No beauty articles found
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-stone-500">
                  We couldn&apos;t find any articles matching your search. Try another keyword or explore our categories.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('all')}
                    className="rounded-full bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition-colors"
                  >
                    View All Articles
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {displayedPosts.map(post => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination / Load More */}
                {hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      id="blog-load-more-btn"
                      type="button"
                      onClick={handleLoadMore}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-6 py-3 text-xs font-semibold text-stone-800 shadow-xs transition-all hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-700"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Load More Articles
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Desktop Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <BlogSidebar
                categories={categories}
                popularPosts={popularPosts}
                spotlightProduct={spotlightProduct}
                activeCategorySlug={activeCategory}
                onSearch={query => {
                  setSearchQuery(query);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
