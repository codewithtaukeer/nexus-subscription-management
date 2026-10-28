import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile, UserRole } from '../types/database';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  role: UserRole;
  isPremium: boolean;
  activePlanSlug: string;
  isLoading: boolean;
  switchPersona: (role: UserRole, email?: string) => Promise<void>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  upgradeToPro: (planId?: string, billingCycle?: string, amount?: number) => Promise<void>;
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

/* Synchronously read ?role= param so the route guard never redirects before async load */
function getInitialRole(): UserRole {
  if (typeof window !== 'undefined') {
    const p = new URLSearchParams(window.location.search).get('role');
    if (p === 'admin' || p === 'member') return p;
  }
  return 'admin'; // default persona
}

function buildSyncProfile(role: UserRole): Profile {
  if (role === 'admin') {
    return {
      id: DEMO_PERSONAS.admin.id!,
      full_name: DEMO_PERSONAS.admin.full_name!,
      email: DEMO_PERSONAS.admin.email!,
      role: 'admin',
      timezone: 'Asia/Kolkata',
      notification_preferences: { email: true, in_app: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return {
    id: 'member-placeholder',
    full_name: 'Member',
    email: 'member@nexus.io',
    role: 'member',
    timezone: 'Asia/Kolkata',
    notification_preferences: { email: true, in_app: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* Synchronous initial state — prevents route guard from firing before async load */
  const initialRole = getInitialRole();
  const [currentUser, setCurrentUser] = useState<Profile | null>(buildSyncProfile(initialRole));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPremium, setIsPremium] = useState<boolean>(initialRole === 'admin');
  const [activePlanSlug, setActivePlanSlug] = useState<string>(initialRole === 'admin' ? 'nexus-pro' : 'quantum-starter');

  const checkUserSubscription = async (user: Profile | null) => {
    if (!user) {
      setIsPremium(false);
      setActivePlanSlug('quantum-starter');
      return;
    }
    if (user.role === 'admin') {
      setIsPremium(true);
      setActivePlanSlug('nexus-pro');
      return;
    }

    // Check localStorage fast-cache
    const localPro = localStorage.getItem(`nexus_pro_active_${user.id}`);
    if (localPro === 'true') {
      setIsPremium(true);
      setActivePlanSlug('nexus-pro');
      return;
    }

    try {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*, membership_plans(*)')
        .eq('member_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subData && subData.membership_plans) {
        const isPaid = subData.membership_plans.slug === 'nexus-pro' || Number(subData.price_at_signup) > 0;
        setIsPremium(isPaid);
        setActivePlanSlug(subData.membership_plans.slug || (isPaid ? 'nexus-pro' : 'quantum-starter'));
        if (isPaid) {
          localStorage.setItem(`nexus_pro_active_${user.id}`, 'true');
        }
      } else {
        setIsPremium(false);
        setActivePlanSlug('quantum-starter');
      }
    } catch {
      setIsPremium(false);
      setActivePlanSlug('quantum-starter');
    }
  };

  const upgradeToPro = async (planId?: string, billingCycle?: string, amount?: number) => {
    if (!currentUser) return;
    const finalPlanId = planId || 'c0000000-0000-0000-0000-000000000002';
    const finalAmount = amount || 2499;
    const cycle = billingCycle || 'monthly';
    const subId = crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}`;

    // Mark locally immediately for fast optimistic UI response
    localStorage.setItem(`nexus_pro_active_${currentUser.id}`, 'true');
    setIsPremium(true);
    setActivePlanSlug('nexus-pro');

    try {
      // 1. Record / Upsert active subscription in Supabase
      await supabase.from('subscriptions').upsert({
        id: subId,
        member_id: currentUser.id,
        plan_id: finalPlanId,
        status: 'active',
        billing_cycle: cycle,
        price_at_signup: finalAmount,
        currency: 'INR',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        auto_renew: true,
        cancel_at_period_end: false,
      });

      // 2. Generate settled invoice
      const invoiceNumber = `INV-PRO-${Date.now().toString().slice(-6)}`;
      await supabase.from('invoices').insert({
        subscription_id: subId,
        member_id: currentUser.id,
        invoice_number: invoiceNumber,
        subtotal: finalAmount,
        tax_amount: 0,
        total_amount: finalAmount,
        currency: 'INR',
        status: 'paid',
        due_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
      });

      // 3. Record audit trail
      await supabase.from('audit_logs').insert({
        actor_id: currentUser.id,
        action: 'UPGRADE_TO_NEXUS_PRO',
        entity_type: 'subscriptions',
        entity_id: subId,
        metadata: {
          plan: 'Nexus Pro (Paid)',
          gateway: 'DEMO_CARD_ACID_SETTLED',
          amount: finalAmount,
          billing_cycle: cycle,
        },
      });
    } catch (err) {
      console.warn('Supabase subscription upgrade persisted locally:', err);
    }
  };

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role');
      if (urlRole === 'member') {
        const { data: memberData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'member')
          .limit(1)
          .maybeSingle();

        if (memberData) {
          setCurrentUser(memberData);
          setIsLoading(false);
          return;
        }
      } else if (urlRole === 'admin') {
        const { data: adminData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'admin')
          .limit(1)
          .maybeSingle();

        if (adminData) {
          setCurrentUser(adminData);
          setIsLoading(false);
          return;
        }
      }

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

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    checkUserSubscription(currentUser);
  }, [currentUser]);

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
      if (data) {
        setCurrentUser(data);
        await checkUserSubscription(data);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'member',
        isPremium,
        activePlanSlug,
        isLoading,
        switchPersona,
        signUp,
        signIn,
        signOut,
        refreshUser,
        upgradeToPro,
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
