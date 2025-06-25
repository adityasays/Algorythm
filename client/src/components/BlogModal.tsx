import React, { useState, useEffect } from 'react';
import { X, User, Clock, Heart, Share2, Zap, Target, BookOpen, Check } from 'lucide-react';
import { Blog } from './types';

const BlogModal: React.FC<{
  blog: Blog | null;
  onClose: () => void;
  setBlogs: React.Dispatch<React.SetStateAction<Blog[]>>;
}> = ({ blog, onClose, setBlogs }) => {
  const [isShared, setIsShared] = useState(false);
  const [localBlog, setLocalBlog] = useState<Blog | null>(blog);
  const [isLiking, setIsLiking] = useState(false);
  const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;
  const CLIENT_BASE_URL = `${window.location.origin}`;
  
  useEffect(() => {
    setLocalBlog(blog);
  }, [blog]);
  
  if (!localBlog) return null;

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    
    const newIsLiked = !localBlog.isLiked;
    const newLikes = newIsLiked ? localBlog.likes + 1 : localBlog.likes - 1;
    
    const updatedBlog = {
      ...localBlog,
      isLiked: newIsLiked,
      likes: newLikes
    };
    
    setLocalBlog(updatedBlog);
    
    try {
      const url = `${API_BASE_URL}/api/blogs/${localBlog._id}/like`;
      console.log('Liking blog:', { url, blogId: localBlog._id });
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Like error response:', { status: response.status, text: errorText, url });
        setLocalBlog(localBlog);
        if (response.status === 401) {
          alert('Please log in to like a blog.');
          return;
        }
        throw new Error(`Failed to update like: ${response.status} ${errorText}`);
      }
      
      const { likes, isLiked } = await response.json();
      const serverUpdatedBlog = {
        ...localBlog,
        likes,
        isLiked
      };
      
      setLocalBlog(serverUpdatedBlog);
      setBlogs(prev => prev.map(b => b._id === localBlog._id ? serverUpdatedBlog : b));
    } catch (error) {
      console.error('Like error:', error);
      setLocalBlog(localBlog);
      alert('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${CLIENT_BASE_URL}/blogs/${localBlog._id}`;
      const shareData = {
        title: localBlog.title,
        text: `Check out this blog post: ${localBlog.title}`,
        url: shareUrl,
      };
      console.log('Sharing blog:', shareData);
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to share blog');
    }
  };

  const getCategoryColor = () => {
    switch (localBlog.category) {
      case 'Tips/Tricks': return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40 text-emerald-300';
      case 'Interview Experience': return 'from-purple-500/20 to-purple-600/20 border-purple-500/40 text-purple-300';
      default: return 'from-blue-400/20 to-blue-600/20 border-blue-400/40 text-blue-300';
    }
  };

  const getCategoryIcon = () => {
    switch (localBlog.category) {
      case 'Tips/Tricks': return <Zap className="w-4 h-4" />;
      case 'Interview Experience': return <Target className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes scaleIn {
            from { 
              transform: scale(0.9) translateY(100px);
              opacity: 0;
            }
            to { 
              transform: scale(1) translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes heartPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #8b5cf6 transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #06b8dc, #8b5cf6);
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #08dcdf, #7c3fed);
          }
          
          .heart-liked {
            animation: heartPulse 0.3s ease-in-out;
          }
        `}
      </style>
      
      <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4">
        <div className="relative bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 border border-zinc-600/50 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden transform scale-90 animate-[scaleIn_0.5s_ease-out_forwards] shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-lg shadow-cyan-500/20" />
          
          <div className="relative p-8 pb-6 border-b border-zinc-700/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 leading-tight mb-2">
                  {localBlog.title}
                </h2>
                <div className={`inline-flex items-center gap-x-2 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${getCategoryColor()} border shadow-lg backdrop-blur-sm`}>
                  {getCategoryIcon()}
                  <span>{localBlog.category}</span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-3 rounded-2xl text-gray-400 hover:text-white hover:bg-zinc-700/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-transparent hover:border-zinc-600/50">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(92vh-140px)] custom-scrollbar">
            <div className="p-8 pt-6">
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
                    <div className="text-lg font-semibold text-white mb-1">{localBlog.author.name}</div>
                    <div className="flex items-center gap-x-3 text-gray-400">
                      <div className="flex items-center gap-x-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{new Date(localBlog.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-200 rounded-full" />
                      <div className="flex items-center gap-x-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{localBlog.readTime}</span>
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
                    localBlog.isLiked 
                      ? 'bg-red-500/20 border border-red-500/40 text-red-300' 
                      : 'bg-gray-800/50 hover:bg-red-500/10 border border-gray-600/30 hover:border-red-500/30 text-gray-400 hover:text-red-300'
                  } ${isLiking ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}>
                  <div className={`p-2 rounded-lg ${localBlog.isLiked ? 'bg-red-500/20' : 'bg-gray-700/20 group-hover:bg-red-500/10'}`}>
                    <Heart className={`w-5 h-5 transition-all duration-300 ${localBlog.isLiked ? 'fill-red-400 text-red-400 heart-liked' : ''}`} />
                  </div>
                  <span className="text-sm font-semibold">
                    {localBlog.likes} {localBlog.likes === 1 ? 'like' : 'likes'}
                  </span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center gap-x-3 px-6 py-4 rounded-xl bg-gray-800/50 hover:bg-blue-500/10 border border-gray-600/30 hover:border-blue-500/30 text-gray-400 hover:text-blue-300 transition-all duration-300 hover:scale-105">
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

              {localBlog.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {localBlog.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-4 py-2 text-sm bg-gray-700/60 text-gray-300 rounded-xl border border-gray-600/30 hover:bg-gray-600/50 hover:text-gray-200 transition-all duration-300 cursor-pointer hover:scale-105 backdrop-blur-sm">
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
                    dangerouslySetInnerHTML={{ __html: localBlog.content }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogModal;