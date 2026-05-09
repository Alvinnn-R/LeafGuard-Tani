import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Home as HomeIcon, ScanLine, Clock, User } from 'lucide-react';

// Pages — eagerly load Home + Analysis, lazy load the rest
import Home from './pages/Home';
import Analysis from './pages/Analysis';

const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));
const Guide = lazy(() => import('./pages/Guide'));

/**
 * Konfigurasi item navigasi bottom bar
 */
const NAV_ITEMS = [
  {
    path: '/',
    label: 'Beranda',
    icon: HomeIcon,
  },
  {
    path: '/analyze',
    label: 'Analisis',
    icon: ScanLine,
  },
  {
    path: '/history',
    label: 'Riwayat',
    icon: Clock,
  },
  {
    path: '/profile',
    label: 'Profil',
    icon: User,
  },
];

/**
 * LazyFallback — Loading ringan untuk lazy-loaded pages
 */
function LazyFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-[3px] border-gray-200 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/**
 * BottomNav — Fixed bottom navigation bar dengan 4 tab
 */
function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);

          return (
            <NavLink
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] 
                         transition-colors duration-200 relative group"
            >
              {/* Active indicator line */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] 
                                 bg-primary rounded-b-full" />
              )}

              {/* Icon */}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.6}
                className={`mb-0.5 transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />

              {/* Label */}
              <span className={`text-[10px] leading-tight transition-colors duration-200 ${
                isActive 
                  ? 'font-semibold text-primary' 
                  : 'font-medium text-gray-400 group-hover:text-gray-600'
              }`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * AppLayout — Layout utama dengan bottom nav
 */
function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Main content area */}
      <main className="pb-safe-nav">
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<Analysis />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/guide" element={<Guide />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}

/**
 * App — Root component
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
