import React, { useState, useEffect } from 'react';
import { Book, Code, Award, Star, BookOpen, Users, ExternalLink, Search, Zap } from 'lucide-react';

// Type definitions for API response
interface UserData {
  username?: string;
  ratings?: {
    codeforces: number;
    codechef: number;
    leetcode: number;
  };
}

// Type definitions for problems and resources
interface Problem {
  id: string;
  name: string;
  platform: string;
  difficulty: string;
  link: string;
  topics: string[];
}

interface ResourceItem {
  name: string;
  description: string;
  link: string;
  tags: string[];
}

interface ResourceCategory {
  category: string;
  icon: React.ReactElement;
  items: ResourceItem[];
}

type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

const Resources: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [codeforcesRating, setCodeforcesRating] = useState<number>(0);
  const [leetcodeRating, setLeetcodeRating] = useState<number>(0);
  const [codechefRating, setCodechefRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [recommendedProblems, setRecommendedProblems] = useState<Problem[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel>('beginner');
  const [solvedProblems, setSolvedProblems] = useState<string[]>([]);

  // Get username from localStorage (same as ProfilePage.tsx)
  const getAuthStorage = (): string | undefined => {
    try {
      
      const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      
      const username = authStorage?.state?.user?.username;
    
      return username;
    } catch (e) {
      console.warn('⚠️ Error parsing auth storage:', e);
      return undefined;
    }
  };

  // Fetch user data and initialize component
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      

      // Get username
     const username = getAuthStorage();
      setUserName(username || null);

      if (!username) {
        
        setError('Please login to view personalized ratings and recommendations');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch user profile 
        const profileUrl = `${import.meta.env.VITE_API_URL}/api/profile/username/${username}`;
        
        const profileResponse = await fetch(profileUrl);
        
        console.log('📥 Profile Response Status Text:', profileResponse.statusText);

        if (!profileResponse.ok) {
          const errorText = await profileResponse.text();
          console.error(' Profile API Error Response:', errorText);
          throw new Error(`Failed to fetch user profile (${profileResponse.status}): ${errorText}`);
        }

        const profileData: UserData = await profileResponse.json();
        console.log('✅ Profile Data received:', profileData);

        // Set ratings
        const cfRating = profileData.ratings?.codeforces || 0;
        const lcRating = profileData.ratings?.leetcode || 0;
        const ccRating = profileData.ratings?.codechef || 0;
        setCodeforcesRating(cfRating);
        setLeetcodeRating(lcRating);
        setCodechefRating(ccRating);
        console.log('📊 Ratings set:', { cfRating, lcRating, ccRating });

      
        const storedSolved = JSON.parse(localStorage.getItem('solvedProblems') || '[]');
        setSolvedProblems(storedSolved);
        

        
        const level = determineUserLevel(cfRating, lcRating, ccRating);
        setUserLevel(level);
    

        // Generate recommended problems
        const problems = generateRecommendedProblems(level, storedSolved);
        setRecommendedProblems(problems);
      

        // Generate daily challenges
        const challenges = generateDailyChallenges(level);
        setDailyChallenges(challenges);
        console.log('✅ Daily challenges generated:', challenges.length);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('💥 Error fetching data:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        console.log('🏁 Loading state set to false');
      }
    };

    fetchUserData();
  }, []);

  // Save solved problems to localStorage
  useEffect(() => {
    if (solvedProblems.length > 0) {
      console.log('💾 Saving solved problems to localStorage:', solvedProblems);
      localStorage.setItem('solvedProblems', JSON.stringify(solvedProblems));
    }
  }, [solvedProblems]);

  // Determine user level based on ratings
  const determineUserLevel = (cf: number, lc: number, cc: number): UserLevel => {
    console.log('🔍 Determining user level:', { cf, lc, cc });
    const maxRating = Math.max(
      cf || 0,
      (lc || 0) * 0.8, // LeetCode rating tends to be higher
      (cc || 0) * 0.9  // CodeChef adjusted weight
    );

    if (maxRating > 1900) return 'expert';
    if (maxRating > 1500) return 'advanced';
    if (maxRating > 1200) return 'intermediate';
    return 'beginner';
  };

  // Generate recommended problems based on user level
  const generateRecommendedProblems = (level: UserLevel, solved: string[]): Problem[] => {
    console.log('🎲 Generating recommended problems for level:', level);
    const problemsDatabase: Record<UserLevel, Problem[]> = {
      beginner: [
        { id: 'lc-1', name: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', link: 'https://leetcode.com/problems/two-sum/', topics: ['Arrays', 'Hash Table'] },
        { id: 'cf-4a', name: 'Watermelon', platform: 'Codeforces', difficulty: '800', link: 'https://codeforces.com/problemset/problem/4/A', topics: ['Math', 'Implementation'] },
        { id: 'cf-1a', name: 'Theatre Square', platform: 'Codeforces', difficulty: '1000', link: 'https://codeforces.com/problemset/problem/1/A', topics: ['Math'] },
        { id: 'lc-20', name: 'Valid Parentheses', platform: 'LeetCode', difficulty: 'Easy', link: 'https://leetcode.com/problems/valid-parentheses/', topics: ['Stack', 'String'] },
        { id: 'cc-flow001', name: 'Flow001', platform: 'CodeChef', difficulty: 'School', link: 'https://www.codechef.com/problems/FLOW001', topics: ['Basic Programming'] },
        { id: 'lc-21', name: 'Merge Two Sorted Lists', platform: 'LeetCode', difficulty: 'Easy', link: 'https://leetcode.com/problems/merge-two-sorted-lists/', topics: ['Linked List'] },
      ],
      intermediate: [
        { id: 'lc-146', name: 'LRU Cache', platform: 'LeetCode', difficulty: 'Medium', link: 'https://leetcode.com/problems/lru-cache/', topics: ['Hash Table', 'Linked List', 'Design'] },
        { id: 'cf-1352c', name: 'K-th Not Divisible by n', platform: 'Codeforces', difficulty: '1500', link: 'https://codeforces.com/problemset/problem/1352/C', topics: ['Math', 'Binary Search'] },
        { id: 'lc-56', name: 'Merge Intervals', platform: 'LeetCode', difficulty: 'Medium', link: 'https://leetcode.com/problems/merge-intervals/', topics: ['Array', 'Sorting'] },
        { id: 'cc-chefsum', name: 'Chef and Sum', platform: 'CodeChef', difficulty: 'Easy', link: 'https://www.codechef.com/problems/CHEFSUM', topics: ['Arrays', 'Prefix Sum'] },
        { id: 'lc-200', name: 'Number of Islands', platform: 'LeetCode', difficulty: 'Medium', link: 'https://leetcode.com/problems/number-of-islands/', topics: ['DFS', 'BFS', 'Union Find'] },
        { id: 'cf-550a', name: 'Two Substrings', platform: 'Codeforces', difficulty: '1500', link: 'https://codeforces.com/problemset/problem/550/A', topics: ['Strings', 'Implementation'] },
      ],
      advanced: [
        { id: 'lc-295', name: 'Find Median from Data Stream', platform: 'LeetCode', difficulty: 'Hard', link: 'https://leetcode.com/problems/find-median-from-data-stream/', topics: ['Heap', 'Design'] },
        { id: 'cf-1091d', name: 'New Year and the Permutation Concatenation', platform: 'Codeforces', difficulty: '1700', link: 'https://codeforces.com/problemset/problem/1091/D', topics: ['Combinatorics', 'Math'] },
        { id: 'lc-315', name: 'Count of Smaller Numbers After Self', platform: 'LeetCode', difficulty: 'Hard', link: 'https://leetcode.com/problems/count-of-smaller-numbers-after-self/', topics: ['Binary Search', 'Divide and Conquer'] },
        { id: 'cc-dpairs', name: 'Distinct Pairs', platform: 'CodeChef', difficulty: 'Medium', link: 'https://www.codechef.com/problems/DPAIRS', topics: ['Two Pointers', 'Sorting'] },
        { id: 'lc-76', name: 'Minimum Window Substring', platform: 'LeetCode', difficulty: 'Hard', link: 'https://leetcode.com/problems/minimum-window-substring/', topics: ['Sliding Window', 'Hash Table'] },
        { id: 'cf-1320b', name: 'Navigation System', platform: 'Codeforces', difficulty: '1700', link: 'https://codeforces.com/problemset/problem/1320/B', topics: ['Graphs', 'Shortest Paths'] },
      ],
      expert: [
        { id: 'lc-4', name: 'Median of Two Sorted Arrays', platform: 'LeetCode', difficulty: 'Hard', link: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', topics: ['Array', 'Binary Search', 'Divide and Conquer'] },
        { id: 'cf-1092f', name: 'Tree with Maximum Cost', platform: 'Codeforces', difficulty: '2200', link: 'https://codeforces.com/problemset/problem/1092/F', topics: ['DFS', 'DP on Trees'] },
        { id: 'lc-297', name: 'Serialize and Deserialize Binary Tree', platform: 'LeetCode', difficulty: 'Hard', link: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/', topics: ['Tree', 'DFS', 'Design'] },
        { id: 'cc-chgoram2', name: 'Chef and Gordon Ramsay 2', platform: 'CodeChef', difficulty: 'Hard', link: 'https://www.codechef.com/problems/CHGORAM2', topics: ['Graph Theory', 'Combinatorics'] },
        { id: 'lc-460', name: 'LFU Cache', platform: 'LeetCode', difficulty: 'Hard', link: 'https://leetcode.com/problems/lfu-cache/', topics: ['Design', 'Hash Table', 'Linked List'] },
        { id: 'cf-1299c', name: 'Water Balance', platform: 'Codeforces', difficulty: '2100', link: 'https://codeforces.com/problemset/problem/1299/C', topics: ['Greedy', 'Data Structures'] },
      ],
    };

    const availableProblems = problemsDatabase[level].filter(
      (problem) => !solved.includes(problem.id)
    );
    console.log('📋 Available problems:', availableProblems.length);

    if (availableProblems.length > 6) {
      return availableProblems
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);
    }
    return availableProblems;
  };

  // Generate daily challenges based on user level
  const generateDailyChallenges = (level: UserLevel): Problem[] => {
    
    const date = new Date();
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

    const dailyPools: Record<UserLevel, Problem[]> = {
      beginner: [
        { id: 'daily-lc1', name: 'Maximum Subarray', platform: 'LeetCode', difficulty: 'Easy', link: 'https://leetcode.com/problems/maximum-subarray/', topics: ['Array', 'Divide and Conquer'] },
        { id: 'daily-cf1', name: 'String Task', platform: 'Codeforces', difficulty: '1000', link: 'https://codeforces.com/problemset/problem/118/A', topics: ['String', 'Implementation'] },
        { id: 'daily-cc1', name: 'Chef and Division 3', platform: 'CodeChef', difficulty: 'Easy', link: 'https://www.codechef.com/problems/DIVTHREE', topics: ['Math', 'Implementation'] },
      ],
      intermediate: [
        { id: 'daily-lc2', name: 'Jump Game', platform: 'LeetCode', difficulty: 'Medium', link: 'https://leetcode.com/problems/jump-game/', topics: ['Array', 'Greedy'] },
        { id: 'daily-cf2', name: 'Divisibility Problem', platform: 'Codeforces', difficulty: '1300', link: 'https://codeforces.com/problemset/problem/1328/A', topics: ['Math', 'Implementation'] },
        { id: 'daily-cc2', name: 'Starters 30', platform: 'CodeChef', difficulty: 'Medium', link: 'https://www.codechef.com/START30', topics: ['Implementation', 'Math'] },
      ],
      advanced: [
        { id: 'daily-lc3', name: 'Word Break', platform: 'LeetCode', difficulty: 'Medium', link: 'https://leetcode.com/problems/word-break/', topics: ['DP', 'Trie'] },
        { id: 'daily-cf3', name: 'Maximum Sum on Even Positions', platform: 'Codeforces', difficulty: '1600', link: 'https://codeforces.com/problemset/problem/1373/D', topics: ['Divide and Conquer', 'DP'] },
        { id: 'daily-cc3', name: 'Good Grid', platform: 'CodeChef', difficulty: 'Medium', link: 'https://www.codechef.com/problems/GOODGRID', topics: ['Math', 'Number Theory'] },
      ],
      expert: [
        { id: 'daily-lc4', name: 'Trapping Rain Water', platform: 'LeetCode', difficulty: 'Hard', link: 'https://leetcode.com/problems/trapping-rain-water/', topics: ['Stack', 'Two Pointers', 'Dynamic Programming'] },
        { id: 'daily-cf4', name: 'Omkar and Landslide', platform: 'Codeforces', difficulty: '2100', link: 'https://codeforces.com/problemset/problem/1392/F', topics: ['Math', 'Greedy'] },
        { id: 'daily-cc4', name: 'Chef and Ridges', platform: 'CodeChef', difficulty: 'Hard', link: 'https://www.codechef.com/problems/PRDTPAIN', topics: ['DP', 'Math'] },
      ],
    };

    const pseudoRandom = (max: number): number => {
      return Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * max);
    };

    const selectedProblems = [dailyPools[level][pseudoRandom(dailyPools[level].length)]];
    
    return selectedProblems;
  };

  // Mark a problem as solved and update ratings
  const markAsSolved = (problemId: string, platform: string): void => {
  
    const updatedSolved = [...solvedProblems, problemId];
    setSolvedProblems(updatedSolved);

    // Update ratings based on platform
    switch (platform.toLowerCase()) {
      case 'leetcode':
        setLeetcodeRating((prev) => prev + 10);
        console.log('📈 Updated LeetCode rating:', leetcodeRating + 10);
        break;
      case 'codeforces':
        setCodeforcesRating((prev) => prev + 10);
        console.log('📈 Updated Codeforces rating:', codeforcesRating + 10);
        break;
      case 'codechef':
        setCodechefRating((prev) => prev + 10);
        console.log('📈 Updated CodeChef rating:', codechefRating + 10);
        break;
    }

    // Update user level
    const newLevel = determineUserLevel(
      codeforcesRating + (platform.toLowerCase() === 'codeforces' ? 10 : 0),
      leetcodeRating + (platform.toLowerCase() === 'leetcode' ? 10 : 0),
      codechefRating + (platform.toLowerCase() === 'codechef' ? 10 : 0)
    );
    setUserLevel(newLevel);
    

    // Refresh recommendations
    const updatedRecommended = recommendedProblems.filter((p) => p.id !== problemId);
    if (updatedRecommended.length < 3) {
      const newProblems = generateRecommendedProblems(newLevel, updatedSolved);
      setRecommendedProblems(newProblems);
    } else {
      setRecommendedProblems(updatedRecommended);
    }
  };

  // Refresh problem recommendations
  const refreshProblems = (): void => {
    
    const newProblems = generateRecommendedProblems(userLevel, solvedProblems);
    setRecommendedProblems(newProblems);
  };

  // Refresh ratings from backend
  const refreshRatings = async (): Promise<void> => {
    if (!userName) {
      setError('Please login to refresh ratings');
      return;
    }

    
    setIsLoading(true);
    try {
      const profileUrl = `${import.meta.env.VITE_API_URL}/api/profile/username/${userName}`;
    
      const profileResponse = await fetch(profileUrl);
      

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('❌ Profile API Error Response:', errorText);
        throw new Error(`Failed to fetch user profile (${profileResponse.status}): ${errorText}`);
      }

      const profileData: UserData = await profileResponse.json();
    

      const cfRating = profileData.ratings?.codeforces || 0;
      const lcRating = profileData.ratings?.leetcode || 0;
      const ccRating = profileData.ratings?.codechef || 0;
      setCodeforcesRating(cfRating);
      setLeetcodeRating(lcRating);
      setCodechefRating(ccRating);
      

      const newLevel = determineUserLevel(cfRating, lcRating, ccRating);
      setUserLevel(newLevel);
    

      const newProblems = generateRecommendedProblems(newLevel, solvedProblems);
      setRecommendedProblems(newProblems);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('💥 Error refreshing ratings:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      
    }
  };

  // Resource categories
  const resources: ResourceCategory[] = [
    {
      category: 'Problem Sets & Platforms',
      icon: <Code size={24} />,
      items: [
        { name: 'CSES Problem Set', description: 'Collection of algorithmic programming problems', link: 'https://cses.fi/problemset/', tags: ['algorithms', 'datastructures'] },
        { name: 'USACO Guide', description: 'Comprehensive guide for competitive programming', link: 'https://usaco.guide/', tags: ['algorithms', 'contest', 'guide'] },
        { name: 'AtCoder', description: 'Japanese competitive programming platform', link: 'https://atcoder.jp/', tags: ['contest', 'platform'] },
        { name: 'TLE Eliminators Sheet', description: 'Curated problems to overcome TLE issues', link: 'https://github.com/the-hyp0cr1t3/CC/tree/master', tags: ['optimization', 'advanced'] },
      ],
    },
    {
      category: 'Learning Resources',
      icon: <BookOpen size={24} />,
      items: [
        { name: 'AlgoZenith', description: 'Full stack algorithmic platform for deep learning', link: 'https://algozenith.com/', tags: ['algorithms', 'advanced', 'comprehensive'] },
        { name: 'Striver Sheet', description: 'SDE Sheet - A complete guide for SDE preparation', link: 'https://takeuforward.org/interviews/strivers-sde-sheet-top-coding-interview-problems/', tags: ['interview', 'datastructures'] },
        { name: 'Errichto YT Channel', description: 'Detailed explanations of competitive programming problems', link: 'https://www.youtube.com/c/Errichto', tags: ['video', 'tutorial'] },
        { name: 'NeetCode', description: 'Organized solutions to LeetCode problems', link: 'https://neetcode.io/', tags: ['leetcode', 'solutions', 'patterns'] },
      ],
    },
    {
      category: 'Books & References',
      icon: <Book size={24} />,
      items: [
        { name: 'Competitive Programming Handbook', description: 'By Antti Laaksonen - Comprehensive guide to CP algorithms', link: 'https://cses.fi/book/book.pdf', tags: ['book', 'algorithms'] },
        { name: 'Introduction to Algorithms (CLRS)', description: 'The classic textbook on algorithms', link: 'https://mitpress.mit.edu/books/introduction-algorithms-third-edition', tags: ['book', 'fundamentals'] },
        { name: 'Algorithms Unlocked', description: 'By Thomas H. Cormen - A gentle intro to algorithms', link: 'https://mitpress.mit.edu/books/algorithms-unlocked', tags: ['book', 'beginner'] },
        { name: 'Competitive Programmer\'s Handbook', description: 'By Antti Laaksonen - Popular CP reference', link: 'https://cses.fi/book/book.pdf', tags: ['book', 'advanced'] },
      ],
    },
    {
      category: 'Specialized Training',
      icon: <Award size={24} />,
      items: [
        { name: 'CP Algorithms', description: 'Collection of algorithms and data structures for CP', link: 'https://cp-algorithms.com/', tags: ['algorithms', 'reference'] },
        { name: 'KACTL', description: 'KTH Algorithm Competition Template Library', link: 'https://github.com/kth-competitive-programming/kactl', tags: ['templates', 'library', 'advanced'] },
        { name: 'OI Wiki', description: 'Chinese OI Wiki with comprehensive algorithms', link: 'https://oi-wiki.org/', tags: ['algorithms', 'wiki', 'reference'] },
        { name: 'E-Maxx Algorithms', description: 'Collection of algorithms for competitive programming', link: 'https://cp-algorithms.com/', tags: ['algorithms', 'reference'] },
      ],
    },
    {
      category: 'Community Resources',
      icon: <Users size={24} />,
      items: [
        { name: 'CodeForces Blog', description: 'Tutorials and articles by top competitive programmers', link: 'https://codeforces.com/blog/entry/13529', tags: ['blog', 'community'] },
        { name: 'Algorithms Weekly', description: 'Petr Mitrichev\'s blog on algorithms', link: 'https://petr-mitrichev.blogspot.com/', tags: ['blog', 'advanced'] },
        { name: 'SecondThread YT', description: 'Competitive programming walkthrough videos', link: 'https://www.youtube.com/channel/UCXbCohpE9IoVQUD2Ifg1d1g', tags: ['video', 'tutorial'] },
        { name: 'Algorithms Live!', description: 'Live streams about algorithms and competitive programming', link: 'https://www.youtube.com/channel/UCBLr7ISa_YDy5qeATupf26w', tags: ['video', 'live', 'advanced'] },
      ],
    },
    {
      category: 'Contest Preparation',
      icon: <Star size={24} />,
      items: [
        { name: 'Vjudge', description: 'Virtual contest system with problems from multiple platforms', link: 'https://vjudge.net/', tags: ['practice', 'contest'] },
        { name: 'A2 Online Judge', description: 'Collection of problems by categories and difficulty', link: 'https://a2oj.com/', tags: ['practice', 'categories'] },
        { name: 'CodeDrills', description: 'Platform for targeted practice', link: 'https://codedrills.io/', tags: ['practice', 'targeted'] },
        { name: 'LeetCode Contest', description: 'Weekly and biweekly coding contests', link: 'https://leetcode.com/contest/', tags: ['contest', 'weekly'] },
      ],
    },
    {
      category: 'Advanced Topics',
      icon: <BookOpen size={24} />,
      items: [
        { name: 'Dynamic Programming Patterns', description: 'Collection of common DP patterns and problems', link: 'https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns', tags: ['dp', 'patterns'] },
        { name: 'String Algorithms', description: 'Comprehensive guide to string algorithms', link: 'https://cp-algorithms.com/string/prefix-function.html', tags: ['strings', 'advanced'] },
        { name: 'TopCoder Tutorials', description: 'Classic algorithms tutorials', link: 'https://www.topcoder.com/community/competitive-programming/tutorials/', tags: ['tutorial', 'classic'] },
        { name: 'Graph Algorithms', description: 'Overview of graph algorithms for competitive programming', link: 'https://cp-algorithms.com/graph/breadth-first-search.html', tags: ['graphs', 'advanced'] },
      ],
    },
  ];

  // Filter resources based on search and category
  const filteredResources = resources.filter((category) => {
    if (activeFilter !== 'all' && activeFilter !== category.category.toLowerCase()) {
      return false;
    }
    if (!searchQuery) return true;
    return category.items.some(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Get difficulty color based on difficulty string
  const getDifficultyColor = (difficulty: string): string => {
    if (difficulty === 'Easy' || (parseInt(difficulty, 10) < 1200 && !isNaN(parseInt(difficulty, 10)))) {
      return 'bg-green-900/40 text-green-400';
    } else if (difficulty === 'Medium' || (parseInt(difficulty, 10) < 1900 && !isNaN(parseInt(difficulty, 10)))) {
      return 'bg-yellow-900/40 text-yellow-400';
    } else {
      return 'bg-red-900/40 text-red-400';
    }
  };

  // Debug state


  if (isLoading) {
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
  
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-200 mb-2">Error Loading Resources</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              console.log('🔄 Retry button clicked');
              window.location.reload();
            }}
            className="px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-gray-900 to-black py-16 px-6 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Competitive Programming Resources
          </h1>
          <p className="mt-4 text-xl text-gray-300 max-w-2xl">
            Discover curated materials for mastering algorithms and data structures, from beginner guides to advanced techniques.
          </p>

          {/* User Stats */}
          {(codeforcesRating > 0 || leetcodeRating > 0 || codechefRating > 0) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
              {codeforcesRating > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                  <h3 className="font-medium text-gray-300">Codeforces Rating</h3>
                  <p className="text-2xl font-bold text-purple-400">{codeforcesRating}</p>
                </div>
              )}
              {leetcodeRating > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                  <h3 className="font-medium text-gray-300">LeetCode Rating</h3>
                  <p className="text-2xl font-bold text-pink-400">{leetcodeRating}</p>
                </div>
              )}
              {codechefRating > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                  <h3 className="font-medium text-gray-300">CodeChef Rating</h3>
                  <p className="text-2xl font-bold text-orange-400">{codechefRating}</p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => {
              
              refreshRatings();
            }}
            className="mt-4 px-6 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <Zap size={16} />
            Refresh Ratings
          </button>
        </div>
      </div>

      {/* Recommended Problems */}
      {recommendedProblems.length > 0 && (
        <div className="py-8 px-6 md:px-10 lg:px-16 bg-gradient-to-r from-purple-900/10 to-pink-900/10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center text-purple-300">
                <Star className="mr-2" size={20} />
                Recommended Problems For You ({userLevel})
              </h2>
              <button
                onClick={refreshProblems}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="bg-gray-800/70 p-5 rounded-lg border border-gray-700 hover:border-purple-500 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold group-hover:text-purple-400 transition-colors">{problem.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{problem.platform}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {problem.topics.map((topic, topicIndex) => (
                      <span key={topicIndex} className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-gray-500 hover:text-purple-400 transition-colors"
                    >
                      <ExternalLink size={12} className="mr-1" />
                      Solve Problem
                    </a>
                    <button
                      onClick={() => markAsSolved(problem.id, problem.platform)}
                      className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      Mark Solved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Challenges */}
      {dailyChallenges.length > 0 && (
        <div className="py-8 px-6 md:px-10 lg:px-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold flex items-center text-purple-300 mb-6">
              <Star className="mr-2" size={20} />
              Daily Challenge
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-gray-800/70 p-5 rounded-lg border border-gray-700 hover:border-purple-500 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold group-hover:text-purple-400 transition-colors">{challenge.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{challenge.platform}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {challenge.topics.map((topic, topicIndex) => (
                      <span key={topicIndex} className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <a
                      href={challenge.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-gray-500 hover:text-purple-400 transition-colors"
                    >
                      <ExternalLink size={12} className="mr-1" />
                      Solve Challenge
                    </a>
                    <button
                      onClick={() => markAsSolved(challenge.id, challenge.platform)}
                      className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                    >
                      Mark Solved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="sticky top-0 z-10 bg-gray-900 py-4 px-6 md:px-10 lg:px-16 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex overflow-x-auto gap-2 pb-1 md:pb-0 no-scrollbar">
            <button
              onClick={() => {
                console.log('🔍 Setting filter: all');
                setActiveFilter('all');
              }}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'all' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              All Resources
            </button>
            {resources.map((category, idx) => (
              <button
                key={idx}
                onClick={() => {
                  console.log(`🔍 Setting filter: ${category.category.toLowerCase()}`);
                  setActiveFilter(category.category.toLowerCase());
                }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeFilter === category.category.toLowerCase() ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8 px-6 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {filteredResources.length > 0 ? (
            <div className="space-y-12">
              {filteredResources.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <span className="mr-3 text-purple-400">{category.icon}</span>
                    {category.category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.items.map((item, itemIndex) => (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={itemIndex}
                        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-5 hover:border-purple-500 transition-all group"
                      >
                        <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">{item.name}</h3>
                        <p className="mt-2 text-gray-400 text-sm">{item.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                          <ExternalLink size={14} className="mr-2 group-hover:text-purple-400 transition-colors" />
                          <span className="group-hover:text-purple-400 transition-colors">Visit Resource</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Book size={48} className="text-gray-700 mb-4" />
              <h3 className="text-xl font-medium text-gray-500">No resources found</h3>
              <p className="text-gray-600 mt-2">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  console.log('🔄 Clearing filters');
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 mt-8 py-8 px-6 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Curated competitive programming resources for every skill level.</p>
          <p className="mt-2">From the most popular to hidden gems, discover the tools to enhance your CP journey.</p>
        </div>
      </div>
    </div>
  );
};

export default Resources;