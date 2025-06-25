import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  username: string;
  name: string;
  collegeName: string;
  codeforcesUsername: string;
  codechefUsername: string;
  leetcodeUsername: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  login: () => void; // Helper method to set logged in state
  clearAuth: () => void; // Complete auth reset
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      
      setUser: (user) => {
        // Also sync with localStorage for backup
        Object.entries(user).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value);
        });
        set({ isLoggedIn: true, user });
      },
      
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          // Sync with localStorage
          Object.entries(updates).forEach(([key, value]) => {
            if (value) localStorage.setItem(key, value);
          });
          set({ user: updatedUser });
        }
      },
      
      login: () => set({ isLoggedIn: true }),
      
      logout: () => {
        // Clear localStorage on logout
        const keysToRemove = [
          'username', 'name', 'collegeName', 
          'codeforcesUsername', 'codechefUsername', 'leetcodeUsername',
          'bookmarkedContests', 'solvedProblems'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        set({ isLoggedIn: false, user: null });
      },
      
      clearAuth: () => {
        // Complete reset including persisted data
        const keysToRemove = [
          'username', 'name', 'collegeName', 
          'codeforcesUsername', 'codechefUsername', 'leetcodeUsername',
          'bookmarkedContests', 'solvedProblems'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        set({ isLoggedIn: false, user: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Custom storage implementation for better handling
      partialize: (state) => ({ 
        isLoggedIn: state.isLoggedIn, 
        user: state.user 
      }),
      
      // Rehydrate from both Zustand persist and localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const username = localStorage.getItem('username');
          // If we have username in localStorage but not in Zustand, restore it
          if (username && !state.user) {
            const userData = {
              username,
              name: localStorage.getItem('name') || '',
              collegeName: localStorage.getItem('collegeName') || '',
              codeforcesUsername: localStorage.getItem('codeforcesUsername') || '',
              codechefUsername: localStorage.getItem('codechefUsername') || '',
              leetcodeUsername: localStorage.getItem('leetcodeUsername') || '',
            };
            state.user = userData;
            state.isLoggedIn = true;
          }
        }
      },
    }
  )
);

export default useAuthStore;