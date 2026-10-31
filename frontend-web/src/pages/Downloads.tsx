import Layout from '../components/Layout';

const DESKTOP_INSTALLER =
  'https://pub-8fa523d040cc4a56b2e0af6914ccd1cf.r2.dev/MyAssistant-Windows.zip';
const ANDROID_INSTALLER =
  'https://pub-8fa523d040cc4a56b2e0af6914ccd1cf.r2.dev/app-debug.apk';

const INSTALL_OPTIONS = [
  {
    title: 'Desktop App',
    subtitle: 'Windows portable app with Render backend mode and bundled local AI mode.',
    icon: 'desktop_windows',
    href: DESKTOP_INSTALLER,
    action: 'Download for Windows',
  },
  {
    title: 'Mobile App',
    subtitle: 'Android APK package for installing the mobile app on your phone.',
    icon: 'android',
    href: ANDROID_INSTALLER,
    action: 'Install for Android',
  },
];

export default function Downloads() {
  return (
    <Layout activePage="downloads" title="Downloads">
      <div className="min-h-full px-gutter py-stack-lg bg-background text-on-background">
        <div className="max-w-5xl mx-auto space-y-stack-lg">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary">
              Install my_assistant
            </h1>
            <p className="mt-2 max-w-2xl font-body-md text-body-md text-text-muted">
              Choose the app for this device. Desktop uses the local backend on your computer;
              Android will use the mobile package when the APK is built.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INSTALL_OPTIONS.map((option) => (
              <article
                key={option.title}
                className="bg-surface border border-border rounded-lg p-5 shadow-soft flex flex-col gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[28px]">{option.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-headline-sm text-headline-sm text-text-primary">
                      {option.title}
                    </h2>
                    <p className="mt-1 font-body-md text-body-md text-text-muted">
                      {option.subtitle}
                    </p>
                  </div>
                </div>

                <a
                  className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-white shadow-soft hover:bg-primary-container transition-colors"
                  href={option.href}
                  download
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>{option.action}</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
