import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getExamInfo } from '../services/api';

export default function ExamInfo() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getExamInfo().then(setData).catch(() => setData(null));
  }, []);

  return (
    <Layout activePage="exam-info" title="Official GATE Info">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-16 flex flex-col gap-8">
        
        {/* Resq.io Ambient Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Official Examination Information
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                GATE CS Information &amp; Admissions
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
                Organizing Institute: <strong className="text-white">{data?.organizer || 'IIT Organizing Institute'}</strong> &bull; Complete guide to application dates, question formats, IIT M.Tech cutoffs, and PSU recruitment.
              </p>
            </div>

            {data?.official_source && (
              <a
                href={data.official_source}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-2 self-start lg:self-auto"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Official Portal
              </a>
            )}
          </div>
        </div>

        {!data ? (
          <div className="flex items-center gap-3 text-text-muted text-sm py-12">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading exam information...
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Important Dates */}
            {data.important_dates && data.important_dates.length > 0 && (
              <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">event</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-primary">Important Examination Deadlines</h2>
                    <p className="text-xs text-text-muted mt-0.5">Key dates for registration, admit cards, and results</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.important_dates.map((d: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-surface-container-low border border-border/50 flex flex-col justify-between gap-2">
                      <span className="text-xs font-semibold text-text-muted">{d.label}</span>
                      <span className="text-sm font-extrabold text-primary font-mono">{d.date}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Notifications & Announcements */}
            {data.notifications && data.notifications.length > 0 && (
              <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">campaign</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-primary">Latest IIT Announcements</h2>
                    <p className="text-xs text-text-muted mt-0.5">Official releases and updates from the organizing committee</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.notifications.map((item: string, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-surface-container-low border border-border/50 text-xs text-text-primary flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">info</span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Exam Pattern & Cutoffs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Pattern */}
              {data.exam_pattern && (
                <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">fact_check</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text-primary">Exam Structure &amp; Pattern</h2>
                      <p className="text-xs text-text-muted mt-0.5">3 Hours &bull; 65 Questions &bull; 100 Marks</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {data.exam_pattern.map((item: string, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-surface-container-low border border-border/50 text-xs text-text-primary flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-primary text-sm mt-0.5 shrink-0">check_circle</span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Cutoffs */}
              {data.cutoffs && (
                <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">analytics</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text-primary">Historic Qualifying Cutoffs</h2>
                      <p className="text-xs text-text-muted mt-0.5">Category-wise marks required to qualify</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {data.cutoffs.map((item: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-surface-container-low border border-border/50 flex items-center justify-between text-xs">
                        <span className="font-bold text-text-primary">{item.category}</span>
                        <span className="text-text-muted font-medium">{item.note}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* PSU Recruitment & M.Tech Admissions Guidance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {data.psu_information && (
                <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">business_center</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text-primary">PSU Recruitment via GATE</h2>
                      <p className="text-xs text-text-muted mt-0.5">IOCL, ONGC, BARC, DRDO, ISRO, and NTPC opportunities</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {data.psu_information.map((item: string, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-surface-container-low border border-border/50 text-xs text-text-primary leading-relaxed">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.mtech_guidance && (
                <section className="bg-surface rounded-3xl border border-border shadow-soft p-6 sm:p-7 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">school</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text-primary">M.Tech Admissions &amp; COAP</h2>
                      <p className="text-xs text-text-muted mt-0.5">IITs, IISc, NITs, and CCMT counselling roadmap</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {data.mtech_guidance.map((item: string, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-surface-container-low border border-border/50 text-xs text-text-primary leading-relaxed">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}
