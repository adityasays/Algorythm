"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Calendar, Trophy, Users, ChevronRight, Code, ArrowRight, BookOpen, User as UserIcon, Link as LinkIcon, MessageCircle, Swords, Type, AlertTriangle, Clock, Sparkles, BarChart3, GitBranch, Zap } from 'lucide-react';
import { Tabs } from '../ui/tabs';
import Nav from '../nav';
import { getUpcomingContests } from '../../utils/contestUtils';
import { useNavigate } from 'react-router-dom';


import { throttle } from 'lodash';

// Types for contests and users
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

interface User {
  id: string;
  name: string;
  username: string;
  platformUsername?: string;
  rating: number;
  rank: number;
  college?: string;
}

interface LeaderboardProps {
  users: User[];
  platform: string;
  displayCount: number;
  setDisplayCount: React.Dispatch<React.SetStateAction<number>>;
  loggedInUsername: string;
}

interface LeaderboardData {
  codeforces: Array<{
    _id: string;
    name: string;
    username: string;
    collegeName: string;
    codeforcesUsername: string;
    ratings: { codeforces: number; codechef: number; leetcode: number };
    compositeScore: number;
  }>;
  codechef: Array<{
    _id: string;
    name: string;
    username: string;
    collegeName: string;
    codechefUsername: string;
    ratings: { codeforces: number; codechef: number; leetcode: number };
    compositeScore: number;
  }>;
  leetcode: Array<{
    _id: string;
    name: string;
    username: string;
    collegeName: string;
    leetcodeUsername: string;
    ratings: { codeforces: number; codechef: number; leetcode: number };
    compositeScore: number;
  }>;
  platform: Array<{
    _id: string;
    name: string;
    username: string;
    collegeName: string;
    ratings: { codeforces: number; codechef: number; leetcode: number };
    compositeScore: number;
  }>;
}

// Interface for community cards
interface CommunityCard {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgImage: string;
  description: string;
}

