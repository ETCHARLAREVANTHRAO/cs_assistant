import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { currentUser, signOutUser } = useAuth();
  const navigate = useNavigate();

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student';
  const email = currentUser?.email || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOutUser();
    navigate('/login');
  };

  return (
    <Layout activePage="account" searchPlaceholder="Search documents, quizzes, or chat history...">
      <div className="max-w-[900px] mx-auto mt-6 md:mt-8 space-y-6 px-4 md:px-0 pb-12">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Profile &amp; Account</h2>
          <p className="font-body-md text-body-md text-text-muted mt-1">
            Manage your personal information and application preferences.
          </p>
        </div>
        {/* Profile Header Card */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-soft flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 border-4 border-surface shadow-sm flex items-center justify-center text-primary font-bold text-4xl">
              {avatarLetter}
            </div>
          </div>
          <div className="flex-1 space-y-4 w-full text-center sm:text-left mt-2 sm:mt-0">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">{displayName}</h3>
              <p className="font-body-md text-body-md text-text-muted">{email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[14px]">school</span>
                GATE CS Aspirant
              </div>
            </div>
          </div>
        </div>
        {/* Bento Grid Layout for Settings */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Account Actions */}
          <div className="md:col-span-8 space-y-6">
            <div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-soft">
              <div className="p-4 border-b border-border bg-surface-container-lowest">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Account Settings</h3>
              </div>
              <div className="divide-y divide-border">
                <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest transition-colors group cursor-pointer text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Change Password</p>
                      <p className="font-body-md text-text-muted text-sm mt-0.5">
                        Update your security credentials
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary">
                    chevron_right
                  </span>
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest transition-colors group cursor-pointer text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Manage Subscription</p>
                      <p className="font-body-md text-text-muted text-sm mt-0.5">
                        View billing and plan details
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted group-hover:text-primary">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
            {/* Danger Zone */}
            <div className="bg-surface rounded-2xl overflow-hidden border border-error/20">
              <div className="p-4 border-b border-border bg-error/5">
                <h3 className="font-headline-sm text-headline-sm text-error">Danger Zone</h3>
              </div>
              <div className="p-4">
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-error/10 text-error rounded-xl font-label-md text-label-md hover:bg-error hover:text-on-error transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Log Out
                </button>
              </div>
            </div>
          </div>
          {/* Right Column: Stats / Info */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-surface rounded-2xl p-5 border border-border shadow-soft">
              <h3 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-4">
                Study Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-label-md text-label-md text-on-surface">Syllabus Coverage</span>
                    <span className="font-headline-sm text-headline-sm text-primary">42%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center py-2">
                    <span className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-text-muted">timer</span>
                      Hours Logged
                    </span>
                    <span className="font-label-md text-label-md text-on-surface">124h</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-border/50">
                    <span className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-text-muted">psychology</span>
                      Quizzes Taken
                    </span>
                    <span className="font-label-md text-label-md text-on-surface">38</span>
                  </div>
                </div>
              </div>
            </div>
                        <div className="bg-surface rounded-2xl p-5 border border-border shadow-soft">
              <h3 className="font-label-md text-label-md text-text-muted uppercase tracking-wider mb-4">Admin</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-container text-left">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">dashboard</span>Admin Dashboard</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
                <button onClick={() => navigate('/admin/content')} className="w-full flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-container text-left">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">edit_note</span>Content Controls</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
                <button onClick={() => navigate('/admin/drive-sync')} className="w-full flex items-center justify-between rounded-lg px-3 py-2 hover:bg-surface-container text-left">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">sync</span>Drive Sync</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div><div className="bg-surface-container rounded-2xl p-5 border border-border/50">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary mt-0.5">info</span>
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface">App Version</h4>
                  <p className="font-body-md text-text-muted text-sm mt-1">v1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}



