import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { AppShell } from './components/common/AppShell';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlansPage } from './pages/PlansPage';
import { MembersPage } from './pages/MembersPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { BillingPage } from './pages/BillingPage';
import { RenewalRadarPage } from './pages/RenewalRadarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RetentionPage } from './pages/RetentionPage';
import { DBMSStudioPage } from './pages/DBMSStudioPage';
import { DBMSDocsPage } from './pages/DBMSDocsPage';
import { MemberPortalPage } from './pages/MemberPortalPage';
import { PersonalSubsPage } from './pages/PersonalSubsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { fetchNotifications } from './lib/supabase';

const AppContent: React.FC = () => {
  const { role, currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    fetchNotifications()
      .then((notifs) => {
        const unread = notifs.filter((n) => !n.read_at).length;
        setUnreadCount(unread);
      })
      .catch((err) => console.error('Notification count error:', err));
  }, [currentView]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-[#071112] flex flex-col justify-between">
        <Header 
          currentView={currentView} 
          onNavigate={handleNavigate} 
          unreadCount={unreadCount} 
        />
        <main className="flex-grow">
          <LandingPage onNavigate={handleNavigate} />
        </main>
        <Footer onNavigate={handleNavigate} />
      </div>
    );
  }

  return (
    <AppShell
      currentView={currentView}
      onNavigate={handleNavigate}
      unreadCount={unreadCount}
    >
      {currentView === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentView === 'personal_subs' && <PersonalSubsPage />}
      {currentView === 'portal' && <MemberPortalPage onNavigate={handleNavigate} />}
      {currentView === 'plans' && <PlansPage />}
      {currentView === 'members' && <MembersPage />}
      {currentView === 'subscriptions' && <SubscriptionsPage />}
      {currentView === 'billing' && <BillingPage />}
      {currentView === 'renewals' && <RenewalRadarPage />}
      {currentView === 'analytics' && <AnalyticsPage onNavigate={handleNavigate} />}
      {currentView === 'retention' && <RetentionPage />}
      {currentView === 'dbms' && <DBMSStudioPage />}
      {currentView === 'dbms_docs' && <DBMSDocsPage />}
      {currentView === 'notifications' && <NotificationsPage />}
      {currentView === 'settings' && <SettingsPage />}
    </AppShell>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
