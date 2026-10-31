import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  notificationsGetPreferences,
  notificationsUpdatePreferences,
  type NotificationPreferences,
} from '../services/api';

type FontSize = 'small' | 'default' | 'large';

function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="relative inline-block w-12 mr-2 align-middle select-none">
      <input
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer opacity-0"
        id={id}
        type="checkbox"
      />
      <label className="toggle-label block overflow-hidden h-6 rounded-full cursor-pointer" htmlFor={id} />
    </div>
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
    notificationsGetPreferences().then((prefs) => {
      setRevisionReminders(prefs.revision_reminders);
      setQuizAlerts(prefs.quiz_alerts);
      setExamUpdates(prefs.exam_updates);
      setSystemUpdates(prefs.system_updates);
      setDailyChallenge(prefs.daily_challenge);
    }).catch(() => setNotificationStatus('Could not load notification preferences.'));
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
      setNotificationStatus('Saved.');
    } catch {
      setNotificationStatus('Could not save notification preference.');
    }
  }

  return (
    <Layout activePage="settings">
      <div className="max-w-4xl mx-auto w-full pb-12 px-4 md:px-gutter">
        {/* Page Header */}
        <div className="mb-stack-lg">
          <h1 className="font-headline-lg text-headline-lg text-text-primary mb-2">Settings</h1>
          <p className="font-body-md text-body-md text-text-muted">
            Manage your profile, preferences, and account settings.
          </p>
        </div>
        <div className="space-y-stack-lg">
          {/* Section: Appearance */}
          <section id="appearance">
            <h2 className="font-headline-sm text-headline-sm text-text-primary mb-stack-md flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">palette</span>
              Appearance
            </h2>
            <div className="bg-surface rounded-xl shadow-soft border border-border overflow-hidden transition-all hover:shadow-hover">
              {/* Toggle Row */}
              <div className="p-6 flex items-center justify-between border-b border-border">
                <div>
                  <div className="font-label-md text-label-md text-text-primary font-semibold mb-1">
                    Dark Mode
                  </div>
                  <div className="font-body-md text-body-md text-text-muted">
                    Reduce glare for late-night study sessions.
                  </div>
                </div>
                <ToggleSwitch id="darkModeToggle" checked={darkMode} onChange={setDarkMode} />
              </div>
              {/* Font Size */}
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-label-md text-label-md text-text-primary font-semibold mb-1">
                    Interface Text Size
                  </div>
                  <div className="font-body-md text-body-md text-text-muted">
                    Adjust for better readability of complex formulas.
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1">
                  {(['small', 'default', 'large'] as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={
                        fontSize === size
                          ? 'px-3 py-1.5 rounded-md font-label-md text-label-md bg-surface text-primary shadow-sm font-semibold transition-colors capitalize'
                          : 'px-3 py-1.5 rounded-md font-label-md text-label-md text-text-muted hover:text-text-primary hover:bg-surface transition-colors capitalize'
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
          {/* Section: Notifications */}
          <section id="notifications">
            <h2 className="font-headline-sm text-headline-sm text-text-primary mb-stack-md flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              Notifications
            </h2>
            <div className="bg-surface rounded-xl shadow-soft border border-border overflow-hidden transition-all hover:shadow-hover divide-y divide-border">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-label-md text-label-md text-text-primary font-semibold mb-1">
                    Revision Reminders
                  </div>
                  <div className="font-body-md text-body-md text-text-muted">
                    Spaced repetition alerts for weak topics.
                  </div>
                </div>
                <ToggleSwitch id="revToggle" checked={revisionReminders} onChange={(value) => saveNotificationPreference('revision_reminders', value)} />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-label-md text-label-md text-text-primary font-semibold mb-1">
                    Weekly Quiz Alerts
                  </div>
                  <div className="font-body-md text-body-md text-text-muted">
                    Reminders to take scheduled practice tests.
                  </div>
                </div>
                <ToggleSwitch id="quizToggle" checked={quizAlerts} onChange={(value) => saveNotificationPreference('quiz_alerts', value)} />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-label-md text-label-md text-text-primary font-semibold mb-1">
                    Exam Updates
                  </div>
                  <div className="font-body-md text-body-md text-text-muted">
                    Upcoming GATE dates and important exam notices.
                  </div>
                </div>
                <ToggleSwitch id="examToggle" checked={examUpdates} onChange={(value) => saveNotificationPreference('exam_updates', value)} />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-label-md text-label-md text-text-primary font-semibold mb-1">
                    System Updates
                  </div>
                  <div className="font-body-md text-body-md text-text-muted">
                    News about new study materials or features.
                  </div>
                </div>
                <ToggleSwitch id="sysToggle" checked={systemUpdates} onChange={(value) => saveNotificationPreference('system_updates', value)} />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-label-md text-label-md text-text-primary font-semibold mb-1">
                    Daily Challenge
                  </div>
                  <div className="font-body-md text-body-md text-text-muted">
                    One small study target in the notification bell each day.
                  </div>
                </div>
                <ToggleSwitch id="dailyToggle" checked={dailyChallenge} onChange={(value) => saveNotificationPreference('daily_challenge', value)} />
              </div>
            </div>
            {notificationStatus && <p className="font-body-sm text-body-sm text-text-muted mt-3">{notificationStatus}</p>}
          </section>
        </div>
      </div>
    </Layout>
  );
}
