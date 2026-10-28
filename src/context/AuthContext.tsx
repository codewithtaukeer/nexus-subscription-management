import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile, UserRole } from '../types/database';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  role: UserRole;
  isLoading: boolean;
  switchPersona: (role: UserRole, email?: string) => Promise<void>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const DEMO_PERSONAS: Record<'admin', Partial<Profile>> = {
  admin: {
    id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Alex Vance (Admin)',
    email: 'admin@nexus.io',
    role: 'admin',
    timezone: 'Asia/Kolkata',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      // Check if custom user is saved
      const savedCustomUser = localStorage.getItem('nexus_custom_user');
      if (savedCustomUser) {
        try {
          const parsed = JSON.parse(savedCustomUser);
          if (parsed && parsed.id) {
            setCurrentUser(parsed);
            setIsLoading(false);
            return;
          }
        } catch {
          // ignore parsing error
        }
      }

      // Default to Administrator profile
      const persona = DEMO_PERSONAS.admin;
      
      // Query profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', persona.email)
        .maybeSingle();

      if (data && !error) {
        setCurrentUser(data);
      } else {
        // Fallback to local representation if network unavailable
        setCurrentUser({
          id: persona.id!,
          full_name: persona.full_name!,
          email: persona.email!,
          role: 'admin',
          timezone: persona.timezone || 'Asia/Kolkata',
          notification_preferences: { email: true, in_app: true },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Could not load profile from database, using admin profile:', err);
      setCurrentUser(DEMO_PERSONAS.admin as Profile);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const switchPersona = async (role: UserRole, customEmail?: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem('nexus_persona', role);
      const targetEmail = customEmail || DEMO_PERSONAS.admin.email;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', targetEmail)
        .maybeSingle();

      if (data && !error) {
        setCurrentUser(data);
      } else {
        setCurrentUser({
          id: DEMO_PERSONAS.admin.id!,
          full_name: DEMO_PERSONAS.admin.full_name!,
          email: DEMO_PERSONAS.admin.email!,
          role,
          timezone: 'Asia/Kolkata',
          notification_preferences: { email: true, in_app: true },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, _password?: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const generatedId = crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}`;
      const newProfile: Profile = {
        id: generatedId,
        full_name: fullName || email.split('@')[0],
        email: email.toLowerCase(),
        role: 'member',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        notification_preferences: { email: true, in_app: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Try inserting into Supabase profiles
      try {
        const { error } = await supabase
          .from('profiles')
          .insert([newProfile]);
        
        if (error) {
          console.warn('Direct Supabase profile insert failed (RLS or duplicate), saving locally:', error);
        }
      } catch (dbErr) {
        console.warn('Supabase profile insert skipped:', dbErr);
      }

      // Save custom user to localStorage
      localStorage.setItem('nexus_custom_user', JSON.stringify(newProfile));
      localStorage.setItem('nexus_persona', 'member');
      setCurrentUser(newProfile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();

      // Check if matches admin email
      if (cleanEmail === DEMO_PERSONAS.admin.email?.toLowerCase()) {
        await switchPersona('admin');
        return { success: true };
      }

      // Check saved custom user
      const savedUserStr = localStorage.getItem('nexus_custom_user');
      if (savedUserStr) {
        const saved = JSON.parse(savedUserStr) as Profile;
        if (saved.email.toLowerCase() === cleanEmail) {
          setCurrentUser(saved);
          return { success: true };
        }
      }

      // Try Supabase lookup
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data && !error) {
        setCurrentUser(data);
        return { success: true };
      }

      // Fallback: create or log in as new member with this email
      const newMember: Profile = {
        id: crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}`,
        full_name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'member',
        timezone: 'Asia/Kolkata',
        notification_preferences: { email: true, in_app: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('nexus_custom_user', JSON.stringify(newMember));
      setCurrentUser(newMember);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('nexus_custom_user');
    localStorage.removeItem('nexus_persona');
    setCurrentUser(DEMO_PERSONAS.admin as Profile);
  };

  const refreshUser = async () => {
    if (currentUser?.email) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle();
      if (data) setCurrentUser(data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'member',
        isLoading,
        switchPersona,
        signUp,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
