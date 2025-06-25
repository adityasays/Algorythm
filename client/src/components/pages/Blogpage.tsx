import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, ArrowUp, Users, Heart } from 'lucide-react';
import BlogListSection from '../BlogListSection';
import CreateBlogModal from '../CreateBlogModal';
import BlogModal from '../BlogModal';
import { Blog, BlogFormData, SortBy } from '../types';

const BlogPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [blogsLoading, setBlogsLoading] = useState<boolean>(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [category, setCategory] = useState<string>('all');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL ;


  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch all blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      setBlogsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (sortBy) queryParams.append('sortBy', sortBy);
        if (searchTerm) queryParams.append('search', searchTerm);
        if (category !== 'all') queryParams.append('category', category);

        const response = await fetch(`${API_BASE_URL}/api/blogs?${queryParams}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch blogs: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setBlogs(data);
          setBlogsError(null);
        } else {
          throw new Error('Invalid blog data format');
        }
      } catch (error) {
        console.error('Fetch blogs error:', error);
        setBlogsError(error instanceof Error ? error.message : 'An error occurred while fetching blogs');
        setBlogs([]);
      } finally {
        setBlogsLoading(false);
      }
    };

    fetchBlogs();
  }, [sortBy, searchTerm, category]);

  const handleCreateBlog = async (blogData: BlogFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          alert('Please log in to create a blog.');
          return;
        }
        throw new Error(errorData.message || 'Failed to create blog');
      }

      const createdBlog: Blog = await response.json();
      setBlogs(prevBlogs => [createdBlog, ...prevBlogs]);
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating blog:', error);
      alert(error instanceof Error ? error.message : 'Failed to create blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setSelectedBlog(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white relative">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
            transform: translate3d(0, -8px, 0);
          }
          70% {
            animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }
        @keyframes staggerFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .blog-card {
          animation: staggerFadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        .blog-card:nth-child(1) { animation-delay: 0.1s; }
        .blog-card:nth-child(2) { animation-delay: 0.2s; }
        .blog-card:nth-child(3) { animation-delay: 0.3s; }
        .blog-card:nth-child(4) { animation-delay: 0.4s; }
        .blog-card:nth-child(5) { animation-delay: 0.5s; }
        .blog-card:nth-child(6) { animation-delay: 0.6s; }
        .blog-card:nth-child(n+7) { animation-delay: 0.7s; }
      `}</style>

      {/* Main Content Container - Fixed padding and spacing */}
      <div className="relative z-10 pt-20 pb-32 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-7xl mx-auto w-full">
          {/* Hero Section - Reduced margins */}
          <div className="text-center mb-12 lg:mb-16 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]">
            <div className="relative inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 mb-6">
              <Sparkles className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-lg animate-pulse" />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 lg:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 leading-tight">
              Community Blogs
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto mb-6 leading-relaxed">
              Discover insights, experiences, and knowledge shared by our amazing community of developers and tech enthusiasts
            </p>

            <div className="flex items-center justify-center space-x-6 lg:space-x-8 text-sm opacity-0 animate-[fadeIn_0.6s_ease-out_0.5s_forwards]">
              <div className="flex items-center space-x-2 text-gray-500">
                <Users className="h-4 w-4" />
                <span>{blogs.length} Articles</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <Heart className="h-4 w-4" />
                <span>{blogs.reduce((acc, blog) => acc + (blog.likes || 0), 0)} Likes</span>
              </div>
            </div>
          </div>

          {/* Blog List Section - Full width container */}
          <div className="w-full">
            <BlogListSection
              blogs={blogs}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortBy={sortBy}
              setSortBy={setSortBy}
              category={category}
              setCategory={setCategory}
              blogsLoading={blogsLoading}
              blogsError={blogsError}
              setSelectedBlog={setSelectedBlog}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateBlogModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSubmit={handleCreateBlog}
        isSubmitting={isSubmitting}
      />

      {selectedBlog && (
        <BlogModal
          blog={selectedBlog}
          onClose={handleModalClose}
          setBlogs={setBlogs}
        />
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-50 opacity-0 animate-[scaleIn_0.6s_ease-out_0.8s_forwards]">
        <button
          onClick={() => setIsCreating(true)}
          className="group relative w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:shadow-[0_25px_50px_rgba(0,255,255,0.4)] active:scale-90"
          aria-label="Create new blog"
        >
          <Plus className="h-6 w-6 lg:h-8 lg:w-8 transition-transform duration-300 group-hover:rotate-90" />
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 lg:bottom-8 lg:left-8 z-50 w-12 h-12 rounded-full bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 text-gray-400 hover:text-white hover:bg-zinc-700 transition-all duration-300 transform hover:scale-110 opacity-0 animate-[slideInFromRight_0.3s_ease-out_forwards] shadow-lg"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5 mx-auto" />
        </button>
      )}

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 lg:w-96 lg:h-96 bg-cyan-500/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 lg:w-[500px] lg:h-[500px] bg-purple-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] lg:w-[1000px] lg:h-[1000px] bg-gradient-radial from-cyan-500/2 via-purple-500/2 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30" />
      </div>

      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-zinc-800/50 z-40">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ 
            width: `${Math.min(100, (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)}%` 
          }}
        />
      </div>
    </div>
  );
};

export default BlogPage;