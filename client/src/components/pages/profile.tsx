import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Trophy, Calendar, BookOpen, Sparkles, Star, Award, Target, TrendingUp, Code, Zap, Crown, Eye, ThumbsUp, Edit } from 'lucide-react';

// Type definitions for the API responses
interface UserData {
  username: string;
  name?: string;
  collegeName?: string;
  codeforcesUsername?: string;
  codechefUsername?: string;
  leetcodeUsername?: string;
  ratings?: {
    codeforces: number;
    codechef: number;
    leetcode: number;
  };
  compositeScore?: number;
  potdSolved?: number;
  streak?: number;
  xp?: number;
  level?: number;
  blogCount?: number;
}

interface BlogData {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  views?: number;
  likes?: number;
  readTime: string;
  tags: string[];
}

interface ActivityData {
  date: string;
  count: number;
}

const ProfilePage: React.FC = () => {
  const { username: urlUsername } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userBlogs, setUserBlogs] = useState<BlogData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Get current user from localStorage
  const getAuthStorage = () => {
    try {
      
      const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      
      
      const username = authStorage?.state?.user?.username;
      
      return username;
    } catch (e) {
      console.warn('⚠️ Error parsing auth storage:', e);
      return undefined;
    }
  };

  const currentUsername: string | undefined = getAuthStorage();

  // Determine which username to use: URL parameter or current user from localStorage
  const username = urlUsername || currentUsername;
  
  
  
  

  // API base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/profile`;

  useEffect(() => {
    
    
    // If no username, show login prompt
    if (!username) {
      
      setError('No user found, please login');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        
        setLoading(true);
        setError(null);

        // Fetch user profile
        const profileUrl = `${API_BASE_URL}/username/${username}`;
        
        
        const profileResponse = await fetch(profileUrl);
        
       
        console.log('📥 Profile Response Headers:', Object.fromEntries(profileResponse.headers.entries()));

        if (!profileResponse.ok) {
          const errorText = await profileResponse.text();
          
          throw new Error(`Failed to fetch user profile (${profileResponse.status}): ${errorText}`);
        }

        const profileData: UserData = await profileResponse.json();
        
        setUserData(profileData);

        // Fetch user blogs 
        const blogsUrl = `${API_BASE_URL}/username/${username}/blogs`;
        
        
        try {
          const blogsResponse = await fetch(blogsUrl);
          
          
          if (blogsResponse.ok) {
            const blogsData: BlogData[] = await blogsResponse.json();
            
            setUserBlogs(blogsData);
          } else if (blogsResponse.status === 404) {
            
            setUserBlogs([]);
          } else {
            const blogsErrorText = await blogsResponse.text();
            
            setUserBlogs([]);
          }
        } catch (blogsError) {
          
          setUserBlogs([]);
        }

        // Fetch user activity - handle 404 gracefully
        const activityUrl = `${API_BASE_URL}/username/${username}/activity`;
        
        
        try {
          const activityResponse = await fetch(activityUrl);
          
          
          if (activityResponse.ok) {
            const activityDataResponse: ActivityData[] = await activityResponse.json();
            
            setActivityData(activityDataResponse);
          } else if (activityResponse.status === 404) {
            
            setActivityData([]);
          } else {
            const activityErrorText = await activityResponse.text();
          
            setActivityData([]);
          }
        } catch (activityError) {
          console.log('⚠️ Error fetching activity:', activityError);
          setActivityData([]);
        }

        

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error(' Error fetching data:', err);
        console.error(' Error details:', {
          message: errorMessage,
          stack: err instanceof Error ? err.stack : 'No stack trace available'
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
        
      }
    };

    fetchUserData();
  }, [username]);

  // Generate fallback heatmap data if no activity data
  const generateFallbackHeatmapData = (): ActivityData[] => {
    
    const data: ActivityData[] = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const count = Math.floor(Math.random() * 5);
      if (count > 0) {
        data.push({
          date: d.toISOString().split('T')[0],
          count,
        });
      }
    }
    console.log('🎲 Generated fallback heatmap data points:', data.length);
    return data;
  };

  const heatmapData = activityData.length > 0 ? activityData : generateFallbackHeatmapData();

  const platforms = userData
    ? [
        {
          name: 'Codeforces',
          rating: userData.ratings?.codeforces || 0,
          color: 'from-red-500 to-rose-600',
          icon: Code,
          username: userData.codeforcesUsername,
        },
        {
          name: 'CodeChef',
          rating: userData.ratings?.codechef || 0,
          color: 'from-blue-500 to-indigo-600',
          icon: Trophy,
          username: userData.codechefUsername,
        },
        {
          name: 'LeetCode',
          rating: userData.ratings?.leetcode || 0,
          color: 'from-yellow-500 to-orange-600',
          icon: Target,
          username: userData.leetcodeUsername,
        },
      ]
    : [];

  const stats = userData
    ? [
        { label: 'POTD Solved', value: userData.potdSolved || 0, icon: Target, color: 'text-emerald-400' },
        { label: 'Current Streak', value: `${userData.streak || 0} days`, icon: Zap, color: 'text-yellow-400' },
        { label: 'Total XP', value: (userData.xp || 0).toLocaleString(), icon: Star, color: 'text-purple-400' },
        { label: 'Level', value: userData.level || 1, icon: Crown, color: 'text-blue-400' },
      ]
    : [];

  const achievements = userData
    ? [
        { name: 'First Blog', desc: 'Published your first blog', icon: BookOpen, unlocked: (userData.blogCount || 0) >= 1 },
        { name: 'Streak Master', desc: '30+ day streak', icon: Zap, unlocked: (userData.streak || 0) >= 30 },
        { name: 'POTD Champion', desc: 'Solved 30+ POTD', icon: Target, unlocked: (userData.potdSolved || 0) >= 30 },
        { name: 'Content Creator', desc: 'Published 10+ blogs', icon: Edit, unlocked: (userData.blogCount || 0) >= 10 },
      ]
    : [];

  const HeatmapGrid: React.FC = () => {
    const weeks: Array<Array<{ date: string; count: number }>> = [];
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    const dataMap: Record<string, number> = {};
    heatmapData.forEach((item) => {
      dataMap[item.date] = item.count;
    });

    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const week: Array<{ date: string; count: number }> = [];
      
      
      for (let i = 0; i < 7 && currentDate <= endDate; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = dataMap[dateStr] || 0;
        week.push({ date: dateStr, count });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (week.length > 0) {
        weeks.push(week);
      }
    }

    const getIntensity = (count: number): string => {
      if (count === 0) return 'bg-gray-800/50';
      if (count <= 2) return 'bg-emerald-900/60';
      if (count <= 4) return 'bg-emerald-700/70';
      if (count <= 6) return 'bg-emerald-500/80';
      return 'bg-emerald-400/90';
    };

    return (
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} border border-gray-700/30 hover:border-emerald-400/50 transition-all duration-200 cursor-pointer`}
                title={`${day.date}: ${day.count} problems`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const BlogCard: React.FC<{ blog: BlogData }> = ({ blog }) => (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:border-gray-600/50 hover:shadow-xl hover:shadow-black/20">
      <div className="flex flex-wrap gap-2 mb-3">
        {blog.tags && blog.tags.map((tag) => (
          <span key={tag} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
            {tag}
          </span>
        ))}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
        {blog.title}
      </h3>
      <p className="text-gray-400 mb-4 line-clamp-3">{blog.excerpt}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {blog.views || 0}
          </span>
          <span className="flex items-center">
            <ThumbsUp className="w-4 h-4 mr-1" />
            {blog.likes || 0}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span>{blog.readTime}</span>
          <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  
  console.log('🔍 Current component state:', {
    loading,
    error,
    userData: userData ? 'Present' : 'Null',
    userBlogs: userBlogs.length,
    activityData: activityData.length,
    username,
  });

  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching data for: {username}</p>
        </div>
      </div>
    );
  }

  if (error) {
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Profile</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-gray-500 text-sm mb-4">Username: {username}</p>
          <button
            onClick={() => {
              console.log('🔄 Retry button clicked, reloading page');
              window.location.reload();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
          {error === 'No user found, please login' && (
            <button
              onClick={() => {
                console.log('🔑 Login button clicked, navigating to /login');
                navigate('/login');
              }}
              className="ml-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!userData) {
    console.log('👤 Rendering user not found state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
          <p className="text-gray-400">Could not find profile for username: {username}</p>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-emerald-500 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-2xl shadow-blue-500/20 border border-white/10">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : userData.username.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  {userData.name || userData.username}
                </h1>
                <p className="text-xl text-gray-400 mt-1">@{userData.username}</p>
                <p className="text-gray-500 mt-1 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {userData.collegeName || 'College not specified'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-400">Level {userData.level || 1}</div>
              <div className="text-gray-400">XP: {(userData.xp || 0).toLocaleString()}</div>
              <div className="text-sm text-purple-400 mt-1">Score: {userData.compositeScore || 0}</div>
            </div>
          </div>

          <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
            {['overview', 'activity', 'achievements', 'blogs'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  console.log(`🔧 Switching to tab: ${tab}`);
                  setActiveTab(tab);
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 capitalize ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:border-gray-600/50 hover:shadow-xl hover:shadow-black/20"
                    onMouseEnter={() => {
                      console.log(`🖱️ Hovering card: ${stat.label}`);
                      setHoveredCard(index);
                    }}
                    onMouseLeave={() => {
                      console.log(`🖱️ Unhovering card: ${stat.label}`);
                      setHoveredCard(null);
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon className={`w-8 h-8 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                    </div>
                    <div className="text-gray-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Trophy className="w-6 h-6 mr-3 text-yellow-400" />
                Platform Ratings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <div
                      key={platform.name}
                      className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:border-gray-600/50 hover:shadow-xl hover:shadow-black/20"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${platform.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">{platform.rating}</div>
                          <div className="text-sm text-gray-400">Rating</div>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-white">{platform.name}</div>
                      {platform.username && (
                        <div className="text-sm text-gray-400">@{platform.username}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-emerald-400" />
                Performance Score
              </h2>
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:border-gray-600/50">
                <div className="text-lg font-semibold text-gray-300 mb-2">Composite Score</div>
                <div className="text-3xl font-bold text-white">{userData.compositeScore || 0}</div>
                <div className="text-sm text-purple-400 mt-2">Based on all platform ratings</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-purple-400" />
                Coding Activity
              </h2>
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Problem Solving Heatmap</h3>
                  <p className="text-gray-400 text-sm">Daily coding activity over the past year</p>
                </div>
                <HeatmapGrid />
                <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                  <span>Less</span>
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-gray-800/50 rounded-sm"></div>
                    <div className="w-3 h-3 bg-emerald-900/60 rounded-sm"></div>
                    <div className="w-3 h-3 bg-emerald-700/70 rounded-sm"></div>
                    <div className="w-3 h-3 bg-emerald-500/80 rounded-sm"></div>
                    <div className="w-3 h-3 bg-emerald-400/90 rounded-sm"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-400" />
                  Blogs Published
                </h3>
                <div className="text-3xl font-bold text-white mb-2">{userData.blogCount || 0}</div>
                <div className="text-sm text-gray-400">Technical articles shared</div>
              </div>
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Current Streak
                </h3>
                <div className="text-3xl font-bold text-white mb-2">{userData.streak || 0} days</div>
                <div className="text-sm text-gray-400">Keep it up!</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Award className="w-6 h-6 mr-3 text-yellow-400" />
                Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.name}
                      className={`bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 transition-all duration-300 ${
                        achievement.unlocked
                          ? 'hover:bg-gray-800/60 hover:border-gray-600/50 hover:shadow-xl hover:shadow-black/20'
                          : 'opacity-50 grayscale'
                      }`}
                    >
                      <div className="flex items-center mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            achievement.unlocked
                              ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg shadow-yellow-500/25'
                              : 'bg-gray-700'
                          }`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-white">{achievement.name}</h3>
                          <p className="text-sm text-gray-400">{achievement.desc}</p>
                        </div>
                      </div>
                      {achievement.unlocked && (
                        <div className="text-xs text-emerald-400 font-medium">✓ Unlocked</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                Progress to Next Level
              </h3>
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Level {userData.level || 1}</span>
                  <span>Level {(userData.level || 1) + 1}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                    style={{
                      width: `${((userData.xp || 0) % 1000) / 10}%`,
                    }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {1000 - ((userData.xp || 0) % 1000)} XP until next level
              </p>
            </div>
          </div>
        )}

        {activeTab === 'blogs' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center">
                <BookOpen className="w-6 h-6 mr-3 text-blue-400" />
                Blogs ({userBlogs.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
            {userBlogs.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No blogs yet</h3>
                <p className="text-gray-500">This user hasn't shared any blogs yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;