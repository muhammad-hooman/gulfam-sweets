import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

// Secure SHA-256 helper for demo mode (never store plain-text passwords)
async function hashPassword(plainText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(true);

  // Helper to fetch user's database profile and roles
  const fetchDbProfileAndRole = useCallback(async (sbUser) => {
    if (!sbUser || !supabase) return { profile: null, role: 'customer' };

    try {
      // 1. Fetch profile record
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      let resolvedProfile = profileData;

      // If no database profile exists yet (e.g. Google OAuth user), create it safely
      if (!resolvedProfile && !profileErr) {
        const meta = sbUser.user_metadata || {};
        const newProfile = {
          id: sbUser.id,
          full_name: meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Customer',
          email: sbUser.email,
          phone: meta.phone || null,
          avatar_url: meta.avatar_url || meta.picture || null,
          updated_at: new Date().toISOString(),
        };

        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .upsert(newProfile, { onConflict: 'id' })
          .select()
          .maybeSingle();

        if (!insertErr && inserted) {
          resolvedProfile = inserted;
        }
      }

      // 2. Fetch highest user role from user_roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', sbUser.id);

      let resolvedRole = 'customer';
      if (rolesData && rolesData.length > 0) {
        const roles = rolesData.map((r) => r.role);
        if (roles.includes('super_admin')) resolvedRole = 'super_admin';
        else if (roles.includes('admin')) resolvedRole = 'admin';
        else if (roles.includes('manager')) resolvedRole = 'manager';
        else if (roles.includes('inventory_manager')) resolvedRole = 'inventory_manager';
        else if (roles.includes('order_manager')) resolvedRole = 'order_manager';
      }

      return { profile: resolvedProfile, role: resolvedRole };
    } catch (err) {
      console.error('Error fetching profile or roles:', err);
      return { profile: null, role: 'customer' };
    }
  }, []);

  // Map Supabase user + DB Profile into unified user state
  const mapUser = useCallback((sbUser, dbProfile = null, dbRole = 'customer') => {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    return {
      id: sbUser.id,
      email: sbUser.email,
      name: dbProfile?.full_name || meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'Customer',
      phone: dbProfile?.phone || meta.phone || '',
      avatarUrl: dbProfile?.avatar_url || meta.avatar_url || meta.picture || '',
      address: dbProfile?.address || meta.address || '',
      city: dbProfile?.city || meta.city || 'Karachi',
      role: dbRole || 'customer',
      createdAt: dbProfile?.created_at || sbUser.created_at,
    };
  }, []);

  // Initialize auth state and real-time subscription
  useEffect(() => {
    let active = true;
    let authSubscription = null;

    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          // Get current active session
          const { data: sessionData, error } = await supabase.auth.getSession();
          if (error) throw error;

          const currentSession = sessionData?.session;
          if (active) {
            setSession(currentSession);
          }

          if (currentSession?.user) {
            const { profile: dbProfile, role: dbRole } = await fetchDbProfileAndRole(currentSession.user);
            if (active) {
              setProfile(dbProfile);
              setRole(dbRole);
              setUser(mapUser(currentSession.user, dbProfile, dbRole));
            }
          } else {
            if (active) {
              setUser(null);
              setProfile(null);
              setRole('customer');
            }
          }
        } catch (err) {
          console.error('Supabase auth initialization error:', err);
        } finally {
          if (active) setLoading(false);
        }

        // Subscribe to auth state changes (sign in, sign out, token refresh)
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!active) return;
            setSession(newSession);

            if (newSession?.user) {
              const { profile: dbProfile, role: dbRole } = await fetchDbProfileAndRole(newSession.user);
              if (active) {
                setProfile(dbProfile);
                setRole(dbRole);
                setUser(mapUser(newSession.user, dbProfile, dbRole));
              }
            } else {
              if (active) {
                setUser(null);
                setProfile(null);
                setRole('customer');
              }
            }
            setLoading(false);
          }
        );

        authSubscription = authListener?.subscription;
      } else {
        // Fallback demo auth: load persisted session
        try {
          const sessionUser =
            localStorage.getItem('gulfam_auth_user') ||
            sessionStorage.getItem('gulfam_auth_user');
          if (sessionUser) {
            const parsed = JSON.parse(sessionUser);
            setUser(parsed);
            setRole(parsed.role || 'customer');
          }
        } catch (e) {
          console.error('Failed to parse local session:', e);
        }
        if (active) setLoading(false);
      }
    }

    initAuth();

    return () => {
      active = false;
      authSubscription?.unsubscribe();
    };
  }, [fetchDbProfileAndRole, mapUser]);

  // Google OAuth Login
  const loginWithGoogle = async (redirectPath = '/account') => {
    if (isSupabaseConfigured && supabase) {
      try {
        sessionStorage.setItem('gulfam_auth_redirect', redirectPath);
      } catch (e) {
        console.warn('Could not store auth redirect in sessionStorage:', e);
      }
      const callbackUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
      return data;
    } else {
      throw new Error('Supabase is not configured. Google Sign-In requires active Supabase credentials.');
    }
  };

  // Email and Password Sign Up
  const signup = async ({ name, email, phone, password }) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
            phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data?.user) {
        const { profile: dbProfile, role: dbRole } = await fetchDbProfileAndRole(data.user);
        setUser(mapUser(data.user, dbProfile, dbRole));
      }
      return data;
    } else {
      // Demo fallback mode
      const existingRaw = localStorage.getItem('gulfam_registered_users');
      const usersList = existingRaw ? JSON.parse(existingRaw) : [];

      const exists = usersList.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        throw new Error('An account with this email address already exists.');
      }

      const passwordHash = await hashPassword(password);
      const newUser = {
        id: 'usr_' + Date.now().toString(36),
        name,
        email: email.toLowerCase(),
        phone,
        address: '',
        city: 'Karachi',
        role: 'customer',
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      usersList.push(newUser);
      localStorage.setItem('gulfam_registered_users', JSON.stringify(usersList));

      const sessionData = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        city: newUser.city,
        role: 'customer',
        createdAt: newUser.createdAt,
      };

      localStorage.setItem('gulfam_auth_user', JSON.stringify(sessionData));
      setUser(sessionData);
      setRole('customer');
      return sessionData;
    }
  };

  // Email and Password Log In
  const login = async ({ emailOrPhone, password, rememberMe = true }) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        const { profile: dbProfile, role: dbRole } = await fetchDbProfileAndRole(data.user);
        setUser(mapUser(data.user, dbProfile, dbRole));
        setRole(dbRole);
      }
      return data;
    } else {
      const existingRaw = localStorage.getItem('gulfam_registered_users');
      const usersList = existingRaw ? JSON.parse(existingRaw) : [];

      const target = usersList.find(
        (u) =>
          u.email.toLowerCase() === emailOrPhone.toLowerCase() ||
          u.phone === emailOrPhone
      );

      if (!target) {
        throw new Error('No account found with this email or phone number.');
      }

      const providedHash = await hashPassword(password);
      if (target.passwordHash !== providedHash) {
        throw new Error('Incorrect password. Please try again or reset it.');
      }

      const sessionData = {
        id: target.id,
        name: target.name,
        email: target.email,
        phone: target.phone,
        address: target.address,
        city: target.city,
        role: target.role || 'customer',
        createdAt: target.createdAt,
      };

      if (rememberMe) {
        localStorage.setItem('gulfam_auth_user', JSON.stringify(sessionData));
        sessionStorage.removeItem('gulfam_auth_user');
      } else {
        sessionStorage.setItem('gulfam_auth_user', JSON.stringify(sessionData));
        localStorage.removeItem('gulfam_auth_user');
      }

      setUser(sessionData);
      setRole(sessionData.role);
      return sessionData;
    }
  };

  // Log Out
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Sign out error:', error);
    }
    localStorage.removeItem('gulfam_auth_user');
    sessionStorage.removeItem('gulfam_auth_user');
    sessionStorage.removeItem('gulfam_auth_redirect');
    setUser(null);
    setProfile(null);
    setSession(null);
    setRole('customer');
  };

  // Send Password Reset Email
  const resetPassword = async (email) => {
    if (isSupabaseConfigured && supabase) {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      return data;
    } else {
      const existingRaw = localStorage.getItem('gulfam_registered_users');
      const usersList = existingRaw ? JSON.parse(existingRaw) : [];
      const userExists = usersList.some(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!userExists) {
        throw new Error('No registered account was found with that email.');
      }
      return { success: true };
    }
  };

  // Set / Update New Password
  const updatePassword = async (newPassword) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return data;
    } else {
      return { success: true };
    }
  };

  // Update Profile
  const updateProfile = async (updates) => {
    if (isSupabaseConfigured && supabase) {
      // 1. Update Supabase Auth user metadata
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });
      if (error) throw error;

      // 2. Also update public.profiles row
      if (user?.id) {
        const profileUpdates = {
          updated_at: new Date().toISOString(),
        };
        if (updates.name) profileUpdates.full_name = updates.name;
        if (updates.phone) profileUpdates.phone = updates.phone;
        if (updates.avatarUrl) profileUpdates.avatar_url = updates.avatarUrl;

        await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);
      }

      if (data?.user) {
        const { profile: dbProfile, role: dbRole } = await fetchDbProfileAndRole(data.user);
        setUser(mapUser(data.user, dbProfile, dbRole));
      }
    } else {
      if (!user) return;
      const updatedUser = { ...user, ...updates };

      const existingRaw = localStorage.getItem('gulfam_registered_users');
      const usersList = existingRaw ? JSON.parse(existingRaw) : [];
      const updatedList = usersList.map((u) =>
        u.id === user.id ? { ...u, ...updates } : u
      );
      localStorage.setItem('gulfam_registered_users', JSON.stringify(updatedList));

      if (localStorage.getItem('gulfam_auth_user')) {
        localStorage.setItem('gulfam_auth_user', JSON.stringify(updatedUser));
      }
      if (sessionStorage.getItem('gulfam_auth_user')) {
        sessionStorage.setItem('gulfam_auth_user', JSON.stringify(updatedUser));
      }
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        isConfigured: isSupabaseConfigured,
        login,
        loginWithGoogle,
        signup,
        logout,
        resetPassword,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
