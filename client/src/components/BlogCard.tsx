import React from 'react';
import { User, Clock, Heart, Zap, Target, BookOpen, ChevronRight } from 'lucide-react';
import { Blog } from './types';

const BlogCard: React.FC<{
  blog: Blog;
  index: number;
  setSelectedBlog: (blog: Blog | null) => void;
}> = ({ blog, index, setSelectedBlog }) => {
  const truncatedContent = blog.excerpt.length > 120 ? blog.excerpt.slice(0, 120) + '...' : blog.excerpt;

  const getCategoryColor = () => {
    switch (blog.category) {
      case 'Tips/Tricks': return 'from-emerald-400/30 to-teal-500/30 border-emerald-400/50 text-emerald-300';
      case 'Interview Experience': return 'from-violet-400/30 to-purple-500/30 border-violet-400/50 text-violet-300';
      default: return 'from-cyan-400/30 to-blue-500/30 border-cyan-400/50 text-cyan-300';
    }
  };

  const getCategoryIcon = () => {
    switch (blog.category) {
      case 'Tips/Tricks': return <Zap className="h-3.5 w-3.5" />;
      case 'Interview Experience': return <Target className="h-3.5 w-3.5" />;
      default: return <BookOpen className="h-3.5 w-3.5" />;
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
          .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        `}
      </style>
      
      <div 
        className="group relative opacity-0 fade-in-up cursor-pointer h-full"
        style={{ animationDelay: `${index * 0.15}s` }}
        onClick={() => setSelectedBlog(blog)}
      >
        <div className="relative h-full bg-gradient-to-br from-slate-800/90 via-zinc-800/95 to-zinc-900/95 border border-zinc-700/60 rounded-3xl overflow-hidden backdrop-blur-xl transform transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,255,255,0.15),0_10px_20px_rgba(147,51,234,0.08)] hover:border-zinc-600/80">
          <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className={`inline-flex items-center gap-x-2.5 px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${getCategoryColor()} border backdrop-blur-sm transform transition-all duration-300 hover:scale-105`}>
                {getCategoryIcon()}
                <span className="tracking-wide">{blog.category}</span>
              </div>
              <div className="flex items-center gap-x-2 text-xs text-slate-400 font-medium">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span>{blog.readTime}</span>
              </div>
            </div>

            {/* Content - Flex grow to fill available space */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-300 group-hover:from-cyan-200 group-hover:via-white group-hover:to-purple-200 transition-all duration-500 line-clamp-2 leading-tight">
                {blog.title}
              </h3>

              <p className="text-gray-400 mb-4 leading-relaxed text-sm line-clamp-3 group-hover:text-gray-300 transition-colors duration-300 flex-1">
                {truncatedContent}
              </p>

              {/* Tags */}
              {blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
                  {blog.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-3 py-1.5 text-xs bg-gray-700/60 text-gray-300 rounded-lg border border-gray-600/40 hover:bg-gray-600/60 hover:text-gray-200 transition-all duration-200 backdrop-blur-sm">
                      #{tag}
                    </span>
                  ))}
                  {blog.tags.length > 3 && (
                    <span className="px-3 py-1.5 text-xs bg-gray-700/40 text-gray-400 rounded-lg border border-gray-600/30">
                      +{blog.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer - Always at bottom */}
              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 p-0.5">
                      <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-200 mb-0.5">{blog.author.name}</div>
                    <div className="flex items-center gap-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-x-2 text-gray-400">
                  <Heart className={`h-4 w-4 ${blog.isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                  <span className="text-sm font-medium">{blog.likes}</span>
                </div>
              </div>
            </div>

            {/* Read more indicator */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
              <div className="flex items-center gap-x-2 text-cyan-400">
                <span className="text-sm font-medium">Read more</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogCard;