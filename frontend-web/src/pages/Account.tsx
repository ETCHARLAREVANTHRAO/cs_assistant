import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { currentUser, signOutUser } = useAuth();
  const navigate = useNavigate();

  const planId = localStorage.getItem('my_assistant_user_plan') || 'student';
  const planNames: Record<string, string> = {
    free: 'Free Explorer',
    student: 'Student Pro (₹149/mo)',
    pro: 'GATE CS Pro (₹499/mo)',
    research: 'Research / Power (₹999/mo)',
    institute: 'Institute / Teams',
  };
  const activePlanName = planNames[planId] || 'Student Pro';

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'GATE Aspirant';
  const email = currentUser?.email || 'student@gate-cs.edu';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOutUser();
    navigate('/login');
  };

  return (
    <Layout activePage="account" searchPlaceholder="Search documents, quizzes, or chat history...">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 px-4 md:px-gutter pb-16">
        
        {/* Resq.io Ambient Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar with Glow Ring */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-primary to-indigo-500 p-1 shadow-glow-md">
                <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-white font-extrabold text-3xl sm:text-4xl shadow-inner">
                  {avatarLetter}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-xs">verified</span>
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                  GATE CS Aspirant
                </span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                  {activePlanName}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-mono">
                {email}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/billing')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Manage Subscription
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  Preferences
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Bento Grid: Account Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Study Progress Capsule */}
            <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-text-primary">GATE CS Preparation Readiness</h2>
                  <p className="text-xs text-text-muted mt-0.5">Calculated from completed syllabus topics and mocks</p>
                </div>
                <span className="text-2xl font-extrabold text-primary font-mono">48%</span>
              </div>

              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: '48%' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-surface-container-lowest border border-border/60 text-center">
                  <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Hours Logged</div>
                  <div className="text-base font-bold text-text-primary mt-0.5">142h</div>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-lowest border border-border/60 text-center">
                  <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">PYQ Attempts</div>
                  <div className="text-base font-bold text-text-primary mt-0.5">46 Tests</div>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-lowest border border-border/60 text-center">
                  <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Current Streak</div>
                  <div className="text-base font-bold text-amber-500 mt-0.5">12 Days 🔥</div>
                </div>
              </div>
            </div>

            {/* Account Settings Menu */}
            <div className="bg-surface rounded-3xl border border-border shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border/60 bg-surface-container-lowest">
                <h2 className="text-base font-bold text-text-primary">Account &amp; Security</h2>
                <p className="text-xs text-text-muted mt-0.5">Authentication and active memberships</p>
              </div>

              <div className="divide-y divide-border/60">
                <div className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface-container-low transition-colors group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">shield</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Google Single Sign-On</p>
                      <p className="text-xs text-text-muted mt-0.5">Authenticated securely via Google Identity &amp; Firebase</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    Active &amp; Linked
                  </span>
                </div>

                <div
                  onClick={() => navigate('/billing')}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface-container-low transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">credit_card</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Subscription Plan &amp; Quotas</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Current: <strong className="text-primary font-semibold">{activePlanName}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                      Change Plan
                    </span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-base">
                      chevron_right
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => navigate('/documents')}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface-container-low transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-lg">folder_open</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Personal Document Vault</p>
                      <p className="text-xs text-text-muted mt-0.5">Manage uploaded notes, PDFs, and vector RAG indices</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary text-base">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>

            {/* Logout / Danger Zone */}
            <div className="bg-surface rounded-3xl border border-red-500/20 shadow-soft overflow-hidden">
              <div className="p-5 border-b border-red-500/20 bg-red-500/5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-red-600 dark:text-red-400">Account Session</h2>
                  <p className="text-xs text-text-muted mt-0.5">Log out from this device</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign Out
                </button>
              </div>
            </div>

          </div>

          {/* Right Aside: Admin & Quick Links */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Admin Console Shortcut */}
            <div className="bg-surface rounded-3xl p-6 border border-border shadow-soft flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <span className="material-symbols-outlined">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Admin Control Center</h3>
                  <p className="text-xs text-text-muted">Platform management</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full flex items-center justify-between rounded-xl p-3 hover:bg-surface-container text-left transition-colors text-xs font-semibold text-text-primary"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-primary">dashboard</span>
                    Admin Dashboard
                  </span>
                  <span className="material-symbols-outlined text-sm text-text-muted">chevron_right</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin/content')}
                  className="w-full flex items-center justify-between rounded-xl p-3 hover:bg-surface-container text-left transition-colors text-xs font-semibold text-text-primary"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-primary">edit_note</span>
                    Content &amp; Syllabus Manager
                  </span>
                  <span className="material-symbols-outlined text-sm text-text-muted">chevron_right</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin/drive-sync')}
                  className="w-full flex items-center justify-between rounded-xl p-3 hover:bg-surface-container text-left transition-colors text-xs font-semibold text-text-primary"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-primary">cloud_sync</span>
                    Google Drive Sync
                  </span>
                  <span className="material-symbols-outlined text-sm text-text-muted">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Version & Build Badge */}
            <div className="rounded-3xl p-5 bg-surface-container-low border border-border/60 text-xs text-text-muted flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">terminal</span>
              <div>
                <p className="font-bold text-text-primary mb-0.5">My Assistant &bull; Release v2.4</p>
                <p className="leading-relaxed">
                  Engineered with pgvector RAG, Gemini 2.5 Flash, and FastEmbed for high-yield GATE CS preparation.
                </p>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </Layout>
  );
}
