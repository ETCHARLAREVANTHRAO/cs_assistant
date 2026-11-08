import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  notificationsList,
  notificationsMarkAllRead,
  notificationsMarkRead,
  type NotificationItem,
} from '../services/api';

export type PageKey =
  | 'chat'
  | 'documents'
  | 'learning'
  | 'doubts'
  | 'revision-planner'
  | 'resources'
  | 'ai'
  | 'community'
  | 'exam-info'
  | 'motivation'
  | 'revision'
  | 'quiz'
  | 'pyq'
  | 'progress'
  | 'downloads'
  | 'settings'
  | 'account'
  | 'usage'
  | 'billing'
  | 'research';

interface NavSection {
  title: string;
  items: Array<{
    key: PageKey;
    label: string;
    icon: string;
    to: string;
    badge?: string;
  }>;
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core AI & Study',
    items: [
      { key: 'chat', label: 'AI Assistant', icon: 'smart_toy', to: '/chat' },
      { key: 'learning', label: 'Curriculum Hub', icon: 'menu_book', to: '/learning' },
      { key: 'doubts', label: 'Doubt Solver', icon: 'psychology_alt', to: '/doubts' },
    ],
  },
  {
    title: 'GATE Practice & Tests',
    items: [
      { key: 'pyq', label: 'PYQ 2012–2026', icon: 'school', to: '/pyq', badge: 'Active' },
      { key: 'quiz', label: 'Adaptive Quiz', icon: 'quiz', to: '/quiz' },
      { key: 'revision-planner', label: 'Revision Planner', icon: 'event_note', to: '/revision-planner' },
    ],
  },
  {
    title: 'Knowledge & Research',
    items: [
      { key: 'resources', label: 'GATE Resources', icon: 'auto_stories', to: '/resources' },
      { key: 'research', label: 'Paper Hub', icon: 'biotech', to: '/research', badge: 'AI' },
      { key: 'documents', label: 'Document Library', icon: 'folder_open', to: '/documents' },
    ],
  },
  {
    title: 'Analytics & Community',
    items: [
      { key: 'progress', label: 'My Progress', icon: 'analytics', to: '/progress' },
      { key: 'motivation', label: 'Daily Motivation', icon: 'bolt', to: '/motivation' },
      { key: 'community', label: 'Aspirants Community', icon: 'forum', to: '/community' },
      { key: 'exam-info', label: 'GATE Exam Intel', icon: 'campaign', to: '/exam-info' },
    ],
  },
];

const MOBILE_NAV_ITEMS = [
  { key: 'chat' as PageKey, label: 'Assistant', icon: 'smart_toy', to: '/chat' },
  { key: 'learning' as PageKey, label: 'Learn', icon: 'menu_book', to: '/learning' },
  { key: 'doubts' as PageKey, label: 'Doubts', icon: 'psychology_alt', to: '/doubts' },
  { key: 'pyq' as PageKey, label: 'PYQ', icon: 'school', to: '/pyq' },
  { key: 'resources' as PageKey, label: 'Resources', icon: 'auto_stories', to: '/resources' },
  { key: 'billing' as PageKey, label: 'Plans', icon: 'workspace_premium', to: '/billing' },
  { key: 'account' as PageKey, label: 'Profile', icon: 'person', to: '/account' },
];

interface LayoutProps {
  activePage: PageKey;
  children: ReactNode;
  title?: string;
  searchPlaceholder?: string;
}

