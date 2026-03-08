import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest, getQueryFn } from '@/lib/queryClient';

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour
const LOGIN_TIME_KEY = 'admin_login_at';

interface User {
  id: string;
  username: string;
  displayName?: string | null;
  email?: string | null;
  role?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [manualUser, setManualUser] = useState<User | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: userData, isPending, isFetching } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const user = userData ?? manualUser;
  const isLoading = isPending || isFetching;

  const doLogout = () => {
    sessionStorage.removeItem(LOGIN_TIME_KEY);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    setManualUser(null);
    queryClient.clear();
    apiRequest('POST', '/api/auth/logout').catch(() => {});
  };

  const scheduleAutoLogout = (loginAt: number) => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    const remaining = SESSION_DURATION_MS - (Date.now() - loginAt);
    if (remaining <= 0) {
      doLogout();
      return;
    }
    logoutTimerRef.current = setTimeout(() => {
      doLogout();
    }, remaining);
  };

  // On mount: check if session is still valid, schedule auto-logout if needed
  useEffect(() => {
    const stored = sessionStorage.getItem(LOGIN_TIME_KEY);
    if (stored) {
      const loginAt = parseInt(stored, 10);
      const elapsed = Date.now() - loginAt;
      if (elapsed >= SESSION_DURATION_MS) {
        doLogout();
      } else {
        scheduleAutoLogout(loginAt);
      }
    }
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, []);

  // When userData resolves to null (session expired server-side), clear local state
  useEffect(() => {
    if (!isPending && !isFetching && userData === null && manualUser !== null) {
      setManualUser(null);
      sessionStorage.removeItem(LOGIN_TIME_KEY);
    }
  }, [userData, isPending, isFetching]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return await response.json();
    },
    onSuccess: (data: User) => {
      const now = Date.now();
      sessionStorage.setItem(LOGIN_TIME_KEY, String(now));
      setManualUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      scheduleAutoLogout(now);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout');
      return await response.json();
    },
    onSuccess: () => {
      sessionStorage.removeItem(LOGIN_TIME_KEY);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      setManualUser(null);
      queryClient.clear();
    },
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync({ username, password });
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
