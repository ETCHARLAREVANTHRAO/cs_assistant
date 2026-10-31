import Layout from '../components/Layout';

export default function MockTestResults() {
  return (
    <Layout activePage="quiz" title="Mock Test Results: CS Full Syllabus #3">
      <div className="max-w-container-max mx-auto space-y-8 px-4 md:px-gutter lg:px-8 pb-12">
        {/* Hero Section: Score & Percentile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-primary rounded-xl shadow-sm p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[240px]">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary-fixed-dim">Final Score</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h2 className="font-headline-lg text-[64px] font-bold leading-none">68.33</h2>
                  <span className="font-body-lg text-body-lg text-primary-fixed-dim">/ 100</span>
                </div>
                <p className="font-body-md text-body-md mt-4 text-primary-fixed-dim max-w-md">
                  Excellent performance! You are currently projected to score in the top tier based on historical data.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center min-w-[200px]">
                <span className="font-label-sm text-label-sm text-primary-fixed-dim">Est. Percentile</span>
                <h3 className="font-headline-lg text-headline-lg font-bold mt-1">98.5%</h3>
                <div className="mt-4 inline-flex items-center gap-1 text-success bg-success/20 px-3 py-1 rounded-full font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  +2.1% from last test
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-rows-2 gap-6">
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Total Attempted</span>
                <span className="material-symbols-outlined text-outline">fact_check</span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md font-bold text-text-primary">54</span>
                <span className="font-body-md text-body-md text-text-muted">/ 65 Qs</span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '83%' }} />
              </div>
            </div>
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Accuracy Rate</span>
                <span className="material-symbols-outlined text-outline">my_location</span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md font-bold text-text-primary">82%</span>
              </div>
              <div className="mt-2 text-sm text-text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" /> 44 Correct
                <span className="w-2 h-2 rounded-full bg-error ml-2" /> 10 Incorrect
              </div>
            </div>
          </div>
        </div>
        {/* Middle Section: Chart & Sectional Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Historical Cutoff Comparison</h3>
              <button className="text-secondary hover:text-secondary-container transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="flex-1 relative min-h-[250px] flex items-end pt-8">
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-text-muted">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
              <div className="absolute left-8 right-0 top-0 bottom-8 flex flex-col justify-between">
                <div className="border-t border-border w-full" />
                <div className="border-t border-border w-full" />
                <div className="border-t border-border w-full" />
                <div className="border-t border-border w-full" />
                <div className="border-t border-border w-full" />
              </div>
              <div
                className="absolute left-8 right-0 bottom-8 w-full border-t-2 border-dashed border-primary z-10"
                style={{ bottom: 'calc(68.33% + 32px)' }}
              >
                <div className="absolute right-0 -top-6 bg-primary text-white text-xs px-2 py-1 rounded font-label-sm">
                  Your Score: 68.33
                </div>
              </div>
              <div className="relative z-0 w-full flex justify-around items-end h-full ml-8 pb-8">
                {[
                  { year: '19', pct: 29.5 },
                  { year: '20', pct: 28.5 },
                  { year: '21', pct: 26.1 },
                  { year: '22', pct: 25.0 },
                  { year: '23', pct: 32.5 },
                ].map((bar) => (
                  <div key={bar.year} className="w-12 flex flex-col items-center gap-2 group relative">
                    <div className="w-full bg-surface-container-highest rounded-t-sm" style={{ height: `${bar.pct}%` }} />
                    <span className="absolute -bottom-6 text-xs text-text-muted">'{bar.year}</span>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-inverse-surface text-inverse-on-surface text-xs px-2 py-1 rounded transition-opacity">
                      {bar.pct}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
            <h3 className="font-headline-sm text-headline-sm text-text-primary mb-6">Section-wise Performance</h3>
            <div className="space-y-6">
              {[
                { label: 'General Aptitude', score: '12.0 / 15.0', pass: 80, fail: 10, acc: 88, time: '18m' },
                { label: 'Core CS Subjects', score: '45.33 / 70.0', pass: 64, fail: 20, acc: 76, time: '124m' },
                { label: 'Engineering Math', score: '11.0 / 15.0', pass: 73, fail: 15, acc: 83, time: '38m' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label-md text-label-md text-text-primary">{row.label}</span>
                    <span className="font-code text-code text-text-muted">{row.score}</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden flex">
                    <div className="bg-success h-full" style={{ width: `${row.pass}%` }} />
                    <div className="bg-error h-full" style={{ width: `${row.fail}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-text-muted font-label-sm">
                    <span>Acc: {row.acc}%</span>
                    <span>Time: {row.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span className="w-3 h-3 rounded-full bg-success" /> Marks Gained
                <span className="w-3 h-3 rounded-full bg-error ml-3" /> Negative Marks
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Section: Actionable Insights & Review */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-error-container/20 rounded-xl shadow-sm border border-error/20 p-6">
            <div className="flex items-center gap-2 mb-4 text-error">
              <span className="material-symbols-outlined">warning</span>
              <h3 className="font-headline-sm text-headline-sm font-semibold">Priority Focus Areas</h3>
            </div>
            <p className="font-body-md text-body-md text-text-muted mb-4">Based on high error rates and time spent in this test.</p>
            <ul className="space-y-3">
              {[
                { label: 'Computer Networks', count: '4 Incorrect' },
                { label: 'Theory of Computation', count: '3 Incorrect' },
                { label: 'Calculus (Eng. Math)', count: '2 Incorrect' },
              ].map((t) => (
                <li key={t.label} className="bg-surface p-3 rounded-lg border border-border flex items-center justify-between">
                  <span className="font-label-md text-label-md">{t.label}</span>
                  <span className="bg-error/10 text-error px-2 py-1 rounded text-xs font-label-sm">{t.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2 bg-surface rounded-xl shadow-sm border border-border p-6 flex flex-col justify-center items-center text-center">
            <span className="material-symbols-outlined text-4xl text-secondary mb-4">rate_review</span>
            <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">Review Your Answers</h3>
            <p className="font-body-md text-body-md text-text-muted mb-6 max-w-md">
              Deep dive into the 10 questions you answered incorrectly and the 11 questions you left unattempted to
              understand the concepts.
            </p>
            <div className="flex gap-4">
              <button className="bg-primary text-white font-label-md text-label-md px-6 py-3 rounded-lg shadow-sm hover:bg-primary-container transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined">play_arrow</span>
                Start Review
              </button>
              <button className="bg-secondary/10 text-secondary font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-secondary/20 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined">download</span>
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