export default function Layout({ activePage, children, title, searchPlaceholder }: LayoutProps) {
  const { currentUser, signOutUser } = useAuth();
  const navigate = useNavigate();
  const bellRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || document.documentElement.classList.contains('dark');
  });

  const avatarLetter = (currentUser?.displayName || currentUser?.email || 'A')
    .charAt(0)
    .toUpperCase();

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  async function refreshNotifications() {
    if (!currentUser) return;
    try {
      const data = await notificationsList();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // silently handle
    }
  }

  useEffect(() => {
    refreshNotifications();
    const timer = window.setInterval(refreshNotifications, 60000);
    return () => window.clearInterval(timer);
  }, [currentUser?.uid]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!bellRef.current?.contains(event.target as Node)) setPanelOpen(false);
    }
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, []);

  async function openNotification(item: NotificationItem) {
    try {
      if (!item.read) {
        const data = await notificationsMarkRead(item.notification_id);
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch {}
    setPanelOpen(false);
    if (item.action_route) navigate(item.action_route);
  }

  async function markAllRead() {
    try {
      const data = await notificationsMarkAllRead();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {}
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-[#07080e] text-slate-800 dark:text-slate-100 font-sans antialiased overflow-hidden">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar (Desktop + Mobile Slide-out Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/95 dark:bg-[#0d0f1b]/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between">
          <Link
            to="/chat"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 group text-left"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200 -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[16px] text-slate-900 dark:text-white tracking-tight">
                  My Assistant
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  GATE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Computer Science AI</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 sidebar-scroll">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </h3>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const active = item.key === activePage;
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25 font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`material-symbols-outlined text-[19px] transition-transform duration-200 group-hover:scale-110 ${
                            active ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-indigo-500'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold uppercase tracking-wider ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Shortcuts */}
          <div className="space-y-1 pt-2">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Account & Utilities
            </h3>
            <div className="space-y-0.5 pt-1">
              <Link
                to="/billing"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  activePage === 'billing'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">workspace_premium</span>
                  <span>Plans &amp; Billing</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                  PRO
                </span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  activePage === 'settings'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">tune</span>
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* User Profile Footer Card */}
        <div className="p-3.5 border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-50/60 dark:bg-[#0b0c16]/60">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/70 transition-colors duration-200 group">
            <Link
              to="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'GATE Aspirant'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] text-slate-400 truncate">CS Aspirant Pro</p>
                </div>
              </div>
            </Link>
            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            {currentUser && (
              <button
                onClick={() => signOutUser()}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden md:ml-72 bg-[#f8fafc] dark:bg-[#07080e] text-slate-900 dark:text-slate-100">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 md:px-8 py-3.5 bg-white/80 dark:bg-[#0d0f1b]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar"
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] md:text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
                {title || 'My Assistant • GATE CS'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live AI RAG
              </span>
            </div>
          </div>

          {/* Center: Search Box (Desktop) */}
          {searchPlaceholder && (
            <div className="hidden lg:flex flex-1 max-w-md mx-6 items-center">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-10 py-1.5 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  ⌘K
                </span>
              </div>
            </div>
          )}

          {/* Right: Quick Actions, Notifications, User */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Quick Link to GATE PYQ */}
            <Link
              to="/pyq"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/60 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-500">history_edu</span>
              <span>PYQs</span>
            </Link>

            {/* Notifications Bell */}
            <div className="relative" ref={bellRef}>
              <button
                aria-label="Notifications"
                onClick={() => {
                  setPanelOpen((open) => !open);
                  refreshNotifications();
                }}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#0d0f1b]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {panelOpen && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-indigo-950/20 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/70 bg-slate-50/70 dark:bg-[#0c0e1a]/70">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-500 text-[18px]">notifications_active</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Study Notifications
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications yet. You're all caught up!
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.notification_id}
                          onClick={() => openNotification(item)}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            !item.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-[17px] text-indigo-500 mt-0.5">
                              {item.type === 'alert' ? 'warning' : item.type === 'success' ? 'check_circle' : 'info'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                                {item.message}
                              </p>
                            </div>
                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profile Capsule */}
            <Link
              to="/account"
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700/60 transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                {avatarLetter}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-300">
                {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Profile'}
              </span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto relative min-h-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden sticky bottom-0 z-40 bg-white/95 dark:bg-[#0c0d18]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-around py-1.5 px-2">
          {MOBILE_NAV_ITEMS.map((item) => {
            const active = item.key === activePage;
            return (
              <Link
                key={item.key}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  active
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
