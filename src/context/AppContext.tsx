import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getCurrentUserApi } from '../api/deliveryApi';
import type { UserMe, UserSettings } from '../types/account';
import { applyUserPreferences } from '../utils/userPreferences';

export type Role = 'Admin' | 'Staff' | 'Shipper' | 'Customer';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ConfirmDialog {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export interface UserInfo {
  id?: number;
  username: string;
  fullName: string;
  role: Role;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string | null;
  gender?: UserMe['gender'];
  avatarUrl?: string | null;
  status?: string;
  settings?: UserSettings;
}

interface AppContextValue {
  role: Role;
  setRole: (r: Role) => void;
  isLoggedIn: boolean;
  user: UserInfo | null;
  login: (r: Role) => void;
  loginWithAuthData: (token: string, username: string, rawRole: string, fullName?: string) => void;
  updateCurrentUser: (profile: UserMe) => void;
  updateCurrentUserSettings: (settings: UserSettings) => void;
  refreshCurrentUser: () => Promise<UserMe | null>;
  logout: () => void;
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  confirm: ConfirmDialog | null;
  openConfirm: (d: ConfirmDialog) => void;
  closeConfirm: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function normalizeRole(rawRole: string): Role {
  const upper = (rawRole || '').toUpperCase();
  if (upper.includes('ADMIN')) return 'Admin';
  if (upper.includes('SHIPPER')) return 'Shipper';
  if (upper.includes('CUSTOMER')) return 'Customer';
  if (upper.includes('STAFF')) return 'Staff';
  return 'Customer';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const savedRole = localStorage.getItem('role');
    return savedRole ? normalizeRole(savedRole) : 'Admin';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('token'));
  });

  const [user, setUser] = useState<UserInfo | null>(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role');
    if (token && username) {
      return { username, fullName: username, role: normalizeRole(savedRole || 'Customer') };
    }
    return null;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmDialog | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem('role', r);
  }, []);

  const loginWithAuthData = useCallback((token: string, username: string, rawRole: string, fullName?: string) => {
    const parsedRole = normalizeRole(rawRole);
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', parsedRole);
    localStorage.removeItem('fullName');

    setRoleState(parsedRole);
    setUser({ username, fullName: fullName || username, role: parsedRole });
    setIsLoggedIn(true);
  }, []);

  const updateCurrentUser = useCallback((profile: UserMe) => {
    const parsedRole = normalizeRole(profile.role);
    localStorage.setItem('username', profile.username);
    localStorage.setItem('role', parsedRole);
    setRoleState(parsedRole);
    setUser({
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName || profile.username,
      role: parsedRole,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      avatarUrl: profile.avatarUrl,
      status: profile.status,
      settings: profile.settings,
    });
    applyUserPreferences(profile.settings);
  }, []);

  const updateCurrentUserSettings = useCallback((settings: UserSettings) => {
    setUser((current) => current ? { ...current, settings } : current);
    applyUserPreferences(settings);
  }, []);

  const refreshCurrentUser = useCallback(async (): Promise<UserMe | null> => {
    if (!localStorage.getItem('token')) return null;
    try {
      const response = await getCurrentUserApi();
      if (response.httpStatus === 200 && response.data) {
        updateCurrentUser(response.data);
        return response.data;
      }
    } catch {
      // Lỗi 401 đã được interceptor xử lý. Các lỗi mạng tạm thời không xóa phiên.
    }
    return null;
  }, [updateCurrentUser]);

  const login = useCallback((r: Role) => {
    setRoleState(r);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    setIsLoggedIn(false);
    setUser(null);
    applyUserPreferences(null);
  }, []);

  useEffect(() => {
    if (isLoggedIn) void refreshCurrentUser();
  }, [isLoggedIn, refreshCurrentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const openConfirm = useCallback((d: ConfirmDialog) => setConfirm(d), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);

  return (
    <AppContext.Provider value={{
      role, setRole, isLoggedIn, user, login, loginWithAuthData,
      updateCurrentUser, updateCurrentUserSettings, refreshCurrentUser, logout,
      toasts, addToast, removeToast,
      confirm, openConfirm, closeConfirm,
      sidebarOpen, setSidebarOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
