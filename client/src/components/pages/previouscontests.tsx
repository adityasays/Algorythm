import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Filter, Search, Award, Clock, ExternalLink, ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import YouTube from 'react-youtube';
import Nav from '../nav';
import { getPastContests } from '../../utils/contestUtils';

// Platform badges with colors
const platformColors = {
  'LeetCode': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '🏆' },
  'CodeForces': { bg: 'bg-red-500/20', text: 'text-red-400', icon: '⚡' },
  'HackerRank': { bg: 'bg-green-500/20', text: 'text-green-400', icon: '🎯' },
  'AtCoder': { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '🔮' },
  'Codechef': { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: '👨‍🍳' },
  'TopCoder': { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🏅' },
  'default': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: '🌐' }
};

// Interface for Contest type
interface Contest {
  id: string;
  platform: string;
  name: string;
  startTime: string;
  duration: string;
  link: string;
  status: 'upcoming' | 'past';
  solutions?: Array<{
    videoId: string;
    title: string;
    url: string;
    thumbnail: string;
  }>;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

const PreviousContests = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [pastContests, setPastContests] = useState<Contest[]>([]);
  const [filteredContests, setFilteredContests] = useState<Contest[]>([]);
  const [contestsLoading, setContestsLoading] = useState(true);
  const [contestsError, setContestsError] = useState<string | null>(null);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showBookmarkAnimation, setShowBookmarkAnimation] = useState(false);
  const [bookmarkedContests, setBookmarkedContests] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const modalRef = useRef<HTMLDivElement>(null);

  // Check local storage for authentication
  useEffect(() => {
    try {
      const name = localStorage.getItem('name');
      const usernameStored = localStorage.getItem('username');
      const storedBookmarks = localStorage.getItem('bookmarkedContests');
      
      if (name && usernameStored) {
        setIsLoggedIn(true);
        setUsername(name);
      }
      
      if (storedBookmarks) {
        setBookmarkedContests(JSON.parse(storedBookmarks));
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  // Fetch past contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setContestsLoading(true);
        const contests = await getPastContests();
        
        // Default sort by newest first
        const sortedContests = contests.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        
        setPastContests(sortedContests);
        setFilteredContests(sortedContests);
        
        // Extract unique platforms
        const uniquePlatforms = Array.from(new Set(contests.map(contest => contest.platform)));
        setPlatforms(uniquePlatforms);
        
        setContestsError(null);
      } catch (error) {
        console.error('Error fetching past contests:', error);
        setContestsError('Failed to load past contests.');
      } finally {
        setContestsLoading(false);
      }
    };

    fetchContests();
  }, []);

  // Filter contests based on search term and platform
  useEffect(() => {
    let filtered = [...pastContests];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(contest => 
        contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contest.platform.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply platform filter
    if (selectedPlatform) {
      filtered = filtered.filter(contest => contest.platform === selectedPlatform);
    }
    
    // Apply sort order
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredContests(filtered);
  }, [searchTerm, selectedPlatform, pastContests, sortOrder]);

  // Format contest date in IST
  const formatContestDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return "Invalid Date";
    }
  };
  
  // Format duration in a readable format
  const formatDuration = (duration: string): string => {
    // If duration is already in a nice format, return it
    if (duration.includes('hour') || duration.includes('min')) return duration;
    
    // Try to parse duration string (assuming it's in minutes or hours:minutes format)
    if (duration.includes(':')) {
      const [hours, minutes] = duration.split(':').map(Number);
      return `${hours}h ${minutes}m`;
    } else {
      const mins = parseInt(duration);
      if (!isNaN(mins)) {
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        if (hours > 0) {
          return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ''}`;
        } else {
          return `${mins}m`;
        }
      }
    }
    
    return duration;
  };

  // Handle contest click
  const handleContestClick = (contest: Contest) => {
    setSelectedContest(contest);
    setCurrentVideoIndex(0);
  };

  // Close modal
  const closeModal = () => {
    setSelectedContest(null);
  };

  // Handle video navigation
  const navigateVideo = (direction: 'prev' | 'next') => {
    if (!selectedContest?.solutions) return;
    
    const totalVideos = selectedContest.solutions.length;
    if (direction === 'prev') {
      setCurrentVideoIndex((prev) => (prev - 1 + totalVideos) % totalVideos);
    } else {
      setCurrentVideoIndex((prev) => (prev + 1) % totalVideos);
    }
  };

  // Toggle bookmark for a contest
  const toggleBookmark = (contestId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the modal
    
    setBookmarkedContests(prev => {
      const isBookmarked = prev.includes(contestId);
      const newBookmarks = isBookmarked
        ? prev.filter(id => id !== contestId)
        : [...prev, contestId];
        
      // Save to localStorage
      localStorage.setItem('bookmarkedContests', JSON.stringify(newBookmarks));
      
      // Show animation
      setShowBookmarkAnimation(true);
      setTimeout(() => setShowBookmarkAnimation(false), 1500);
      
      return newBookmarks;
    });
  };

  // Handle click outside modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };

    if (selectedContest) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedContest]);

  // YouTube player options
  const youtubeOpts = {
    height: '390',
    width: '100%',
    playerVars: {
      autoplay: 0,
    },
  };

  // Get platform style
  const getPlatformStyle = (platform: string) => {
    return platform in platformColors 
      ? platformColors[platform as keyof typeof platformColors] 
      : platformColors.default;
  };

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };
  
  // Header animation variants
  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut" 
      } 
    }
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 min-h-screen text-white">
      <Nav  />

      <section className="py-16 px-4 max-w-7xl mx-auto">
        {/* Header with animated background */}
        <motion.div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 p-8 mb-10 backdrop-blur-sm border border-zinc-700/30"
          initial="hidden"
          animate="visible"
          variants={headerVariants}
        >
          <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px] opacity-20"></div>
          <div className="absolute h-32 w-32 rounded-full bg-blue-500/20 blur-3xl -top-10 -right-10"></div>
          <div className="absolute h-24 w-24 rounded-full bg-cyan-500/20 blur-3xl bottom-5 right-20"></div>
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-cyan-400 mr-4" />
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">Past Contests</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search contests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-800/80 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-2">
                {/* Platform Filter */}
                <div className="relative inline-block">
                  <select
                    value={selectedPlatform || ''}
                    onChange={(e) => setSelectedPlatform(e.target.value || null)}
                    className="appearance-none bg-zinc-800/80 border border-zinc-700/50 rounded-lg pl-4 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                  >
                    <option value="">All Platforms</option>
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                </div>
                
                {/* Sort Order */}
                <button
                  onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                  className="bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-4 py-2 focus:outline-none hover:bg-zinc-700/80 focus:ring-2 focus:ring-cyan-500/50 transition"
                >
                  {sortOrder === 'newest' ? 'Newest' : 'Oldest'} First
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {contestsLoading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
            ></motion.div>
          </div>
        ) : contestsError ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-8 bg-red-500/10 rounded-xl border border-red-500/20"
          >
            <p className="text-red-400 text-lg">{contestsError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
            >
              Try Again
            </button>
          </motion.div>
        ) : filteredContests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-12 bg-zinc-800/50 rounded-xl border border-zinc-700/30"
          >
            <p className="text-zinc-300 text-lg mb-2">No contests found matching your criteria.</p>
            <p className="text-zinc-400">Try adjusting your filters or search term.</p>
          </motion.div>
        ) : (
          <>
            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-cyan-400">{filteredContests.length}</span>
                <span className="text-zinc-400 text-sm">Total Contests</span>
              </div>
              <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-purple-400">{platforms.length}</span>
                <span className="text-zinc-400 text-sm">Platforms</span>
              </div>
              <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-green-400">
                  {filteredContests.reduce((sum, contest) => sum + (contest.solutions?.length || 0), 0)}
                </span>
                <span className="text-zinc-400 text-sm">Solution Videos</span>
              </div>
              <div className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4 flex flex-col items-center">
                <span className="text-3xl font-bold text-amber-400">{bookmarkedContests.length}</span>
                <span className="text-zinc-400 text-sm">Bookmarked</span>
              </div>
            </motion.div>
            
            {/* Contest Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContests.map((contest, index) => {
                const platformStyle = getPlatformStyle(contest.platform);
                const isBookmarked = bookmarkedContests.includes(contest.id);
                
                return (
                  <motion.div
                    key={contest.id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-sm rounded-xl border border-zinc-700/30 overflow-hidden shadow-lg hover:shadow-cyan-900/10 transition-all group"
                  >
                    <div 
                      className="relative h-28 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 flex items-center justify-center cursor-pointer"
                      onClick={() => handleContestClick(contest)}
                    >
                      <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px] opacity-20"></div>
                      <span className="text-4xl">{platformStyle.icon}</span>
                      
                      {/* Bookmark button */}
                      <button 
                        onClick={(e) => toggleBookmark(contest.id, e)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-800/80 border border-zinc-700/50"
                      >
                        <Star 
                          size={16} 
                          className={`${isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'} transition-colors`} 
                        />
                      </button>
                      
                      {/* Has solutions indicator */}
                      {contest.solutions && contest.solutions.length > 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center gap-1">
                          <Play size={12} className="text-green-400" />
                          <span className="text-xs text-green-400">{contest.solutions.length}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5" onClick={() => handleContestClick(contest)}>
                      <div className={`text-xs font-semibold mb-2 ${platformStyle.bg} ${platformStyle.text} px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 w-fit`}>
                        {contest.platform}
                      </div>
                      
                      <h3 className="text-lg font-bold mb-3 line-clamp-2 group-hover:text-cyan-100 transition-colors">
                        {contest.name}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-sm text-zinc-400 mb-2">
                        <Calendar size={14} />
                        <span>{formatContestDate(contest.startTime)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-sm text-zinc-400 mb-4">
                        <Clock size={14} />
                        <span>{formatDuration(contest.duration)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <a 
                          href={contest.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 text-sm inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit Contest <ExternalLink size={14} />
                        </a>
                        
                        {contest.solutions && contest.solutions.length > 0 && (
                          <button 
                            className="text-sm text-green-400 inline-flex items-center gap-1.5 hover:text-green-300 transition-colors"
                          >
                            View Solutions <Play size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Bookmark Animation */}
            <AnimatePresence>
              {showBookmarkAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed bottom-8 right-8 bg-zinc-800 px-4 py-3 rounded-lg shadow-lg border border-amber-500/30 flex items-center gap-2"
                >
                  <Star className="text-amber-400 fill-amber-400" size={18} />
                  <span>Bookmarks updated</span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </section>

      {/* Modal for YouTube videos */}
      <AnimatePresence>
        {selectedContest && (
          <motion.div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              ref={modalRef}
              className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700/50 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 flex justify-between items-center">
                <div>
                  <div className={`text-xs font-semibold mb-1 ${getPlatformStyle(selectedContest.platform).bg} ${getPlatformStyle(selectedContest.platform).text} px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 w-fit`}>
                    {selectedContest.platform}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{selectedContest.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{formatContestDate(selectedContest.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} />
                      <span>{formatDuration(selectedContest.duration)}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-zinc-700/50 transition"
                >
                  <X className="h-6 w-6 text-zinc-300 hover:text-white" />
                </button>
              </div>
              
              {selectedContest.solutions && selectedContest.solutions.length > 0 ? (
                <div className="p-6">
                  <div className="mb-4 flex justify-between items-center">
                    <h4 className="text-xl font-semibold text-white">Solution Videos ({selectedContest.solutions.length})</h4>
                    <div className="flex gap-2">
                      {selectedContest.solutions.length > 1 && (
                        <>
                          <button 
                            onClick={() => navigateVideo('prev')}
                            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition"
                            disabled={selectedContest.solutions.length <= 1}
                          >
                            <ChevronLeft size={20} className="text-zinc-300" />
                          </button>
                          <button 
                            onClick={() => navigateVideo('next')}
                            className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition"
                            disabled={selectedContest.solutions.length <= 1}
                          >
                            <ChevronRight size={20} className="text-zinc-300" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-zinc-950 rounded-lg overflow-hidden">
                    <div className="aspect-video">
                      <YouTube 
                        videoId={selectedContest.solutions[currentVideoIndex].videoId} 
                        opts={{
                          ...youtubeOpts,
                          width: '100%',
                          height: '100%',
                        }} 
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h5 className="text-lg font-medium text-white">
                      {selectedContest.solutions[currentVideoIndex].title}
                    </h5>
                    <a 
                      href={selectedContest.solutions[currentVideoIndex].url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 text-sm mt-2 inline-flex items-center gap-1.5"
                    >
                      Watch on YouTube <ExternalLink size={14} />
                    </a>
                  </div>
                  
                  {/* Video thumbnails */}
                  {selectedContest.solutions.length > 1 && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {selectedContest.solutions.map((solution, index) => (
                        <div 
                          key={solution.videoId}
                          onClick={() => setCurrentVideoIndex(index)}
                          className={`relative cursor-pointer rounded-lg overflow-hidden ${
                            index === currentVideoIndex ? 'ring-2 ring-cyan-500' : ''
                          }`}
                        >
                          <img 
                            src={solution.thumbnail || `/api/placeholder/320/180`} 
                            alt={solution.title}
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition">
                            <Play size={24} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Award className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                  <p className="text-zinc-300 text-lg mb-2">No solution videos available yet.</p>
                  <p className="text-zinc-400">Check back soon or visit the contest page directly.</p>
                  <a 
                    href={selectedContest.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg inline-flex items-center gap-2 hover:bg-cyan-600/30 transition"
                  >
                    Visit Contest <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PreviousContests;