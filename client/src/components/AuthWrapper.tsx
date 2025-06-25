import React, { useEffect } from 'react';
import TerminalAuth from './TerminalSignup';
import useAuthStore from '../store/authStore'; // Adjust path as needed

const AuthWrapper: React.FC = () => {
  const { setUser } = useAuthStore();

  const syncAuthState = () => {
    const username = localStorage.getItem('username');
    if (username) {
      const user = {
        username,
        name: localStorage.getItem('name') || '',
        collegeName: localStorage.getItem('collegeName') || '',
        codeforcesUsername: localStorage.getItem('codeforcesUsername') || '',
        codechefUsername: localStorage.getItem('codechefUsername') || '',
        leetcodeUsername: localStorage.getItem('leetcodeUsername') || '',
      };
      setUser(user);
    }
  };

  useEffect(() => {
    // Initial sync on mount
    syncAuthState();

    // Poll localStorage for changes (temporary, stops after login)
    const pollInterval = setInterval(() => {
      const username = localStorage.getItem('username');
      if (username) {
        syncAuthState();
        clearInterval(pollInterval); // Stop polling once user is detected
      }
    }, 100);

    // Clean up polling after 10 seconds or on unmount
    const timeout = setTimeout(() => clearInterval(pollInterval), 10000);

    // Listen for storage events (for cross-tab sync)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'username' && event.newValue) {
        syncAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [setUser]);

  return <TerminalAuth />;
};

export default AuthWrapper;