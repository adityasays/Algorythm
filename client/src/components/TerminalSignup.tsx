import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Code } from 'lucide-react';
import axios from 'axios';
import { COLLEGES } from './ui/collegeData';

interface TerminalLineProps {
  content: string;
  type: 'error' | 'success' | 'command' | 'input' | 'highlight' | 'warning' | 'system' | 'default';
  charByChar?: boolean;
  delay?: number;
}

const TerminalLine: React.FC<TerminalLineProps> = ({ content, type, charByChar, delay = 0 }) => {
  const [displayedContent, setDisplayedContent] = useState(charByChar ? '' : content);
  const [isComplete, setIsComplete] = useState(!charByChar);

  useEffect(() => {
    if (charByChar && content) {
      const timeout = setTimeout(() => {
        let index = 0;
        const interval = setInterval(() => {
          if (index < content.length) {
            setDisplayedContent(content.substring(0, index + 1));
            index++;
          } else {
            clearInterval(interval);
            setIsComplete(true);
          }
        }, 25);

        return () => clearInterval(interval);
      }, delay);
      
      return () => clearTimeout(timeout);
    }
  }, [content, charByChar, delay]);

  const getLineColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-500';
      case 'success':
        return 'text-green-400';
      case 'command':
        return 'text-blue-400';
      case 'input':
        return 'text-teal-300';
      case 'highlight':
        return 'text-yellow-300';
      case 'warning':
        return 'text-orange-400';
      case 'system':
        return 'text-gray-400';
      default:
        return 'text-gray-300';
    }
  };

  const prefix = () => {
    if (type === 'command') return <span className="text-green-500 mr-2">λ</span>;
    if (type === 'input') return <span className="text-blue-400 mr-2">→</span>;
    if (type === 'error') return <span className="text-red-500 mr-2">✗</span>;
    if (type === 'success') return <span className="text-green-500 mr-2">✓</span>;
    return null;
  };

  return (
    <div className={`${getLineColor()} break-words mb-1 flex`}>
      {prefix()}
      <span>{charByChar ? displayedContent : content}</span>
      {charByChar && !isComplete && (
        <span className="cursor-typeblink h-4 w-2 bg-gray-300 ml-0.5"></span>
      )}
    </div>
  );
};

interface InputCursorProps {
  visible: boolean;
}

const InputCursor: React.FC<InputCursorProps> = ({ visible }) => {
  return (
    <span 
      className={`cursor-typeblink h-5 w-2 bg-teal-300 opacity-70 inline-block align-middle ${visible ? '' : 'opacity-0'}`}
    ></span>
  );
};

interface TerminalLineData {
  content: string;
  type: TerminalLineProps['type'];
  charByChar?: boolean;
  delay?: number;
}

interface Step {
  id: string;
  prompt: string;
  validate?: (input: string) => string | null;
  sensitive?: boolean;
  isOptional?: boolean;
  suggestions?: string[];
  filterSuggestions?: (input: string) => string[];
}

interface SignupData {
  name: string;
  username: string;
  college: string;
  email: string;
  codeforces: string;
  codechef: string;
  leetcode: string;
  password: string;
  confirmPassword: string;
}

interface LoginData {
  usernameOrEmail: string;
  password: string;
}

interface ApiResponse {
  // Removed token from response since backend sends it in HTTP-only cookie
  user: {
    username: string;
    collegeName: string;
    name: string;
    email: string;
    codeforcesUsername: string;
    codechefUsername: string;
    leetcodeUsername: string;
    id: string;
    [key: string]: any;
  };
  message: string;
}

