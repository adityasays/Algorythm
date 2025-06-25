"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, Terminal, Home, Book, Calendar, User, ChevronDown, Settings, LogOut, BookOpen, Swords } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore'; // Adjust path as needed
import axios from 'axios';

const Nav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  
  const { isLoggedIn, user, logout, setUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Enhanced authentication check function
  const checkAuthState = useCallback(async () => {
    setIsAuthChecking(true);
    try {
      const username = localStorage.getItem('username');
      
      if (username) {
        // If we have username but no user in store, try to restore from API
        if (!user || !isLoggedIn) {
          try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile`, { 
              withCredentials: true,
              timeout: 5000 // 5 second timeout
            });
            
            if (response.status === 200 && response.data) {
              // Create user object from API response and localStorage
              const userData = {
                username,
                name: response.data.name || localStorage.getItem('name') || '',
                collegeName: response.data.collegeName || localStorage.getItem('collegeName') || '',
                codeforcesUsername: response.data.codeforcesUsername || localStorage.getItem('codeforcesUsername') || '',
                codechefUsername: response.data.codechefUsername || localStorage.getItem('codechefUsername') || '',
                leetcodeUsername: response.data.leetcodeUsername || localStorage.getItem('leetcodeUsername') || '',
              };
              
              // Update localStorage with fresh data
              Object.entries(userData).forEach(([key, value]) => {
                if (value) localStorage.setItem(key, value);
              });
              
              setUser(userData);
            }
          } catch (apiError) {
            console.warn('Failed to fetch user profile:', apiError);
            // If API fails but we have localStorage data, use it
            const userData = {
              username,
              name: localStorage.getItem('name') || '',
              collegeName: localStorage.getItem('collegeName') || '',
              codeforcesUsername: localStorage.getItem('codeforcesUsername') || '',
              codechefUsername: localStorage.getItem('codechefUsername') || '',
              leetcodeUsername: localStorage.getItem('leetcodeUsername') || '',
            };
            setUser(userData);
          }
        }
      } else if (isLoggedIn) {
        // No username but store thinks user is logged in - clear auth state
        logout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, if we're supposed to be logged in, try to maintain state with localStorage
      const username = localStorage.getItem('username');
      if (username && !user) {
        const userData = {
          username,
          name: localStorage.getItem('name') || '',
          collegeName: localStorage.getItem('collegeName') || '',
          codeforcesUsername: localStorage.getItem('codeforcesUsername') || '',
          codechefUsername: localStorage.getItem('codechefUsername') || '',
          leetcodeUsername: localStorage.getItem('leetcodeUsername') || '',
        };
        setUser(userData);
      }
    } finally {
      setIsAuthChecking(false);
    }
  }, [isLoggedIn, user, setUser, logout]);

  // Clear all authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('collegeName');
    localStorage.removeItem('codeforcesUsername');
    localStorage.removeItem('codechefUsername');
    localStorage.removeItem('leetcodeUsername');
    localStorage.removeItem('bookmarkedContests');
    localStorage.removeItem('solvedProblems');
    logout();
  }, [logout]);

  // Enhanced effect for auth state management
  useEffect(() => {
    // Check auth state on mount
    checkAuthState();
    
    // Set up periodic auth check (every 30 seconds)
    const interval = setInterval(() => {
      const username = localStorage.getItem('username');
      if (username && (!user || !isLoggedIn)) {
        checkAuthState();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Separate effect for route changes
  useEffect(() => {
    // Quick check on route change - don't do full API call
    const username = localStorage.getItem('username');
    if (username && !user && !isAuthChecking) {
      checkAuthState();
    }
  }, [location.pathname]);

  // Handle scroll effects for navbar
  const { scrollY } = useScroll();
  
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > lastScrollY && latest > 100) {
      setVisible(false);
    } else {
      setVisible(true);
    }
    setLastScrollY(latest);
  });

  // Close dropdowns when clicking outside or on route change
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
      if (!target.closest('.mobile-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Updated nav items with new headings
  const navItems = [
    { name: "Home", icon: <Home className="h-4 w-4 mr-1" />, link: "/" },
    { name: "Resources", icon: <Book className="h-4 w-4 mr-1" />, link: "/resources" },
    { name: "Past Contests", icon: <Calendar className="h-4 w-4 mr-1" />, link: "/past-contests" },
    { name: "Blogs", icon: <BookOpen className="h-4 w-4 mr-1" />, link: "/blogs" },
    { name: "Battles", icon: <Swords className="h-4 w-4 mr-1" />, link: "/battles" },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/user/logout`, {}, { 
        withCredentials: true,
        timeout: 5000
      });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      clearAuthData();
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      setIsLoggingOut(false);
      navigate("/user");
    }
  };

  // Don't render auth-dependent content while checking
  const showAuthContent = !isAuthChecking;

  return (
    <>
      <motion.nav 
        initial={{ y: 0, opacity: 1 }}
        animate={{ 
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 30 
        }}
        className="fixed top-0 left-0 right-0 z-40 px-4 py-6"
      >
        <motion.div 
          className="flex items-center justify-between h-14 mx-auto max-w-7xl md:max-w-[90%] lg:max-w-[80%] rounded-full px-6 backdrop-blur-md bg-black/75 border border-neutral-800/70 transition-all duration-300"
          initial={{ y: 16, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            boxShadow: lastScrollY > 50 ? "0 10px 30px rgba(0, 0, 0, 0.25)" : "none",
          }}
          transition={{ 
            delay: 0.2,
            duration: 0.5,
            ease: [0.23, 1, 0.32, 1]
          }}
          whileHover={{ 
            boxShadow: "0 8px 25px rgba(0, 220, 220, 0.15)"
          }}
        >
          {/* Logo Section */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.5 }}
                >
                  <Terminal className="h-6 w-6 text-cyan-400" />
                </motion.div>
                <motion.span 
                  className="ml-2 text-white font-mono text-xl tracking-tight"
                  animate={{ 
                    scale: lastScrollY > 100 ? 0.95 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-bold">Algo</span>
                  <span className="text-cyan-400">rythm</span>
                </motion.span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                {navItems.map((item, idx) => (
                  <NavItem 
                    key={idx} 
                    item={item} 
                    isActive={location.pathname === item.link}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {showAuthContent && isLoggedIn && user ? (
                <div className="relative profile-dropdown">
                  <motion.button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center px-3 py-2 text-sm rounded-full text-white bg-neutral-800/80 hover:bg-neutral-700/90 transition-colors duration-200 focus:outline-none border border-neutral-700/30"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isLoggingOut}
                  >
                    <span className="mr-2 font-medium text-gray-300 max-w-24 truncate">
                      {user.username}
                    </span>
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <ChevronDown 
                      className={`ml-1 h-4 w-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                        isProfileOpen ? 'transform rotate-180' : ''
                      }`} 
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-neutral-900/90 backdrop-blur-lg ring-1 ring-black ring-opacity-5 py-1 divide-y divide-neutral-700/50 border border-neutral-800/50"
                      >
                        <div className="py-1">
                          <Link 
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-neutral-800/70 hover:text-white rounded-md mx-1 my-0.5 transition-colors duration-150"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <User className="mr-3 h-4 w-4 text-gray-400" />
                            Your Profile
                          </Link>
                          <Link 
                            to="/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-neutral-800/70 hover:text-white rounded-md mx-1 my-0.5 transition-colors duration-150"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Settings className="mr-3 h-4 w-4 text-gray-400" />
                            Settings
                          </Link>
                        </div>
                        <div className="py-1">
                          <button 
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-neutral-800/70 hover:text-white rounded-md mx-1 my-0.5 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <LogOut className="mr-3 h-4 w-4 text-gray-400" />
                            {isLoggingOut ? 'Signing out...' : 'Sign out'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : showAuthContent ? (
                <div className="flex items-center space-x-3">
                  <motion.button
                    className="px-3 py-1.5 rounded-full border border-neutral-700/50 text-white text-sm font-medium hover:bg-neutral-800/70 transition-all duration-200"
                    whileHover={{ scale: 1.03, borderColor: "rgba(136, 136, 136, 0.7)" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link to="/user" className="block w-full h-full">Log in</Link>
                  </motion.button>
                  <motion.button
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/20"
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: "0 5px 15px rgba(0, 220, 220, 0.3)",
                      backgroundImage: "linear-gradient(to right, #22d3ee, #2563eb)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link to="/user" className="block w-full h-full">Get Started</Link>
                  </motion.button>
                </div>
              ) : (
                // Loading state
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-8 bg-neutral-800/50 rounded-full animate-pulse"></div>
                  <div className="w-20 h-8 bg-neutral-800/50 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-white hover:bg-neutral-800/70 focus:outline-none mobile-menu"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="block h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="block h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-24 left-4 right-4 z-40 bg-black/90 backdrop-blur-xl border border-neutral-800/70 rounded-2xl shadow-2xl overflow-hidden mobile-menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.link}
                  className={`flex items-center ${
                    location.pathname === item.link 
                      ? 'text-white bg-neutral-800/70' 
                      : 'text-gray-300 hover:text-white hover:bg-neutral-800/70'
                  } px-3 py-2 rounded-lg text-base font-medium transition-colors duration-150 mx-1 my-0.5`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="pt-4 pb-4 border-t border-neutral-700/50">
              {showAuthContent && isLoggedIn && user ? (
                <div className="px-4 space-y-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-base font-medium text-white truncate">{user.username}</div>
                      <div className="text-sm font-medium text-gray-400">{user.name || 'No name set'}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <motion.button
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block w-full h-full">
                        View Profile
                      </Link>
                    </motion.button>
                    
                    <motion.button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full py-2 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 font-semibold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </motion.button>
                  </div>
                </div>
              ) : showAuthContent ? (
                <div className="px-4 flex flex-col space-y-3">
                  <motion.button
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link to="/user" onClick={() => setIsMenuOpen(false)} className="block w-full h-full">
                      Get Started
                    </Link>
                  </motion.button>
                  <motion.button
                    className="w-full py-2 rounded-xl border border-neutral-700/50 text-white font-semibold text-sm hover:bg-neutral-800/50 transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link to="/user" onClick={() => setIsMenuOpen(false)} className="block w-full h-full">
                      Log in
                    </Link>
                  </motion.button>
                </div>
              ) : (
                // Loading state for mobile
                <div className="px-4 flex flex-col space-y-3">
                  <div className="w-full h-10 bg-neutral-800/50 rounded-xl animate-pulse"></div>
                  <div className="w-full h-10 bg-neutral-800/50 rounded-xl animate-pulse"></div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const NavItem: React.FC<{ 
  item: { name: string; icon: React.ReactNode; link: string };
  isActive: boolean;
}> = ({ item, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="relative">
      <Link 
        to={item.link}
        className={`flex items-center px-3 py-2 text-sm font-medium transition-colors duration-150 relative z-10 ${
          isActive ? 'text-white' : 'text-gray-500 hover:text-white'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence>
          {(isHovered || isActive) && (
            <motion.div
              layoutId="hoverBg"
              className="absolute inset-0 rounded-full bg-neutral-800/70"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
        <span className="relative z-10 flex items-center">
          {item.icon}
          {item.name}
        </span>
      </Link>
      <AnimatePresence>
        {isActive && (
          <motion.div 
            className="absolute -bottom-1 left-3 right-3 h-0.5 bg-cyan-500 rounded-full"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Nav;