// API retry utility
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [college, setCollege] = useState<string>("");
  const [platformRank, setPlatformRank] = useState<number | null>(null);
  const [collegeRank, setCollegeRank] = useState<number | null>(null);
  const [upcomingContests, setUpcomingContests] = useState<Contest[]>([]);
  const [contestsLoading, setContestsLoading] = useState<boolean>(true);
  const [contestsError, setContestsError] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [codeforcesDisplayCount, setCodeforcesDisplayCount] = useState<number>(10);
  const [codechefDisplayCount, setCodechefDisplayCount] = useState<number>(10);
  const [leetcodeDisplayCount, setLeetcodeDisplayCount] = useState<number>(10);
  const [platformDisplayCount, setPlatformDisplayCount] = useState<number>(10);

  // 3D card refs
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const backgroundsRef = useRef<(HTMLDivElement | null)[]>([]);

  // API base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // Leaderboard state
  const [collegeLeaderboard, setCollegeLeaderboard] = useState<{
    codeforces: User[];
    codechef: User[];
    leetcode: User[];
  }>({
    codeforces: [],
    codechef: [],
    leetcode: []
  });
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);

  // 3D card animation effect with throttling
  useEffect(() => {
    const range = 40;
    const calcValue = (a: number, b: number) => (a / b * range - range / 2).toFixed(1);
    let timeout: number;

    const handleMouseMove = throttle(({ x, y }: MouseEvent) => {
      if (timeout) {
        window.cancelAnimationFrame(timeout);
      }

      timeout = window.requestAnimationFrame(() => {
        const yValue = parseFloat(calcValue(y, window.innerHeight));
        const xValue = parseFloat(calcValue(x, window.innerWidth));

        if (cardsRef.current) {
          cardsRef.current.style.transform = `rotateX(${yValue}deg) rotateY(${xValue}deg)`;
        }

        imagesRef.current.forEach((image) => {
          if (image) {
            image.style.transform = `translateX(${-xValue}px) translateY(${yValue}px)`;
          }
        });

        backgroundsRef.current.forEach((background) => {
          if (background) {
            background.style.backgroundPosition = `${xValue * 0.45}px ${-yValue * 0.45}px`;
          }
        });
      });
    }, 16); // ~60fps

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      handleMouseMove.cancel();
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Community cards data
  const communityCards: CommunityCard[] = [
    {
      title: "Competitive Programming",
      icon: Trophy,
      gradient: "from-cyan-400 via-blue-500 to-indigo-500",
      bgImage: "/images/competitive-programming.png",
      description: "Master algorithms",
    },
    {
      title: "Open Source Projects",
      icon: GitBranch,
      gradient: "from-green-400 via-teal-500 to-cyan-500",
      bgImage: "/images/open-source.png",
      description: "Contribute & collaborate",
    },
    {
      title: "Skill Development",
      icon: Zap,
      gradient: "from-purple-400 via-violet-500 to-blue-500",
      bgImage: "/images/skill-development.png",
      description: "Level up your coding",
    },
  ];

  // Check local storage and fetch leaderboard
  useEffect(() => {
    try {
      const name = localStorage.getItem('name');
      const usernameStored = localStorage.getItem('username');
      const collegeName = localStorage.getItem('collegeName');
      if (name && usernameStored && collegeName) {
        setIsLoggedIn(true);
        setUsername(usernameStored);
        setCollege(collegeName);

        const fetchLeaderboard = async () => {
          try {
            setLeaderboardLoading(true);
            const response = await fetchWithRetry(
              `${API_BASE_URL}/api/leaderboard`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collegeName }),
                credentials: 'include'
              }
            );
            const data: LeaderboardData = await response.json();

            setCollegeLeaderboard({
              codeforces: data.codeforces
                .filter(user => user.ratings.codeforces > 0)
                .map((user, index) => ({
                  id: user._id,
                  name: user.name,
                  username: user.username,
                  platformUsername: user.codeforcesUsername,
                  rating: user.ratings.codeforces,
                  rank: index + 1,
                  college: user.collegeName
                })),
              codechef: data.codechef
                .filter(user => user.ratings.codechef > 0)
                .map((user, index) => ({
                  id: user._id,
                  name: user.name,
                  username: user.username,
                  platformUsername: user.codechefUsername,
                  rating: user.ratings.codechef,
                  rank: index + 1,
                  college: user.collegeName
                })),
              leetcode: data.leetcode
                .filter(user => user.ratings.leetcode > 0)
                .map((user, index) => ({
                  id: user._id,
                  name: user.name,
                  username: user.username,
                  platformUsername: user.leetcodeUsername,
                  rating: user.ratings.leetcode,
                  rank: index + 1,
                  college: user.collegeName
                }))
            });

            setPlatformUsers(
              data.platform.map((user, index) => ({
                id: user._id,
                name: user.name,
                username: user.username,
                rating: user.compositeScore,
                rank: index + 1,
                college: user.collegeName
              }))
            );

            const platformUser = data.platform.find(user => user.username === usernameStored);
            const codeforcesUser = data.codeforces.find(user => user.username === usernameStored);
            setPlatformRank(platformUser ? data.platform.indexOf(platformUser) + 1 : null);
            setCollegeRank(codeforcesUser ? data.codeforces.indexOf(codeforcesUser) + 1 : null);

            setLeaderboardError(null);
          } catch (error: unknown) {
            console.error('Error fetching leaderboard:', error);
            setLeaderboardError(
              error instanceof Error && error.message.includes('404')
                ? 'Leaderboard endpoint not found. Check if backend is running.'
                : 'Failed to load leaderboard. Please try again later.'
            );
          } finally {
            setLeaderboardLoading(false);
          }
        };

        fetchLeaderboard();
      } else {
        setIsLoggedIn(false);
        setUsername("");
        setCollege("");
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setIsLoggedIn(false);
      setUsername("");
      setCollege("");
    }
  }, [API_BASE_URL]);

  // Fetch upcoming contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setContestsLoading(true);
        const contests = await getUpcomingContests();
        setUpcomingContests(contests);
        setContestsError(null);
      } catch (error) {
        console.error('Error fetching contests:', error);
        setContestsError('Failed to load upcoming contests. Please try again later.');
      } finally {
        setContestsLoading(false);
      }
    };

    fetchContests();
    const interval = setInterval(fetchContests, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle logout with a small delay for smoothness
  const handleLogout = () => {
    setTimeout(() => {
      setIsLoggedIn(false);
      setUsername("");
      setCollege("");
      setPlatformRank(null);
      setCollegeRank(null);
      try {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('college');
        localStorage.removeItem('name');
        localStorage.removeItem('collegeName');
        localStorage.removeItem('authToken');
      } catch (error) {
        console.error("Error clearing localStorage:", error);
      }
    }, 100); // 100ms delay
  };

  // Format contest date in IST
  const formatContestDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Calculate time to contest in IST
  const getTimeToContest = (dateString: string): string => {
    try {
      const contestTime = new Date(dateString).getTime();
      const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const nowTime = new Date(now).getTime();
      const distance = contestTime - nowTime;

      if (distance < 0) return "Started";

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ${hours}h`;
      return `${hours}h ${minutes}m`;
    } catch {
      return "Invalid Time";
    }
  };

  // Leaderboard tabs
  const leaderboardTabs = [
    {
      title: "Codeforces",
      value: "codeforces",
      content: (
        <LeaderboardContent
          users={collegeLeaderboard.codeforces}
          platform="Codeforces"
          displayCount={codeforcesDisplayCount}
          setDisplayCount={setCodeforcesDisplayCount}
          loggedInUsername={username}
        />
      )
    },
    {
      title: "CodeChef",
      value: "codechef",
      content: (
        <LeaderboardContent
          users={collegeLeaderboard.codechef}
          platform="CodeChef"
          displayCount={codechefDisplayCount}
          setDisplayCount={setCodechefDisplayCount}
          loggedInUsername={username}
        />
      )
    },
    {
      title: "LeetCode",
      value: "leetcode",
      content: (
        <LeaderboardContent
          users={collegeLeaderboard.leetcode}
          platform="LeetCode"
          displayCount={leetcodeDisplayCount}
          setDisplayCount={setLeetcodeDisplayCount}
          loggedInUsername={username}
        />
      )
    },
    {
      title: "Platform Rating",
      value: "platform",
      content: (
        <LeaderboardContent
          users={platformUsers}
          platform="Platform Rating"
          displayCount={platformDisplayCount}
          setDisplayCount={setPlatformDisplayCount}
          loggedInUsername={username}
        />
      )
    }
  ];

  return (
    <div className="bg-gradient-to-b from-zinc-950 to-zinc-900 min-h-screen text-white relative overflow-hidden">
      {/* Background Elements */}
      <style>
        {`
          html {
            scroll-behavior: smooth;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes cardFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          @keyframes cardFloatDelayed {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(-5deg); }
          }
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: rgba(8, 145, 178, 0.5);
            border-radius: 3px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .animate-cardFloat {
            animation: cardFloat 6s ease-in-out infinite;
          }
          .animate-cardFloatDelayed {
            animation: cardFloatDelayed 8s ease-in-out infinite;
          }
          .animate-gradient {
            background-size: 400% 400%;
            animation: gradient 4s ease infinite;
          }
          .perspective-\[1800px\] {
            perspective: 1800px;
          }
          .cards-3d {
            transform-style: preserve-3d;
          }
          .card-3d {
            transform-style: preserve-3d;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          }
          .card-3d:hover {
            box-shadow: 0 30px 60px rgba(0,0,0,0.4);
          }
        `}
      </style>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Main gradient backdrop */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-transparent to-transparent"></div>

        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>

        {/* Animated orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-600 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>

        {/* Subtle floating particles */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <Nav />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-6 md:px-8 lg:px-16 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 mr-3 backdrop-blur-md border border-cyan-500/10"
              >
                <Terminal className="w-7 h-7 text-cyan-400" />
              </motion.div>
              <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Algorythm
              </h2>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Elevate Your <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">Coding Skills</span> to New Heights
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Track your progress, compete with friends, and rise through the ranks in the most popular coding platforms around the world.
            </p>

            {!isLoggedIn ? (
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <motion.button
                  onClick={() => navigate('/user')}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center transform transition-all duration-300"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px -5px rgba(0, 220, 220, 0.4)",
                    textShadow: "0 0 5px rgba(255,255,255,0.5)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
                <motion.button
                  className="px-6 py-3 rounded-full border border-cyan-800/50 backdrop-blur-sm bg-neutral-900/50 text-white font-medium shadow-inner shadow-cyan-900/10 flex items-center justify-center transition-all duration-300"
                  whileHover={{
                    scale: 1.05,
                    borderColor: "rgba(8, 145, 178, 0.7)",
                    backgroundColor: "rgba(15, 23, 42, 0.8)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn More
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="p-4 rounded-xl bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-cyan-900/20 backdrop-blur-sm hover:border-cyan-700/30 transition-all duration-500"
              >
                <div className="flex items-center mb-2">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold mr-3 shadow-lg shadow-cyan-900/30">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg text-cyan-400 font-bold">{username}</p>
                    <p className="text-sm text-gray-400">{college}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="px-3 py-1.5 bg-neutral-800/80 rounded-full text-xs backdrop-blur-sm border border-neutral-700/30">
                    College Rank (CF): <span className="font-mono font-medium text-cyan-400">{collegeRank !== null ? collegeRank : 'N/A'}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-neutral-800/80 rounded-full text-xs backdrop-blur-sm border border-neutral-700/30">
                    Platform Rank: <span className="font-mono font-medium text-cyan-400">{platformRank !== null ? platformRank : 'N/A'}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-4 px-4 py-2 rounded-full bg-neutral-700/80 text-white text-sm font-medium hover:bg-neutral-600 transition-colors duration-300 border border-neutral-600/50"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative w-full h-[420px] overflow-hidden rounded-2xl border border-neutral-700/30 shadow-xl shadow-cyan-900/10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-sm z-10 rounded-2xl"></div>
              <div className="absolute inset-0 bg-[url('/code-pattern.svg')] opacity-5 z-0"></div>

              <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500 rounded-full opacity-20 blur-3xl z-0 animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-600 rounded-full opacity-20 blur-3xl z-0 animate-pulse" style={{ animationDelay: '1s' }}></div>

              <div className="absolute inset-0 flex items-center justify-center z-20">
                <motion.div
                  className="text-center px-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 flex items-center justify-center mx-auto mb-6 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
                  >
                    <Code className="w-8 h-8 text-cyan-400" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Compete. Learn. Grow.</h2>
                  <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
                    Join thousands of coders from around the world in challenging contests that push your skills to the limit.
                  </p>
                </motion.div>
              </div>

              <motion.div
                className="absolute -bottom-2 -right-5 bg-neutral-900/90 rounded-lg p-4 border border-cyan-900/50 shadow-xl w-80 z-30 backdrop-blur-sm overflow-x-auto"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                whileHover={{ y: -5, boxShadow: "0 15px 30px -10px rgba(8, 145, 178, 0.2)" }}
              >
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs text-gray-400 ml-auto">solution.cpp</span>
                </div>
                <pre className="text-xs text-cyan-400 font-mono whitespace-pre">
                  <code>
                    {`#include <bits/stdc++.h>
using namespace std;

int solve(vector<int>& nums) {
    sort(nums.begin(), nums.end());
    // Dynamic programming approach
    int n = nums.size();
    vector<int> dp(n, 1);

    // Brilliant solution
    return dp[n-1];
}`}
                  </code>
                </pre>
              </motion.div>

              <motion.div
                className="absolute top-10 left-10 bg-neutral-900/80 rounded-lg p-3 border border-blue-900/50 shadow-xl z-30 backdrop-blur-sm"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                whileHover={{ x: 5, boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.2)" }}
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-blue-400 mr-2" />
                  <span className="text-xs font-medium text-blue-300">
                    {upcomingContests[0] ? `Next contest in ${getTimeToContest(upcomingContests[0]?.startTime)}` : 'No contests scheduled'}
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Contests Section */}
      <section className="relative">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-zinc-950 to-transparent z-10"></div>
        <svg className="fill-zinc-800 fill-opacity-80 w-full h-24 transform -translate-y-1" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,60 C240,100 480,0 720,30 C960,60 1200,100 1440,70 L1440,100 L0,100 Z"></path>
        </svg>
        <div className="py-16 px-4 md:px-8 lg:px-16 bg-zinc-800/60 relative">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10"></div>

          <div className="max-w-7xl mx-auto relative">
            <motion.div
              className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 mr-3 border border-cyan-500/10 shadow-lg shadow-cyan-500/5">
                  <Calendar className="h-6 w-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-gray-300 bg-clip-text text-transparent">Upcoming Contests</h2>
              </div>
              <motion.button
                onClick={() => navigate('/past-contests')}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg flex items-center"
                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 220, 220, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                View Previous Contests
                <ChevronRight className="h-4 w-4 ml-2" />
              </motion.button>
            </motion.div>

            {contestsLoading ? (
              <motion.div
                className="text-gray-300 font-mono text-center p-8 bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-block w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                <p>Loading contests...</p>
              </motion.div>
            ) : contestsError ? (
              <motion.div
                className="text-red-500 font-mono text-center p-8 bg-red-900/20 backdrop-blur-sm rounded-xl border border-red-800/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
                <p>{contestsError}</p>
              </motion.div>
            ) : upcomingContests.length === 0 ? (
              <motion.div
                className="text-gray-400 font-mono text-center p-8 bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Calendar className="h-8 w-8 mx-auto mb-4 text-gray-500" />
                <p>No upcoming contests found.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {upcomingContests.map((contest, index) => (
                  <motion.div
                    key={contest.id}
                    className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 border border-neutral-700/50 hover:border-cyan-500/50 transition-all duration-300 relative overflow-hidden group"
                    whileHover={{
                      y: -5,
                      boxShadow: "0 15px 30px -15px rgba(8, 145, 178, 0.3)"
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-cyan-500/20 via-cyan-500/0 to-blue-600/20 blur-sm"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 duration-500 rounded-xl blur-md group-hover:animate-shimmer"></div>

                    <div className="relative">
                      <div className={`text-sm font-semibold mb-2 inline-flex items-center px-2.5 py-1 rounded-full ${contest.platform === "Codeforces" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        contest.platform === "LeetCode" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                          contest.platform === "CodeChef" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                            contest.platform === "AtCoder" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                              contest.platform === "GeeksforGeeks" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                                "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}>
                        {contest.platform}
                      </div>
                      <h3 className="text-lg font-bold mb-3 line-clamp-1 group-hover:text-cyan-300 transition-colors duration-200">{contest.name}</h3>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-300 flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {formatContestDate(contest.startTime)}
                        </div>
                        <div className="text-sm text-gray-300 font-mono flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {contest.duration}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs px-3 py-1.5 bg-neutral-800/80 backdrop-blur-sm rounded-full font-medium group-hover:bg-neutral-700/80 transition-colors duration-300 border border-neutral-700/50">
                          In {getTimeToContest(contest.startTime)}
                        </div>
                        <a
                          href={contest.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 text-sm flex items-center hover:text-cyan-300 transition-colors"
                        >
                          Register <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="relative">
        <svg className="fill-zinc-800 fill-opacity-80 w-full h-24 transform rotate-180" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,60 C240,100 480,0 720,30 C960,60 1200,100 1440,70 L1440,100 L0,100 Z"></path>
        </svg>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent"></div>
        <div className="py-16 px-4 md:px-8 lg:px-16 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-8">
              <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 mr-3 border border-cyan-500/10 shadow-lg shadow-cyan-500/5">
                <Trophy className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-gray-300 bg-clip-text text-transparent">
                {college || "College"} Leaderboard
              </h2>
            </div>

            {!isLoggedIn ? (
              <motion.div
                className="bg-neutral-800/70 border border-neutral-700/60 rounded-xl p-8 text-center relative backdrop-blur-sm"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 hover:opacity-100 duration-1000 rounded-xl blur-md animate-shimmer"></div>

                <Users className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
                <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Sign up to see detailed leaderboards</h3>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  Track your progress against competitors from your college and around the world.
                </p>
                <motion.button
                  onClick={() => navigate('/user')}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-cyan-900/20"
                  whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 220, 220, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Up
                </motion.button>
                <div className="mt-8 h-[30rem] md:h-[40rem] blur-sm opacity-50 pointer-events-none">
                  <Tabs tabs={leaderboardTabs} />
                </div>
              </motion.div>
            ) : leaderboardLoading ? (
              <motion.div
                className="text-gray-300 font-mono text-center p-12 bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 h-64 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div>
                  <div className="inline-block w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                  <p>Loading leaderboard...</p>
                </div>
              </motion.div>
            ) : leaderboardError ? (
              <motion.div
                className="text-red-500 font-mono text-center p-12 bg-red-900/20 backdrop-blur-sm rounded-xl border border-red-800/50 h-64 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div>
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>{leaderboardError}</p>
                </div>
              </motion.div>
            ) : (
              <div className="h-[30rem] md:h-[40rem] [perspective:1000px] relative flex flex-col w-full items-start justify-start">
                <Tabs tabs={leaderboardTabs} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 md:px-8 lg:px-16 bg-neutral-900/70 backdrop-blur-sm relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none"></div>
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>

        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="inline-block p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 mb-4 border border-cyan-500/10 shadow-lg shadow-cyan-500/5">
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-100 to-gray-300 bg-clip-text text-transparent">Why Choose Algorythm?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              We provide the tools you need to track your progress and improve your competitive programming skills.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="h-8 w-8 text-cyan-400" />,
                title: "Contest Tracking",
                description: "Never miss a coding contest again with our comprehensive contest calendar."
              },
              {
                icon: <Trophy className="h-8 w-8 text-cyan-400" />,
                title: "Global Leaderboards",
                description: "Compare your performance with competitors from around the world."
              },
              {
                icon: <Users className="h-8 w-8 text-cyan-400" />,
                title: "College Rankings",
                description: "See how you stack up against peers from your own institution."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-neutral-800/70 border border-neutral-700/50 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 10px 30px -15px rgba(0, 220, 220, 0.3)"
                }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 duration-1000 rounded-xl blur-md animate-shimmer"></div>

                <div className="p-3 bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 rounded-lg inline-block mb-4 shadow-inner shadow-cyan-900/10 border border-neutral-700/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What's More with Algorythm? Section */}
      <section className="py-16 px-4 md:px-8 lg:px-16 bg-zinc-800/60 relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10"></div>
        <div className="absolute -top-40 left-1/3 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl"></div>

        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="inline-block p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 mb-4 border border-cyan-500/10 shadow-lg shadow-cyan-500/5">
              <Sparkles className="h-6 w-6 text-cyan-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-100 to-gray-300 bg-clip-text text-transparent">What's More with Algorythm?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Explore a world of opportunities to enhance your coding journey with exclusive features and exciting upcoming additions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="h-8 w-8 text-cyan-400" />,
                title: "Past Contest Solutions",
                description: "Learn from detailed solutions and editorials of past contests."
              },
              {
                icon: <UserIcon className="h-8 w-8 text-cyan-400" />,
                title: "Explore User Profiles",
                description: "View profiles of fellow coders to track their progress."
              },
              {
                icon: <LinkIcon className="h-8 w-8 text-cyan-400" />,
                title: "Top CP Resources",
                description: "Access curated competitive programming resources."
              },
              {
                icon: <MessageCircle className="h-8 w-8 text-cyan-400" />,
                title: "One-to-One Mentorship",
                description: "Get personalized guidance from experienced coders."
              },
              {
                icon: <Swords className="h-8 w-8 text-cyan-400" />,
                title: "CP & DSA Battles",
                description: "Engage in competitive programming and DSA battles.",
                isComingSoon: true
              },
              {
                icon: <Type className="h-8 w-8 text-cyan-400" />,
                title: "Algorithm Typing Battles",
                description: "Compete in fast-coding algorithm contests.",
                isComingSoon: true
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-neutral-800/70 border border-neutral-700/50 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 10px 30px -15px rgba(0, 220, 220, 0.3)"
                }}
              >
                <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-cyan-500/20 via-cyan-500/0 to-blue-600/20 blur-sm"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 duration-500 rounded-xl blur-md group-hover:animate-shimmer"></div>

                {feature.isComingSoon && (
                  <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-500/20">
                    Coming Soon
                  </span>
                )}
                <div className="p-3 bg-gradient-to-br from-neutral-700/50 to-neutral-800/50 rounded-lg inline-block mb-4 shadow-inner shadow-cyan-900/10 border border-neutral-700/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats & Join Us Section */}
      <section className="py-16 px-4 md:px-8 lg:px-16 relative overflow-hidden">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-30 rounded-xl blur-md animate-pulse"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500 rounded-full opacity-10 blur-3xl"></div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="order-2 lg:order-1"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 mr-3 backdrop-blur-md border border-cyan-500/10">
                  <BarChart3 className="w-7 h-7 text-cyan-400" />
                </div>
                <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Join the Community
                </h2>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Become Part of a <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">Thriving Community</span> of Coders
              </h2>

              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Join thousands of passionate programmers who are improving their skills every day with Algorythm. Get access to exclusive contests, personalized analytics, and a supportive community.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                {[
                  { count: "10K+", label: "Active Users" },
                  { count: "500+", label: "Weekly Contests" },
                  { count: "50+", label: "Partner Colleges" }
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    className="bg-neutral-800/70 rounded-xl p-4 backdrop-blur-sm border border-neutral-700/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1">
                      {stat.count}
                    </h3>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {!isLoggedIn && (
                <motion.button
                  onClick={() => navigate('/user')}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center transform transition-all duration-300"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 10px 25px -5px rgba(0, 220, 220, 0.4)",
                    textShadow: "0 0 5px rgba(255,255,255,0.5)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Join Algorythm Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.button>
              )}
            </motion.div>

            <motion.div
              className="order-1 lg:order-2 relative perspective-[1800px]"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-2xl"></div>

              <div className="cards-container relative">
                <div className="text-center mb-8">
                  <h3 className="text-cyan-400 text-lg font-semibold mb-2 font-mono uppercase tracking-wider">Community Focus</h3>
                  <h2 className="text-3xl font-bold text-white mb-6">Popular Tracks</h2>
                </div>

                <div
                  ref={cardsRef}
                  className="cards-3d inline-block bg-neutral-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-neutral-700/50"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'rotateX(11deg) rotateY(16.5deg)',
                    transformOrigin: '50% 50%',
                    minWidth: '600px',
                  }}
                >
                  <div className="flex gap-6 justify-center">
                    {communityCards.map((card, index) => (
                      <div
                        key={index}
                        className="card-3d group relative w-48 h-64 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-105"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: 'translateZ(35px)',
                        }}
                      >
                        {/* Card Background */}
                        <div
                          ref={(el) => { backgroundsRef.current[index] = el; }}
                          className="card-bg absolute -inset-12 bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${card.bgImage})`,
                            transform: 'translateZ(-50px)',
                            transformOrigin: '50% 50%',
                          }}
                        ></div>

                        {/* Card Image/Icon */}
                        <div
                          ref={(el) => { imagesRef.current[index] = el; }}
                          className="card-img relative z-10 h-full flex items-center justify-center"
                        >
                          <div className={`p-6 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-2xl`}>
                            <card.icon className="w-16 h-16 text-white" />
                          </div>
                        </div>

                        {/* Card Text */}
                        <div className="card-text absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-neutral-900/90 via-neutral-900/70 to-transparent p-6">
                          <h4 className="text-white font-bold text-lg mb-1">{card.title}</h4>
                          <p className="text-gray-300 text-sm">{card.description}</p>
                        </div>

                        {/* Hover Glow Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl`}></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Hint */}
                <div className="text-center mt-6">
                  <span className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-sm font-mono">
                    Move your mouse for 3D interaction
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

// LeaderboardContent Component
const LeaderboardContent: React.FC<LeaderboardProps> = ({ users, platform, displayCount, setDisplayCount, loggedInUsername }) => {
  

  const getPlatformColor = (platform: string): string => {
    switch (platform) {
      case "Codeforces":
        return "from-red-500 to-red-700";
      case "LeetCode":
        return "from-yellow-500 to-yellow-700";
      case "CodeChef":
        return "from-blue-500 to-blue-700";
      default:
        return "from-cyan-500 to-blue-700";
    }
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 3000) return "text-red-500";
    if (rating >= 2600) return "text-orange-500";
    if (rating >= 2300) return "text-yellow-500";
    if (rating >= 2000) return "text-blue-500";
    if (rating >= 1600) return "text-cyan-500";
    if (rating >= 1200) return "text-green-500";
    return "text-gray-500";
  };

  const handleViewMore = () => {
    setDisplayCount((prev) => prev + 10);
  };

  const loggedInUser = users.find((user) => user.username === loggedInUsername);
  const displayedUsers = users.slice(0, displayCount);
  if (loggedInUser && !displayedUsers.some((user) => user.username === loggedInUsername)) {
    displayedUsers.push(loggedInUser);
  }

  const hasMoreUsers = displayCount < users.length;

  return (
    <div className="w-full overflow-hidden relative h-full rounded-2xl p-6 md:p-10 text-white bg-neutral-900 border border-neutral-800">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-neutral-800 to-transparent z-0"></div>
      <div className="relative z-10">
        <h3 className={`text-xl md:text-3xl font-bold mb-8 bg-gradient-to-r ${getPlatformColor(platform)} bg-clip-text text-transparent`}>
          {platform} Leaderboard
        </h3>

        <div className="overflow-auto max-h-[calc(100%-80px)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-700">
                <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-400">Rank</th>
                <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-400">Name</th>
                <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-400">Algorythm Username</th>
                <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-400">
                  {platform === "Platform Rating" ? "Coding Score" : `${platform} Username`}
                </th>
                <th className="py-3 px-2 md:px-4 text-left text-xs md:text-sm font-medium text-gray-400">
                  {platform === "Platform Rating" ? "" : "Rating"}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    No users found for this leaderboard.
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    className={`border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors duration-200 ${user.username === loggedInUsername ? 'bg-cyan-900/50 font-bold' : ''
                      }`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="py-3 px-2 md:px-4 text-sm md:text-base font-medium">
                      {user.rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${user.rank === 1 ? "bg-yellow-500/20 text-yellow-300" :
                          user.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                            "bg-amber-600/20 text-amber-400"
                          }`}>
                          {user.rank}
                        </span>
                      ) : (
                        <span>{user.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 md:px-4 text-sm md:text-base">
                      <a
                        href={`/profile/username/${user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline transition-colors duration-200"
                      >
                        {user.name}
                      </a>
                    </td>
                    <td className="py-3 px-2 md:px-4 text-sm md:text-base text-gray-300">
                      {user.username}
                    </td>
                    <td className="py-3 px-2 md:px-4 text-sm md:text-base text-gray-300">
                      {platform === "Platform Rating" ? user.rating : user.platformUsername || 'N/A'}
                    </td>
                    {platform !== "Platform Rating" && (
                      <td className={`py-3 px-2 md:px-4 text-sm md:text-base font-mono ${getRatingColor(user.rating)}`}>
                        {user.rating}
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
          {hasMoreUsers && (
            <div className="mt-4 text-center">
              <motion.button
                onClick={handleViewMore}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg"
                whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(0, 220, 220, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                View More
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;