const TerminalAuth: React.FC = () => {
  const [terminalLines, setTerminalLines] = useState<TerminalLineData[]>([]);
  const [pendingLines, setPendingLines] = useState<TerminalLineData[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'initial' | 'login' | 'signup'>('initial');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [blinkCursor, setBlinkCursor] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(0);
  const [operationComplete, setOperationComplete] = useState<boolean>(false);
  const [terminalActive, setTerminalActive] = useState<boolean>(false);
  const [scanlineAnimation, setScanlineAnimation] = useState<boolean>(true);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  
  const [signupData, setSignupData] = useState<SignupData>({
    name: '',
    username: '',
    college: '',
    email: '',
    codeforces: '',
    codechef: '',
    leetcode: '',
    password: '',
    confirmPassword: '',
  });

  const [loginData, setLoginData] = useState<LoginData>({
    usernameOrEmail: '',
    password: '',
  });

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const loginSteps: Step[] = [
    {
      id: 'usernameOrEmail',
      prompt: 'Enter your email or Username:',
      validate: (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) ? null : 'Please enter a valid email address';
      },
    },
    {
      id: 'password',
      prompt: 'Enter your password:',
      validate: (input) => (input.trim().length > 0 ? null : 'Password is required'),
      sensitive: true,
    },
  ];

  const signupSteps: Step[] = [
    {
      id: 'name',
      prompt: 'Enter your full name:',
      validate: (input) =>
        input.trim().length > 2 ? null : 'Name must be at least 3 characters',
    },
    {
      id: 'username',
      prompt: 'Enter your username:',
      validate: (input) =>
        input.trim().length > 2 ? null : 'Username must be at least 3 characters',
    },
    {
      id: 'college',
      prompt: 'Enter your college name:',
      validate: (input) =>
        input.trim().length > 2 ? null : 'Please enter a valid college name',
      suggestions: COLLEGES,
      filterSuggestions: (input) =>
        COLLEGES.filter((college) =>
          college.toLowerCase().includes(input.toLowerCase())
        ).slice(0, 5),
    },
    {
      id: 'email',
      prompt: 'Enter your email address:',
      validate: (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) ? null : 'Please enter a valid email address';
      },
    },
    {
      id: 'codeforces',
      prompt: 'Enter your Codeforces username (optional):',
      isOptional: true,
    },
    {
      id: 'codechef',
      prompt: 'Enter your CodeChef username (optional):',
      isOptional: true,
    },
    {
      id: 'leetcode',
      prompt: 'Enter your LeetCode username (optional):',
      isOptional: true,
    },
    {
      id: 'password',
      prompt: 'Create a password (min 8 characters):',
      validate: (input) =>
        input.length >= 8 ? null : 'Password must be at least 8 characters',
      sensitive: true,
    },
    {
      id: 'confirmPassword',
      prompt: 'Confirm your password:',
      validate: (input) =>
        input === signupData.password ? null : 'Passwords do not match',
      sensitive: true,
    },
  ];

  // Initialize terminal with random noise effect
  useEffect(() => {
    setTimeout(() => {
      setTerminalActive(true);
      
      // Random noise lines for a more realistic boot sequence
      const noiseLines: TerminalLineData[] = [];
      const noiseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,./<>?';
      
      for (let i = 0; i < 3; i++) {
        let line = '';
        for (let j = 0; j < 50 + Math.floor(Math.random() * 30); j++) {
          line += noiseChars.charAt(Math.floor(Math.random() * noiseChars.length));
        }
        noiseLines.push({ content: line, type: 'system', delay: 50 });
      }
      
      // Boot sequence
      const bootSequence: TerminalLineData[] = [
        ...noiseLines,
        { content: 'System initialized...', type: 'system', delay: 200 },
        { content: 'Loading kernel modules...', type: 'system', delay: 150 },
        { content: 'Initializing Algorythm CLI v3.7...', type: 'system', delay: 250 },
        { content: 'Loading modules... [OK]', type: 'system', delay: 300 },
        { content: 'Checking system integrity... [OK]', type: 'system', delay: 200 },
        { content: 'Establishing secure connection... [OK]', type: 'success', delay: 400 },
        { content: 'Connection established!', type: 'success', delay: 200 },
        {
          content: 'Welcome to Algorythm - Competitive Programming Hub',
          type: 'highlight',
          charByChar: true,
          delay: 100,
        },
        { content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'system', delay: 150 },
        { content: 'Please select an authentication option:', type: 'system', delay: 200 },
        { content: '0. Create new account', type: 'highlight', delay: 150 },
        { content: '1. Login to existing account', type: 'highlight', delay: 150 },
        { content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'system', delay: 150 },
        { content: 'Enter your choice (0 or 1):', type: 'command', delay: 100 },
      ];

      setPendingLines(bootSequence);
    }, 800);
  }, []);

  // Handle cursor movement
  useEffect(() => {
    const handleInputChange = () => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart || currentInput.length);
      }
    };

    if (inputRef.current) {
      inputRef.current.addEventListener('click', handleInputChange);
      inputRef.current.addEventListener('keyup', handleInputChange);
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('click', handleInputChange);
        inputRef.current.removeEventListener('keyup', handleInputChange);
      }
    };
  }, [currentInput]);

  // Blinking cursor
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(blinkInterval);
  }, []);

  // Process pending lines
  useEffect(() => {
    if (pendingLines.length > 0 && !loading) {
      setLoading(true);

      const currentLine = pendingLines[0];
      const remainingLines = pendingLines.slice(1);
      const delay = currentLine.delay || 150;

      setTimeout(() => {
        setTerminalLines((prev) => [...prev, currentLine]);
        setPendingLines(remainingLines);
        setLoading(false);
      }, delay);
    }
  }, [pendingLines, loading]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }

    if (inputRef.current && terminalActive && !operationComplete) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [terminalLines, terminalActive, operationComplete]);

  useEffect(() => {
    if (mode === 'signup') {
      const currentStepData = signupSteps[currentStep];
      if (currentStepData?.filterSuggestions && currentInput) {
        const filtered = currentStepData.filterSuggestions(currentInput);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setActiveSuggestion(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [currentInput, currentStep, mode]);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        setScanlineAnimation(false);
        setTimeout(() => setScanlineAnimation(true), 50 + Math.random() * 200);
      }
    }, 5000);
    
    return () => clearInterval(glitchInterval);
  }, []);

  const addLines = (lines: TerminalLineData[]) => {
    setPendingLines((prev) => [...prev, ...lines]);
  };

  const getCurrentSteps = (): Step[] => {
    return mode === 'login' ? loginSteps : signupSteps;
  };

  // Redirect to home page after successful authentication
  const redirectToHome = () => {
    window.location.href = '/';
  };

  // Handle mode selection
  const handleModeSelection = (choice: string) => {
    if (choice === '1') {
      setMode('login');
      addLines([
        { content: choice, type: 'input' },
        { content: 'Initializing login sequence...', type: 'system', delay: 300 },
        { content: 'Please authenticate with your credentials:', type: 'system', delay: 300 },
        { content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'system', delay: 200 },
        { content: loginSteps[0].prompt, type: 'command' },
      ]);
      setCurrentStep(0);
    } else if (choice === '0') {
      setMode('signup');
      addLines([
        { content: choice, type: 'input' },
        { content: 'Initializing registration sequence...', type: 'system', delay: 300 },
        { content: 'Please follow the steps to create your account:', type: 'system', delay: 300 },
        { content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'system', delay: 200 },
        { content: signupSteps[0].prompt, type: 'command' },
      ]);
      setCurrentStep(0);
    } else {
      addLines([
        { content: choice, type: 'input' },
        {
          content: 'Error: Invalid choice. Please enter 0 for Signup or 1 for Login.',
          type: 'error',
          delay: 200
        },
        { content: 'Enter your choice (0 or 1):', type: 'command', delay: 300 },
      ]);
    }
  };

  const processLoginStep = async (input: string) => {
    const currentStepData = loginSteps[currentStep];

    addLines([
      {
        content: currentStepData.sensitive ? '•'.repeat(input.length) : input,
        type: 'input',
      },
    ]);

    if (currentStepData.validate) {
      const validationError = currentStepData.validate(input);
      if (validationError) {
        addLines([
          { content: `Error: ${validationError}`, type: 'error', delay: 200 },
          { content: loginSteps[currentStep].prompt, type: 'command', delay: 300 },
        ]);
        return;
      }
    }

    setLoginData((prev) => ({
      ...prev,
      [currentStepData.id]: input,
    }));

    if (currentStep === loginSteps.length - 1) {
      setLoading(true);
      addLines([
        { content: 'Authenticating...', type: 'system', delay: 300 },
        { content: 'Verifying credentials...', type: 'system', delay: 400 },
      ]);

      try {
        
        const response = await axios.post<ApiResponse>(`${import.meta.env.VITE_API_URL}/api/user/login`, {
          usernameOrEmail: loginData.usernameOrEmail,
          password: input,
        }, { withCredentials: true });

        const { user, message } = response.data; 
        addLines([
          { content: 'Establishing secure session... [●●●●●●●●●●●●]', type: 'system', delay: 500 },
          { content: 'Loading user profile... [████████████] 100%', type: 'system', delay: 500 },
          { content: 'Generating session token... [OK]', type: 'success', delay: 300 },
          {
            content: `Login successful! Welcome back, ${user.username}!`,
            type: 'success',
            charByChar: true,
            delay: 200
          },
          { content: 'Redirecting to dashboard...', type: 'system', delay: 800 },
          { content: 'Session authenticated. You can now access Algorythm.', type: 'success', delay: 500 },
        ]);
        setOperationComplete(true);
          localStorage.setItem('name', user.name);
        localStorage.setItem('username', user.username);
        localStorage.setItem('collegeName', user.collegeName);
                localStorage.setItem('codeforcesUsername', user.codeforcesUsername);
                localStorage.setItem('leetcodeUsername' , user.leetcodeUsername )
                 localStorage.setItem('codechefUsername' , user.codechefUsername )
           



        
        setTimeout(() => {
          addLines([
            { content: 'Opening dashboard...', type: 'highlight', delay: 1000 },
          ]);
          setTimeout(redirectToHome, 1500);
        }, 4000);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Authentication failed. Please try again.';
        addLines([
          { content: `Error: ${errorMessage}`, type: 'error', delay: 200 },
          { content: loginSteps[0].prompt, type: 'command', delay: 300 },
        ]);
        setCurrentStep(0);
        setLoginData({ usernameOrEmail: '', password: '' });
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
      addLines([{ content: loginSteps[currentStep + 1].prompt, type: 'command', delay: 300 }]);
    }

    setCurrentInput('');
    setCursorPosition(0);
  };

  // Process signup step
  const processSignupStep = async (input: string) => {
    const currentStepData = signupSteps[currentStep];
    let value = input.trim();

    addLines([
      {
        content: currentStepData.sensitive ? '•'.repeat(input.length) : input,
        type: 'input',
      },
    ]);

    if (currentStepData.validate) {
      const validationError = currentStepData.validate(value);
      if (validationError) {
        addLines([
          { content: `Error: ${validationError}`, type: 'error', delay: 200 },
          { content: signupSteps[currentStep].prompt, type: 'command', delay: 300 },
        ]);
        return;
      }
    }

    if (currentStepData.isOptional && !value) {
      value = '';
    }

    setSignupData((prev) => ({
      ...prev,
      [currentStepData.id]: value,
    }));

    if (currentStep === signupSteps.length - 1) {
      const updatedSignupData = {
        ...signupData,
        [currentStepData.id]: value,
      };
      
      const hasCodingPlatform = !!(
        updatedSignupData.codeforces ||
        updatedSignupData.codechef ||
        updatedSignupData.leetcode
      );
      
      if (!hasCodingPlatform) {
        addLines([
          {
            content:
              'Error: At least one coding platform username (Codeforces, CodeChef, or LeetCode) is required',
            type: 'error',
            delay: 200
          },
          { content: "Let's try again with your coding platform information:", type: 'system', delay: 300 },
        ]);

        const codeforceIndex = signupSteps.findIndex((step) => step.id === 'codeforces');
        setCurrentStep(codeforceIndex);

        addLines([{ content: signupSteps[codeforceIndex].prompt, type: 'command', delay: 300 }]);
      } else {
        setLoading(true);
        addLines([
          { content: 'Validating information...', type: 'system', delay: 300 },
          { content: 'Checking username availability... [OK]', type: 'system', delay: 400 },
          { content: 'Connecting to coding platforms... [●●●●●○○○○○]', type: 'system', delay: 500 },
        ]);

        try {
        
          const response = await axios.post<ApiResponse>(`${import.meta.env.VITE_API_URL}/api/user/register`, {
            name: updatedSignupData.name,
            username: updatedSignupData.username,
            collegeName: updatedSignupData.college,
            email: updatedSignupData.email,
            codeforcesUsername: updatedSignupData.codeforces,
            codechefUsername: updatedSignupData.codechef,
            leetcodeUsername: updatedSignupData.leetcode,
            password: updatedSignupData.password,
          }, { withCredentials: true });

          const { user, message } = response.data; 
          addLines([
            { content: 'Connecting to coding platforms... [●●●●●●●●●●] [OK]', type: 'success', delay: 500 },
            { content: 'Syncing profiles... [████████████] 100%', type: 'system', delay: 500 },
            { content: 'Creating secure account...', type: 'system', delay: 600 },
            { content: 'Setting up user profile... [OK]', type: 'success', delay: 500 },
            { content: 'Fetching coding history... [OK]', type: 'success', delay: 600 },
            {
              content: `Success! Account created for ${updatedSignupData.name}!`,
              type: 'success',
              charByChar: true,
              delay: 200
            },
            { content: 'Your Algorythm profile is now ready.', type: 'success', delay: 500 },
            { content: 'Redirecting to dashboard...', type: 'system', delay: 800 },
          ]);
          setOperationComplete(true);
           console.log(user)
           console.log(message)
           localStorage.setItem('name', user.name);
          localStorage.setItem('username', user.username);
          localStorage.setItem('collegeName', user.collegeName);
                    console.log(`User data stored. Username: ${user.username}, College: ${user.collegeName}`);

          // Removed manual cookie storage since backend sets HTTP-only token cookie
          // Optional: Store user data in state/context if needed for UI
          setTimeout(() => {
            addLines([
              { content: 'Opening dashboard...', type: 'highlight', delay: 1000 },
            ]);
            setTimeout(redirectToHome, 1500);
          }, 4500);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
          addLines([
            { content: `Error: ${errorMessage}`, type: 'error', delay: 200 },
            { content: signupSteps[0].prompt, type: 'command', delay: 300 },
          ]);
          setCurrentStep(0);
          setSignupData({
            name: '',
            username: '',
            college: '',
            email: '',
            codeforces: '',
            codechef: '',
            leetcode: '',
            password: '',
            confirmPassword: '',
          });
        } finally {
          setLoading(false);
        }
      }
    } else {
      setCurrentStep((prev) => prev + 1);
      addLines([{ content: signupSteps[currentStep + 1].prompt, type: 'command', delay: 300 }]);
    }

    setCurrentInput('');
    setCursorPosition(0);
  };

  // Handle submit
  const handleSubmit = () => {
    if (loading) return;

    const input = currentInput.trim();

    if (mode === 'initial') {
      handleModeSelection(input);
    } else if (mode === 'login') {
      processLoginStep(input);
    } else if (mode === 'signup') {
      processSignupStep(input);
    }
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (loading) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && activeSuggestion >= 0 && suggestions.length > activeSuggestion) {
        setCurrentInput(suggestions[activeSuggestion]);
        setShowSuggestions(false);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Tab' && showSuggestions) {
      e.preventDefault();
      if (suggestions.length > 0 && activeSuggestion >= 0 && suggestions.length > activeSuggestion) {
        setCurrentInput(suggestions[activeSuggestion]);
        setShowSuggestions(false);
      }
    } else if (e.key === 'ArrowUp') {
      if (showSuggestions) {
        e.preventDefault();
        setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'ArrowDown') {
      if (showSuggestions) {
        e.preventDefault();
        setActiveSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // Update cursor position on arrow navigation
      setTimeout(() => {
        if (inputRef.current) {
          setCursorPosition(inputRef.current.selectionStart || 0);
        }
      }, 0);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Check if input should be masked
  const shouldMaskInput = () => {
    const steps = getCurrentSteps();
    return steps[currentStep]?.sensitive || false;
  };
return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 py-12 px-4 overflow-hidden">
    {/* Terminal Container */}
    <div className={`w-full max-w-3xl transition-all duration-500 ${
      terminalActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
    }`}>
      {/* Terminal window */}
      <div className="bg-black bg-opacity-95 rounded-lg overflow-hidden shadow-2xl border border-gray-700 relative">
        {/* CRT scan effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-full h-full bg-gradient-to-b from-transparent to-blue-900 opacity-5"></div>
          <div
            className={`w-full h-full ${scanlineAnimation ? 'scanline-effect' : ''}`}
          ></div>
          <div className="absolute inset-0 glitch-overlay"></div>
          <div className="absolute inset-0 noise-overlay opacity-5"></div>
        </div>
        
        {/* Terminal header */}
        <div className="flex items-center px-4 py-2 bg-gray-900 border-b border-gray-800 relative z-10">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center text-sm font-mono text-gray-400">
            Algorythm CLI - Authentication Terminal
          </div>
          <div className="text-gray-500 text-xs">
            <span className="px-2 py-1 rounded bg-gray-800 flex items-center">
              <Code size={10} className="mr-1" /> root@algorythm:~
            </span>
          </div>
        </div>

        {/* Terminal content */}
        <div
          ref={terminalRef}
          className="h-96 overflow-y-auto p-4 font-mono text-sm text-gray-300 relative terminal-content"
        >
          {/* Terminal lines */}
          <div className="relative z-10">
            {terminalLines.map((line, index) => (
              <TerminalLine
                key={index}
                content={line.content}
                type={line.type}
                charByChar={line.charByChar}
              />
            ))}
          </div>

          {/* Current input line */}
          {!operationComplete && terminalActive && (
            <div className="flex items-center mt-1">
              <span className="text-blue-400 mr-2">→</span>
              <div ref={inputContainerRef} className="relative flex-1">
                <div className="relative inline-block w-full">
                  <input
                    ref={inputRef}
                    type={shouldMaskInput() && !showPassword ? 'password' : 'text'}
                    value={currentInput}
                    onChange={(e) => {
                      setCurrentInput(e.target.value);
                      setCursorPosition(e.target.selectionStart || e.target.value.length);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none outline-none text-teal-300 pr-8 caret-transparent"
                    autoFocus
                    disabled={loading || operationComplete}
                  />
                  
                  {/* This is the visible part with the cursor at the right position */}
                  {!shouldMaskInput() && !loading && (
                    <div className="absolute top-0 left-0 text-teal-300 whitespace-pre pointer-events-none">
                      {currentInput.substring(0, cursorPosition)}
                      {blinkCursor && <span className="cursor-typeblink inline-block h-5 w-2 bg-teal-300 opacity-70 align-middle"></span>}
                      {currentInput.substring(cursorPosition)}
                    </div>
                  )}
                </div>
                
                {shouldMaskInput() && (
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <span className="text-xs">●</span>
                    ) : (
                      <span className="text-xs">○</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <div className="absolute left-10 w-2/3 max-h-32 overflow-y-auto bg-gray-800 border border-gray-700 rounded shadow-lg z-20">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 text-sm cursor-pointer ${
                    index === activeSuggestion ? 'bg-blue-900 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    setCurrentInput(suggestion);
                    setShowSuggestions(false);
                    if (inputRef.current) inputRef.current.focus();
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terminal footer */}
        <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center justify-between relative z-10">
          <div className="text-xs text-gray-500 font-mono">
            {mode === 'initial'
              ? 'Waiting for selection...'
              : mode === 'login'
              ? `Login: Step ${currentStep + 1}/${loginSteps.length}`
              : `Signup: Step ${currentStep + 1}/${signupSteps.length}`}
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-gray-500 font-mono">Secure Connection</span>
          </div>
        </div>

        {/* Glare effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-transparent opacity-[0.02] pointer-events-none"></div>
      </div>
    </div>

    {/* CSS styles using standard React approach */}
    <style>
      {`
        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(4px);
          }
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          from, to {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        input::placeholder {
          color: rgba(94, 234, 212, 0.5);
        }

        .scanline-effect {
          background: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent 2px,
            rgba(255, 255, 255, 0.05) 2px,
            rgba(255, 255, 255, 0.05) 4px
          );
          animation: scanlines 4s linear infinite;
        }

        .glitch-overlay {
          background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVQIW2NkYGD4z8DAwMDAwMBAQAAA/gD8RgAAAABJRU5ErkJggg==');
          opacity: 0.02;
        }

        .noise-overlay {
          background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5AMHACs9qQf0QAAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAgUlEQVRYw+2Vuw3AIAwEeR/0/3/0TkyhKBACCFHSsQzLsmwAALBsA2y3gQMAgK0A2G4DAwCA7QD4bgMDAMD2AOy3AQAAANgB8N0GAAAAYA/AbhsAAAAA2APw3QYGAAAAYA/AdhsYAAAAgD0A323gAAAAAPYA/LaBAQAAANgD8N0GBgAAAFhB9xT7yW9nAAAAAElFTkSuQmCC');
          opacity: 0.05;
        }

        .cursor-typeblink {
          animation: blink 0.7s step-end infinite;
        }
      `}
    </style>
  </div>
);
};

export default TerminalAuth;