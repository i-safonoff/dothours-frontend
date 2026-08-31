import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PhoneShell from './components/PhoneShell';
import TabBar, { type TabId } from './components/TabBar';
import Onboarding from './screens/Onboarding';
import Auth from './screens/Auth';
import GoalSelect from './screens/GoalSelect';
import Tracker from './screens/Tracker';
import City from './screens/City';
import Friends from './screens/Friends';
import PairedTasks from './screens/PairedTasks';
import Companies from './screens/Companies';
import Feed from './screens/Feed';
import Profile from './screens/Profile';
import { AuthProvider, useAuth } from './api/AuthContext';
import { RealtimeProvider } from './api/RealtimeContext';
import { categoriesApi } from './api/endpoints';

type Stage = 'onboarding' | 'auth' | 'checking' | 'goals' | 'app';

function AppShell() {
  const { user, loading, logout } = useAuth();
  const [stage, setStage] = useState<Stage>('onboarding');
  const [tab, setTab] = useState<TabId>('tracker');
  const [editingGoals, setEditingGoals] = useState(false);
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStage((s) => (s === 'app' || s === 'goals' || s === 'checking' ? 'onboarding' : s));
      return;
    }
    setStage('checking');
    categoriesApi
      .list()
      .then((cats) => setStage(cats.length > 0 ? 'app' : 'goals'))
      .catch(() => setStage('goals'));
    // Only re-run on an actual login/logout, not on in-place profile edits
    // (updateUser() replaces the user object, which would otherwise re-trigger this).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

  function openProfile(userId: string) {
    setViewedProfileId(userId);
    setTab('profile');
  }

  function changeTab(next: TabId) {
    if (next === 'profile') setViewedProfileId(null);
    setTab(next);
  }

  if (loading) {
    return (
      <PhoneShell>
        <div className="screen-fade" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>Загрузка…</span>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <AnimatePresence mode="wait">
        {stage === 'onboarding' && (
          <motion.div
            key="onboarding"
            className="screen-fade"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <Onboarding onStart={() => setStage('auth')} />
          </motion.div>
        )}

        {stage === 'auth' && (
          <motion.div
            key="auth"
            className="screen-fade"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <Auth />
          </motion.div>
        )}

        {stage === 'checking' && (
          <motion.div
            key="checking"
            className="screen-fade"
            style={{ alignItems: 'center', justifyContent: 'center' }}
            exit={{ opacity: 0 }}
          >
            <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>Секунду…</span>
          </motion.div>
        )}

        {stage === 'goals' && (
          <motion.div
            key="goals"
            className="screen-fade"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <GoalSelect onDone={() => setStage('app')} />
          </motion.div>
        )}

        {stage === 'app' && (
          <motion.div
            key="app"
            className="screen-fade"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'relative', flex: 1, display: 'flex', minHeight: 0 }}
          >
            <AnimatePresence mode="wait">
              {tab === 'tracker' && (
                <motion.div key="tracker" className="screen-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Tracker onEditGoals={() => setEditingGoals(true)} />
                </motion.div>
              )}
              {tab === 'feed' && (
                <motion.div key="feed" className="screen-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Feed onOpenProfile={openProfile} />
                </motion.div>
              )}
              {tab === 'city' && (
                <motion.div key="city" className="screen-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <City />
                </motion.div>
              )}
              {tab === 'friends' && (
                <motion.div key="friends" className="screen-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Friends onOpenProfile={openProfile} />
                </motion.div>
              )}
              {tab === 'paired' && (
                <motion.div key="paired" className="screen-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <PairedTasks />
                </motion.div>
              )}
              {tab === 'companies' && (
                <motion.div key="companies" className="screen-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Companies />
                </motion.div>
              )}
              {tab === 'profile' && (
                <motion.div key="profile" className="screen-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Profile
                    userId={viewedProfileId}
                    onBack={() => setViewedProfileId(null)}
                    onLogout={() => {
                      logout();
                      setStage('onboarding');
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <TabBar active={tab} onChange={changeTab} />

            <AnimatePresence>
              {editingGoals && (
                <motion.div
                  key="editgoals"
                  className="screen-fade"
                  style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'var(--bg)' }}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 260 }}
                >
                  <GoalSelect onDone={() => setEditingGoals(false)} onClose={() => setEditingGoals(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <AppShell />
      </RealtimeProvider>
    </AuthProvider>
  );
}
