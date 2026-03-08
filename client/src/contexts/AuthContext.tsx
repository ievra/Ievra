import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const SESSION_MS = 60 * 60 * 1000;       // 1 hour
const WARN_BEFORE_MS = 5 * 60 * 1000;    // warn 5 min before expiry
const ACTIVITY_THROTTLE_MS = 60 * 1000;  // throttle activity pings to 1/min
const LOGIN_AT_KEY = 'admin_login_at';
const LOGOUT_REASON_KEY = 'admin_logout_reason';

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
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [manualUser, setManualUser] = useState<User | null>(null);
  const { toast } = useToast();

  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPingRef = useRef<number>(0);
  const warnToastIdRef = useRef<string | null>(null);

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

  const clearTimers = () => {
    if (warnTimerRef.current) { clearTimeout(warnTimerRef.current); warnTimerRef.current = null; }
    if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }
  };

  const pingServer = () => {
    const now = Date.now();
    if (now - lastPingRef.current < ACTIVITY_THROTTLE_MS) return;
    lastPingRef.current = now;
    apiRequest('GET', '/api/auth/me').catch(() => {});
  };

  const doAutoLogout = () => {
    clearTimers();
    sessionStorage.removeItem(LOGIN_AT_KEY);
    sessionStorage.setItem(LOGOUT_REASON_KEY, 'timeout');
    setManualUser(null);
    queryClient.clear();
    apiRequest('POST', '/api/auth/logout').catch(() => {});
  };

  const scheduleTimers = (loginAt: number) => {
    clearTimers();
    const elapsed = Date.now() - loginAt;
    const warnIn = SESSION_MS - WARN_BEFORE_MS - elapsed;
    const logoutIn = SESSION_MS - elapsed;

    if (logoutIn <= 0) { doAutoLogout(); return; }

    if (warnIn > 0) {
      warnTimerRef.current = setTimeout(() => {
        const { id } = toast({
          title: 'Phiên làm việc sắp hết hạn',
          description: 'Phiên của bạn sẽ kết thúc sau 5 phút. Nhấn Gia hạn để tiếp tục.',
          duration: WARN_BEFORE_MS,
          action: (
            <button
              onClick={() => extendSession()}
              className="shrink-0 rounded border border-white/30 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
            >
              Gia hạn
            </button>
          ) as any,
        });
        warnToastIdRef.current = id ?? null;
      }, warnIn);
    }

    logoutTimerRef.current = setTimeout(() => {
      doAutoLogout();
    }, logoutIn);
  };

  const extendSession = () => {
    const now = Date.now();
    sessionStorage.setItem(LOGIN_AT_KEY, String(now));
    pingServer();
    scheduleTimers(now);
    toast({
      title: 'Phiên đã được gia hạn',
      description: 'Phiên làm việc của bạn đã được gia hạn thêm 1 giờ.',
      duration: 3000,
    });
  };

  // Activity listener: extend session automatically if user is active before logout
  useEffect(() => {
    const onActivity = () => {
      const stored = sessionStorage.getItem(LOGIN_AT_KEY);
      if (!stored) return;
      const loginAt = parseInt(stored, 10);
      const elapsed = Date.now() - loginAt;
      // If within warn window (last 5 min) and user is active → auto-extend
      if (elapsed >= SESSION_MS - WARN_BEFORE_MS && elapsed < SESSION_MS) {
        extendSession();
      }
    };
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(e => document.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach(e => document.removeEventListener(e, onActivity));
  }, []);

  // On mount: restore timer if already logged in
  useEffect(() => {
    const stored = sessionStorage.getItem(LOGIN_AT_KEY);
    if (stored) {
      scheduleTimers(parseInt(stored, 10));
    }
    return () => clearTimers();
  }, []);

  // When server says not authenticated, clear local state
  useEffect(() => {
    if (!isPending && !isFetching && userData === null && manualUser !== null) {
      setManualUser(null);
      sessionStorage.removeItem(LOGIN_AT_KEY);
      clearTimers();
    }
  }, [userData, isPending, isFetching]);

  const loginMutation = useMutation({
    mutationFn: async (creds: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/login', creds);
      return await res.json();
    },
    onSuccess: (data: User) => {
      const now = Date.now();
      sessionStorage.setItem(LOGIN_AT_KEY, String(now));
      sessionStorage.removeItem(LOGOUT_REASON_KEY);
      setManualUser(data);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      scheduleTimers(now);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout');
      return await res.json();
    },
    onSuccess: () => {
      clearTimers();
      sessionStorage.removeItem(LOGIN_AT_KEY);
      sessionStorage.removeItem(LOGOUT_REASON_KEY);
      setManualUser(null);
      queryClient.clear();
    },
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      await loginMutation.mutateAsync({ username, password });
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => logoutMutation.mutate();

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user, extendSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { LOGOUT_REASON_KEY };
