import React from 'react';
import { Clock, ArrowRight, User } from 'lucide-react';
import { BlogPost } from '../../types/blog';
import { useShop } from '../../context/ShopContext';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, featured = false }) => {
  const { navigateTo } = useShop();

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo('blog-post', { blogSlug: post.slug });
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigateTo('blog', { blogCategory: post.categorySlug });
  };

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (featured) {
    return (
      <article
        id={`featured-article-${post.id}`}
        onClick={handleCardClick}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-rose-100/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md lg:grid lg:grid-cols-12"
      >
        <div className="relative aspect-[16/10] overflow-hidden lg:col-span-7 lg:aspect-auto">
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-4 left-4">
            <span
              onClick={handleCategoryClick}
              className="inline-block rounded-full bg-white/95 px-3 py-1 text-xs font-semibold tracking-wider text-rose-700 uppercase shadow-sm backdrop-blur-sm transition-colors hover:bg-rose-50"
            >
              {post.category}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
          <div>
            <div className="flex items-center gap-3 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                {post.readingTime} min read
              </span>
              <span>•</span>
              <time dateTime={post.publishedAt}>{formattedDate}</time>
            </div>

            <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-stone-900 transition-colors group-hover:text-rose-600 sm:text-3xl">
              {post.title}
            </h2>

            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600">
              {post.excerpt}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-5">
            <div className="flex items-center gap-2.5">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="h-8 w-8 rounded-full object-cover border border-rose-100"
              />
              <div>
                <p className="text-xs font-medium text-stone-800">{post.author.name}</p>
                <p className="text-[11px] text-stone-400">{post.author.role}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition-transform group-hover:translate-x-1">
              Read Article
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      id={`blog-card-${post.id}`}
      onClick={handleCardClick}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
        <img
          src={post.featuredImage}
          alt={post.featuredImageAlt}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span
            onClick={handleCategoryClick}
            className="inline-block rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-rose-700 uppercase shadow-xs backdrop-blur-xs transition-colors hover:bg-rose-50"
          >
            {post.category}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readingTime} min
            </span>
            <span>•</span>
            <time dateTime={post.publishedAt}>{formattedDate}</time>
          </div>

          <h3 className="mt-2.5 font-serif text-lg font-bold leading-snug text-stone-900 transition-colors group-hover:text-rose-600">
            {post.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-600">
            {post.excerpt}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
          <div className="flex items-center gap-2">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-6 w-6 rounded-full object-cover border border-rose-100"
            />
            <span className="text-xs text-stone-600">{post.author.name}</span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition-transform group-hover:translate-x-1">
            Read More
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </article>
  );
};
