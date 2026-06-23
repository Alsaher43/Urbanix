import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, getErrorMessage } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';
import { logActivity } from '@/lib/activity';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isConfigured: boolean;
  isManager: boolean;
  orgId: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const loggedLoginFor = useRef<string | null>(null);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('[auth] No se pudo cargar el perfil:', error.message);
      return null;
    }
    return data as Profile | null;
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        setProfile(await fetchProfile(data.session.user.id));
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!active) return;
      setSession(newSession);
      if (newSession?.user) {
        const p = await fetchProfile(newSession.user.id);
        setProfile(p);
        // Registra el login una sola vez por sesión.
        if (event === 'SIGNED_IN' && loggedLoginFor.current !== newSession.user.id) {
          loggedLoginFor.current = newSession.user.id;
          void logActivity('login', `${p?.nombre || newSession.user.email} inició sesión`, {
            userId: newSession.user.id,
            usuario: p?.nombre || newSession.user.email || 'Usuario',
          });
        }
      } else {
        setProfile(null);
        loggedLoginFor.current = null;
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(getErrorMessage(error));
  };

  const signOut = async () => {
    const u = session?.user;
    if (u) {
      void logActivity('logout', `${profile?.nombre || u.email} cerró sesión`, {
        userId: u.id,
        usuario: profile?.nombre || u.email || 'Usuario',
      });
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(getErrorMessage(error));
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(getErrorMessage(error));
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(getErrorMessage(error));
  };

  const refreshProfile = async () => {
    if (session?.user) setProfile(await fetchProfile(session.user.id));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.rol ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      isManager: profile?.rol === 'gerente',
      orgId: profile?.org_id ?? null,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
      refreshProfile,
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
