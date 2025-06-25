import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Clock, Heart, Share2, User, Zap, Check, Target, BookOpen } from 'lucide-react';
import { Blog } from './types';

const BlogDetailPage: React.FC = () => {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState<boolean>(false);
  const [isShared, setIsShared] = useState<boolean>(false);

  const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;
  const CLIENT_BASE_URL = `${window.location.origin}`;
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();

  // Fetch blog by ID
  useEffect(() => {
    const fetchBlog = async () => {
      if (!blogId) {
        setError('Invalid blog ID');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/blogs/${blogId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404) {
            throw new Error('Blog not found');
          }
          throw new Error(`Failed to fetch blog: ${response.status} ${errorText}`);
        }

        const blogData: Blog = await response.json();
        setBlog(blogData);
        setError(null);
      } catch (error) {
        console.error('Fetch blog error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load blog');
        setBlog(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [blogId]);

  const handleLike = async () => {
    if (isLiking || !blog) return;

    setIsLiking(true);

    const originalBlog = { ...blog };
    const newIsLiked = !blog.isLiked;
    const newLikes = newIsLiked ? blog.likes + 1 : blog.likes - 1;

    // Optimistic update
    const updatedBlog = { ...blog, isLiked: newIsLiked, likes: newLikes };
    setBlog(updatedBlog);

    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          alert('Please log in to like a blog.');
          setBlog(originalBlog);
          return;
        }
        throw new Error(`Failed to update like: ${response.status} ${errorText}`);
      }

      const { likes, isLiked } = await response.json();
      setBlog({ ...blog, likes, isLiked });
    } catch (error) {
      console.error('Like error:', error);
      setBlog(originalBlog);
      alert('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!blog) return;

    try {
      const shareUrl = `${CLIENT_BASE_URL}/blogs/${blog._id}`;
      const shareData = {
        title: blog.title,
        text: `Check out this blog post: ${blog.title}`,
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback to clipboard
      try {
        const shareUrl = `${CLIENT_BASE_URL}/blogs/${blog._id}`;
        await navigator.clipboard.writeText(shareUrl);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      } catch (clipboardError) {
        console.error('Clipboard failed:', clipboardError);
        alert('Failed to share blog');
      }
    }
  };

  const getCategoryColor = () => {
    switch (blog?.category) {
      case 'Tips/Tricks': return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40 text-emerald-300';
      case 'Interview Experience': return 'from-purple-500/20 to-purple-600/20 border-purple-500/40 text-purple-300';
      default: return 'from-blue-400/20 to-blue-600/20 border-blue-400/40 text-blue-300';
    }
  };

  const getCategoryIcon = () => {
    switch (blog?.category) {
      case 'Tips/Tricks': return <Zap className="w-4 h-4" />;
      case 'Interview Experience': return <Target className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading blog...</div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error || 'Blog not found'}</div>
          <Link
            to="/blogs"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white relative overflow-hidden">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heartPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .heart-liked {
          animation: heartPulse 0.3s ease-in-out;
        }
        .prose-invert {
          --tw-prose-invert-body: #d1d5db;
          --tw-prose-invert-headings: #f3f4f6;
          --tw-prose-invert-lead: #9ca3af;
          --tw-prose-invert-links: #22d3ee;
          --tw-prose-invert-bold: #f3f4f6;
          --tw-prose-invert-counters: #9ca3af;
          --tw-prose-invert-bullets: #4b5563;
          --tw-prose-invert-hr: #374151;
          --tw-prose-invert-quotes: #f3f4f6;
          --tw-prose-invert-quote-borders: #374151;
          --tw-prose-invert-captions: #9ca3af;
          --tw-prose-invert-code: #22d3ee;
          --tw-prose-invert-pre-code: #d1d5db;
          --tw-prose-invert-pre-bg: rgba(31,41,55,0.5);
          --tw-prose-invert-th-borders: #4b5563;
          --tw-prose-invert-td-borders: #374151;
        }
      `}</style>

      <div className="relative z-10 pt-32 pb-20 px-4 md:px-8 lg:px-16 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 border border-zinc-600/50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 leading-tight mb-4">
              {blog.title}
            </h1>
            <div className={`inline-flex items-center gap-x-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${getCategoryColor()} border shadow-lg backdrop-blur-sm`}>
              {getCategoryIcon()}
              <span>{blog.category}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-x-4">
              <div className="relative group">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center p-0.5 shadow-lg group-hover:shadow-cyan-200/25 transition-all duration-300">
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                    <User className="w-7 h-7 text-gray-200" />
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-200/20 to-purple-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white mb-1">{blog.author.name}</div>
                <div className="flex items-center gap-x-3 text-gray-400">
                  <div className="flex items-center gap-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{new Date(blog.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-200 rounded-full" />
                  <div className="flex items-center gap-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{blog.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-x-6 mb-8 p-4 bg-gray-800/30 rounded-2xl border border-gray-600/20 backdrop-blur-sm">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
                blog.isLiked 
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300' 
                  : 'bg-gray-800/50 hover:bg-red-500/10 border border-gray-600/30 hover:border-red-500/30 text-gray-400 hover:text-red-300'
              } ${isLiking ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              <div className={`p-2 rounded-lg ${blog.isLiked ? 'bg-red-500/20' : 'bg-gray-700/20 group-hover:bg-red-500/10'}`}>
                <Heart className={`w-5 h-5 transition-all duration-300 ${blog.isLiked ? 'fill-red-400 text-red-400 heart-liked' : ''}`} />
              </div>
              <span className="text-sm font-semibold">
                {blog.likes} {blog.likes === 1 ? 'like' : 'likes'}
              </span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-x-3 px-6 py-4 rounded-xl bg-gray-800/50 hover:bg-blue-500/10 border border-gray-600/30 hover:border-blue-500/30 text-gray-400 hover:text-blue-300 transition-all duration-300 hover:scale-105"
            >
              <div className="p-2 rounded-lg bg-gray-700/20 group-hover:bg-blue-500/10">
                {isShared ? (
                  <Check className="w-5 h-5 text-blue-400" />
                ) : (
                  <Share2 className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm font-semibold">{isShared ? 'Copied!' : 'Share'}</span>
            </button>
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Tags</h3>
              <div className="flex flex-wrap gap-3">
                {blog.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-4 py-2 text-sm bg-gray-700/60 text-gray-300 rounded-xl border border-gray-600/30 hover:bg-gray-600/50 hover:text-gray-200 transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute top-0 left-0 w-1 h-20 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full" />
            <div className="pl-8">
              <h3 className="text-lg font-semibold text-gray-200 mb-6">Article Content</h3>
              <div 
                className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed
                  prose-headings:text-gray-200 prose-headings:font-semibold
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                  prose-strong:text-gray-200 prose-strong:font-semibold
                  prose-code:text-blue-300 prose-code:bg-gray-800/50 prose-code:px-2 prose-code:py-1 prose-code:rounded
                  prose-pre:bg-gray-800/50 prose-pre:border prose-pre:border-gray-700/50 prose-pre:rounded-xl
                  prose-blockquote:border-l-blue-500 prose-blockquote:bg-gray-800/30 prose-blockquote:rounded-r-xl
                  prose-ul:text-gray-300 prose-ol:text-gray-300"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/blogs"
            className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors duration-300"
          >
            Back to Blogs
          </Link>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
};

export default BlogDetailPage;