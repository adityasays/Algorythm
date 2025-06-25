import React from 'react';
import { Search, Trash2, Zap, Target, BookOpen, AlertCircle } from 'lucide-react';
import BlogCard from './BlogCard';
import { Tab, Blog, SortBy } from './types';

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="w-full">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shimmer-animation {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
      
      <div className="flex items-center justify-center mb-8 sm:mb-12 lg:mb-16">
        <div className="relative inline-flex bg-zinc-900/80 backdrop-blur-2xl rounded-2xl p-1 sm:p-2 border border-zinc-700/50 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-2xl" />
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`relative px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 group whitespace-nowrap ${
                activeTab === tab.value 
                  ? 'text-white shadow-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-zinc-800/50'
              }`}
            >
              <span className="relative z-10 flex items-center space-x-1 sm:space-x-2">
                {typeof tab.title === 'string' ? <span>{tab.title}</span> : tab.title}
              </span>
              {activeTab === tab.value && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="transition-all duration-700 ease-out">
        {tabs.find(tab => tab.value === activeTab)?.content}
      </div>
    </div>
  );
};

interface SearchAndFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  resultsCount?: number;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy, 
  resultsCount 
}) => {
  return (
    <div className="mb-8 sm:mb-10 lg:mb-12 opacity-0 animate-[fadeIn_0.8s_ease-out_0.3s_forwards]">
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between bg-transparent">
        {/* Search Input */}
        <div className="relative flex-1 max-w-full lg:max-w-2xl">
          <div className="relative group">
            <Search className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-cyan-400 transition-colors duration-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search blogs, tags, or keywords..."
              className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 text-base sm:text-lg rounded-2xl bg-zinc-700/50 border border-zinc-600/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 focus:bg-zinc-700/70 transition-all duration-300 hover:border-zinc-500/70"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
          {/* Results Count */}
          {resultsCount !== undefined && (
            <div className="mt-2 text-sm text-gray-400">
              {resultsCount} {resultsCount === 1 ? 'result' : 'results'} found
            </div>
          )}
        </div>

        {/* Sort Filter */}
        <div className="flex items-center justify-end sm:justify-start">
          <div className="flex items-center space-x-3 bg-gray-700/40 rounded-2xl px-4 sm:px-5 py-3 border border-gray-600/40 backdrop-blur-sm">
            <label className="text-sm text-gray-300 hidden sm:block">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-transparent border-none text-white text-sm focus:outline-none cursor-pointer min-w-0"
            >
              <option value="newest" className="bg-gray-800">Most Recent</option>
              <option value="popular" className="bg-gray-800">Most Popular</option>
              
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BlogGridProps {
  blogs: Blog[];
  category: string;
  setSelectedBlog: (blog: Blog | null) => void;
  isLoading?: boolean;
}

const BlogGrid: React.FC<BlogGridProps> = ({ blogs, category, setSelectedBlog, isLoading }) => {
  const filteredBlogs = category === 'all' ? blogs : blogs.filter(blog => blog.category === category);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-zinc-800/50 rounded-2xl p-6 border border-zinc-700/30 animate-pulse"
          >
            <div className="h-4 bg-zinc-700 rounded mb-4"></div>
            <div className="h-20 bg-zinc-700 rounded mb-4"></div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-zinc-700 rounded w-20"></div>
              <div className="h-4 bg-zinc-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filteredBlogs || filteredBlogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-center opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/10 to-purple-400/10 animate-pulse" />
          <Trash2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 relative z-10" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-300 mb-3 sm:mb-4">No blogs found!</h3>
        <p className="text-gray-500 text-sm sm:text-base max-w-md">
          {category === 'all' 
            ? "Try adjusting your search filters or check back later for new content."
            : `No blogs found in the "${category}" category. Try searching in other categories.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[400px]">
      {/* Grid Container with Proper Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 auto-rows-fr">
        {filteredBlogs.map((blog, index) => (
          <div
            key={blog._id}
            className="opacity-0 animate-[fadeIn_0.6s_ease-out_forwards] hover:scale-[1.02] transition-transform duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <BlogCard 
              blog={blog} 
              index={index}
              setSelectedBlog={setSelectedBlog}
            />
          </div>
        ))}
      </div>

      {/* Load More Indicator (if needed) */}
      {filteredBlogs.length > 0 && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-400 text-sm">
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            <span>Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'blog' : 'blogs'}</span>
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className="flex justify-center py-20 sm:py-32">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-cyan-500/20 rounded-full animate-spin`} />
        <div className={`absolute top-0 left-0 ${sizeClasses[size]} border-4 border-transparent border-t-cyan-400 rounded-full animate-spin`} />
        <div className={`absolute top-2 left-2 ${size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-4 h-4'} border-4 border-transparent border-t-purple-400 rounded-full animate-spin`} />
        <Zap className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-4 w-4' : 'h-3 w-3'} text-white animate-pulse`} />
      </div>
    </div>
  );
};

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="text-center py-20 sm:py-32">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6 sm:mb-8">
        <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-400" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-400 mb-3">Something went wrong</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm sm:text-base">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-2xl hover:from-cyan-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-sm sm:text-base"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

interface BlogListSectionProps {
  blogs: Blog[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: SortBy;
  setSortBy: (sortBy: SortBy) => void;
  category: string;
  setCategory: (category: string) => void;
  blogsLoading: boolean;
  blogsError: string | null;
  setSelectedBlog: (blog: Blog | null) => void;
}

const BlogListSection: React.FC<BlogListSectionProps> = ({ 
  blogs, 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy, 
  category, 
  setCategory, 
  blogsLoading, 
  blogsError, 
  setSelectedBlog 
}) => {
  // Filter blogs based on search term
  const filteredBlogs = React.useMemo(() => {
    if (!searchTerm.trim()) return blogs;
    
    const searchLower = searchTerm.toLowerCase();
    return blogs.filter(blog => 
      blog.title.toLowerCase().includes(searchLower) ||
      blog.content.toLowerCase().includes(searchLower) ||
      blog.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      blog.author.name.toLowerCase().includes(searchLower)
    );
  }, [blogs, searchTerm]);

  // Sort blogs
  const sortedBlogs = React.useMemo(() => {
    return [...filteredBlogs].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes;
       
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filteredBlogs, sortBy]);

  // Get category-specific blogs
  const categoryBlogs = React.useMemo(() => {
    return category === 'all' ? sortedBlogs : sortedBlogs.filter(blog => blog.category === category);
  }, [sortedBlogs, category]);

  const tabs: Tab[] = [
    {
      title: 'All Blogs',
      value: 'all',
      content: (
        <div>
          <SearchAndFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            resultsCount={sortedBlogs.length}
          />
          {blogsLoading ? (
            <LoadingSpinner />
          ) : blogsError ? (
            <ErrorState 
              error={blogsError} 
              onRetry={() => window.location.reload()} 
            />
          ) : (
            <BlogGrid 
              blogs={sortedBlogs} 
              category="all" 
              setSelectedBlog={setSelectedBlog}
              isLoading={blogsLoading}
            />
          )}
        </div>
      ),
    },
    {
      title: (
        <span className="flex items-center space-x-2">
          <Zap className="w-4 h-4" />
          <span>Tips/Tricks</span>
        </span>
      ) as any,
      value: 'Tips/Tricks',
      content: (
        <div>
          <SearchAndFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            resultsCount={categoryBlogs.length}
          />
          {blogsLoading ? (
            <LoadingSpinner />
          ) : blogsError ? (
            <ErrorState 
              error={blogsError} 
              onRetry={() => window.location.reload()} 
            />
          ) : (
            <BlogGrid 
              blogs={categoryBlogs} 
              category="Tips/Tricks" 
              setSelectedBlog={setSelectedBlog}
              isLoading={blogsLoading}
            />
          )}
        </div>
      ),
    },
    {
      title: (
        <span className="flex items-center space-x-2">
          <Target className="w-4 h-4" />
          <span>Interview Experience</span>
        </span>
      ) as any,
      value: 'Interview Experience',
      content: (
        <div>
          <SearchAndFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            resultsCount={categoryBlogs.length}
          />
          {blogsLoading ? (
            <LoadingSpinner />
          ) : blogsError ? (
            <ErrorState 
              error={blogsError} 
              onRetry={() => window.location.reload()} 
            />
          ) : (
            <BlogGrid 
              blogs={categoryBlogs} 
              category="Interview Experience" 
              setSelectedBlog={setSelectedBlog}
              isLoading={blogsLoading}
            />
          )}
        </div>
      ),
    },
    {
      title: (
        <span className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4" />
          <span>Others</span>
        </span>
      ) as any,
      value: 'Others',
      content: (
        <div>
          <SearchAndFilter 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortBy={sortBy}
            setSortBy={setSortBy}
            resultsCount={categoryBlogs.length}
          />
          {blogsLoading ? (
            <LoadingSpinner />
          ) : blogsError ? (
            <ErrorState 
              error={blogsError} 
              onRetry={() => window.location.reload()} 
            />
          ) : (
            <BlogGrid 
              blogs={categoryBlogs} 
              category="Others" 
              setSelectedBlog={setSelectedBlog}
              isLoading={blogsLoading}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 opacity-0 animate-[fadeIn_0.8s_ease-out_0.4s_forwards]">
        <Tabs tabs={tabs} activeTab={category} setActiveTab={setCategory} />
      </div>
    </div>
  );
};

export default BlogListSection;