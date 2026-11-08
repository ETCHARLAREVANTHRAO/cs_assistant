import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  notificationsGetPreferences,
  notificationsUpdatePreferences,
  type NotificationPreferences,
} from '../services/api';

type FontSize = 'small' | 'default' | 'large';

function ModernToggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-surface-container-high'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [revisionReminders, setRevisionReminders] = useState(true);
  const [quizAlerts, setQuizAlerts] = useState(true);
  const [examUpdates, setExamUpdates] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);
  const [dailyChallenge, setDailyChallenge] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>('default');
  const [notificationStatus, setNotificationStatus] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    notificationsGetPreferences()
      .then((prefs) => {
        setRevisionReminders(prefs.revision_reminders);
        setQuizAlerts(prefs.quiz_alerts);
        setExamUpdates(prefs.exam_updates);
        setSystemUpdates(prefs.system_updates);
        setDailyChallenge(prefs.daily_challenge);
      })
      .catch(() => setNotificationStatus('Could not load notification preferences.'));
  }, []);

  async function saveNotificationPreference(key: keyof NotificationPreferences, value: boolean) {
    setNotificationStatus('Saving...');
    try {
      const prefs = await notificationsUpdatePreferences({ [key]: value });
      setRevisionReminders(prefs.revision_reminders);
      setQuizAlerts(prefs.quiz_alerts);
      setExamUpdates(prefs.exam_updates);
      setSystemUpdates(prefs.system_updates);
      setDailyChallenge(prefs.daily_challenge);
      setNotificationStatus('Changes saved successfully.');
      setTimeout(() => setNotificationStatus(''), 2500);
    } catch {
      setNotificationStatus('Could not save notification preference.');
    }
  }

  return (
    <Layout activePage="settings">
      <div className="max-w-4xl mx-auto w-full px-4 md:px-gutter pb-16 flex flex-col gap-8">
        
        {/* Resq.io Ambient Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">tune</span>
                App Preferences
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                Settings &amp; Personalization
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
                Configure your display theme, reading typography, notification alerts, and AI study tutor preferences.
              </p>
            </div>

            {notificationStatus && (
              <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-indigo-500/30 text-xs font-medium text-indigo-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
                {notificationStatus}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Section: Appearance */}
          <section className="bg-surface rounded-3xl border border-border shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border/60 bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">palette</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Theme &amp; Visuals</h2>
                  <p className="text-xs text-text-muted mt-0.5">Customize lighting, dark mode, and mathematical typography</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              
              {/* Dark Mode Row */}
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted">
                    <span className="material-symbols-outlined text-lg">
                      {darkMode ? 'dark_mode' : 'light_mode'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">Dark Mode Theme</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Reduce eye strain during late-night GATE study marathons
                    </p>
                  </div>
                </div>
                <ModernToggle id="darkModeToggle" checked={darkMode} onChange={setDarkMode} />
              </div>

              {/* Font Size Row */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted">
                    <span className="material-symbols-outlined text-lg">format_size</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">Interface Text Scaling</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      Optimize formula readability for algorithms and mathematical symbols
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-2xl border border-border/60 self-start sm:self-auto">
                  {(['small', 'default', 'large'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                        fontSize === size
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </section>

          {/* Section: Notifications */}
          <section className="bg-surface rounded-3xl border border-border shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border/60 bg-surface-container-lowest">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">notifications_active</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Revision &amp; Exam Alerts</h2>
                  <p className="text-xs text-text-muted mt-0.5">Control automated push triggers and daily study goals</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/60">
              
              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">Spaced Repetition Reminders</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Trigger smart notifications when a topic reaches its forgetting curve threshold
                  </p>
                </div>
                <ModernToggle
                  id="revToggle"
                  checked={revisionReminders}
                  onChange={(val) => saveNotificationPreference('revision_reminders', val)}
                />
              </div>

              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">Mock Test &amp; Quiz Reminders</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Weekly alerts to take simulated 65-question timed mock exams
                  </p>
                </div>
                <ModernToggle
                  id="quizToggle"
                  checked={quizAlerts}
                  onChange={(val) => saveNotificationPreference('quiz_alerts', val)}
                />
              </div>

              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">Official GATE Notifications</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Admit card releases, syllabus revisions, and exam day guidelines from IITs
                  </p>
                </div>
                <ModernToggle
                  id="examToggle"
                  checked={examUpdates}
                  onChange={(val) => saveNotificationPreference('exam_updates', val)}
                />
              </div>

              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">Daily Problem Challenge</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    One high-yield GATE PYQ delivered directly to your bell drawer every morning
                  </p>
                </div>
                <ModernToggle
                  id="dailyToggle"
                  checked={dailyChallenge}
                  onChange={(val) => saveNotificationPreference('daily_challenge', val)}
                />
              </div>

              <div className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">System &amp; Feature Releases</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Updates on newly vectorized standard textbooks and AI tutor upgrades
                  </p>
                </div>
                <ModernToggle
                  id="sysToggle"
                  checked={systemUpdates}
                  onChange={(val) => saveNotificationPreference('system_updates', val)}
                />
              </div>

            </div>
          </section>

          {/* Section: AI Tutor Intelligence Parameters */}
          <section className="bg-surface rounded-3xl border border-border shadow-soft p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">psychology</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">AI Inference Configuration</h2>
                <p className="text-xs text-text-muted mt-0.5">Current engine hyperparameters for RAG and Tutor generation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-border/60">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Foundation LLM</div>
                <div className="text-sm font-bold text-text-primary mt-1">Gemini 2.5 Flash</div>
                <div className="text-[11px] text-text-muted mt-0.5">High-speed reasoning &amp; math</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-border/60">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">RAG Similarity</div>
                <div className="text-sm font-bold text-text-primary mt-1">Cosine (Top-K = 5)</div>
                <div className="text-[11px] text-text-muted mt-0.5">PostgreSQL pgvector</div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-border/60">
                <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Vector Embedding</div>
                <div className="text-sm font-bold text-text-primary mt-1">BAAI/bge-small-en-v1.5</div>
                <div className="text-[11px] text-text-muted mt-0.5">FastEmbed ONNX CPU</div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
