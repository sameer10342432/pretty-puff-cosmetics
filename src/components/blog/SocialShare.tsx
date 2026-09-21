import React, { useState } from 'react';
import { Share2, Check, Copy, MessageCircle } from 'lucide-react';
import { useShop } from '../../context/ShopContext';

interface SocialShareProps {
  title: string;
  url?: string;
  imageUrl?: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({ title, url, imageUrl }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useShop();

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedImage = encodeURIComponent(imageUrl || '');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Article link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Unable to copy link', 'error');
    }
  };

  return (
    <div id="social-share-bar" className="flex flex-wrap items-center gap-2 py-4">
      <span className="flex items-center gap-1.5 text-xs font-medium text-stone-500 mr-2">
        <Share2 className="h-3.5 w-3.5 text-rose-500" />
        Share this article:
      </span>

      {/* WhatsApp */}
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="flex h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span>WhatsApp</span>
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="flex h-8 items-center gap-1.5 rounded-full bg-blue-50 px-3 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
      >
        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span>Facebook</span>
      </a>

      {/* X / Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="flex h-8 items-center gap-1.5 rounded-full bg-stone-100 px-3 text-xs font-medium text-stone-800 transition-colors hover:bg-stone-200"
      >
        <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>X (Twitter)</span>
      </a>

      {/* Pinterest */}
      <a
        href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Save on Pinterest"
        className="flex h-8 items-center gap-1.5 rounded-full bg-rose-50 px-3 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
      >
        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
        <span>Pinterest</span>
      </a>

      {/* Copy Link */}
      <button
        type="button"
        id="share-copy-link-btn"
        onClick={copyToClipboard}
        aria-label="Copy article link"
        className="flex h-8 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-medium text-stone-700 shadow-xs transition-colors hover:bg-stone-50"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-700">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-stone-500" />
            <span>Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
};
