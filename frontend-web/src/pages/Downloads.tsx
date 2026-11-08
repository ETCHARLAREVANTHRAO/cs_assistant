import Layout from '../components/Layout';

const DESKTOP_INSTALLER =
  'https://pub-8fa523d040cc4a56b2e0af6914ccd1cf.r2.dev/MyAssistant-Windows.zip';
const ANDROID_INSTALLER =
  'https://pub-8fa523d040cc4a56b2e0af6914ccd1cf.r2.dev/app-debug.apk';

const INSTALL_OPTIONS = [
  {
    title: 'Windows Desktop Client',
    subtitle: 'High-performance standalone desktop application with zero browser latency and offline cache.',
    icon: 'desktop_windows',
    href: DESKTOP_INSTALLER,
    action: 'Download Windows 64-bit (.zip)',
    badge: 'Desktop Pro',
  },
  {
    title: 'Android Mobile Application',
    subtitle: 'Native mobile companion APK for on-the-go revision, doubt solving, and flashcard practice.',
    icon: 'android',
    href: ANDROID_INSTALLER,
    action: 'Download Android APK (.apk)',
    badge: 'Mobile Companion',
  },
];

export default function Downloads() {
  return (
    <Layout activePage="downloads" title="Downloads">
      <div className="max-w-5xl mx-auto px-4 md:px-gutter pb-16 flex flex-col gap-8">
        
        {/* Resq.io Ambient Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-sm">install_mobile</span>
              Native Multi-Platform Ecosystem
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
              Install My Assistant Anywhere
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              Get dedicated desktop and mobile apps to study without browser tabs.
              Seamlessly synchronizes your chat sessions, bookmarks, and mock test scores.
            </p>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {INSTALL_OPTIONS.map((option) => (
            <article
              key={option.title}
              className="bg-surface border border-border rounded-3xl p-7 shadow-soft flex flex-col justify-between gap-6 hover:border-primary/40 hover:shadow-hover transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">{option.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {option.badge}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-text-primary">
                  {option.title}
                </h2>
                <p className="text-xs sm:text-sm text-text-muted mt-2 leading-relaxed">
                  {option.subtitle}
                </p>
              </div>

              <a
                href={option.href}
                download
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                <span>{option.action}</span>
              </a>
            </article>
          ))}
        </div>

      </div>
    </Layout>
  );
}
