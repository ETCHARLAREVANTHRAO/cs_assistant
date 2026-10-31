import Layout from '../components/Layout';

const CHART_BARS = [20, 30, 25, 50, 70, 45, 35, 15, 60, 85, 100, 75, 40, 30];

export default function UsageDashboard() {
  return (
    <Layout activePage="usage" title="Usage Dashboard">
      <div className="max-w-container-max mx-auto w-full px-4 md:px-gutter pb-24">
        <div className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Usage Overview</h2>
          <p className="text-text-muted font-body-md text-body-md">
            Monitor your study credits and API consumption for the current billing cycle.
          </p>
        </div>
        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg">
          <div className="bg-surface rounded-xl p-6 shadow-soft border border-border hover:shadow-hover transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <span className="material-symbols-outlined">memory</span>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container-high px-2 py-1 rounded-full text-text-muted">
                75% of Quota
              </span>
            </div>
            <p className="text-text-muted font-label-md text-label-md mb-1">Tokens Used</p>
            <div className="flex items-baseline gap-2">
              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                1.2M
              </h3>
              <span className="text-success font-label-sm text-label-sm flex items-center">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> 12%
              </span>
            </div>
            <div className="w-full bg-surface-variant h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
          <div className="bg-surface rounded-xl p-6 shadow-soft border border-border hover:shadow-hover transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
                <span className="material-symbols-outlined">library_books</span>
              </div>
              <span className="font-label-sm text-label-sm bg-surface-container-high px-2 py-1 rounded-full text-text-muted">
                PDF/PPT
              </span>
            </div>
            <p className="text-text-muted font-label-md text-label-md mb-1">Documents Indexed</p>
            <div className="flex items-baseline gap-2">
              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-secondary transition-colors">
                143
              </h3>
            </div>
            <p className="font-label-sm text-label-sm text-text-muted mt-4">Across 8 Subjects</p>
          </div>
          <div className="bg-surface rounded-xl p-6 shadow-soft border border-border hover:shadow-hover transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-success/10 rounded-lg text-success">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              <span className="font-label-sm text-label-sm bg-success/10 px-2 py-1 rounded-full text-success">On Track</span>
            </div>
            <p className="text-text-muted font-label-md text-label-md mb-1">Quizzes Taken</p>
            <div className="flex items-baseline gap-2">
              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-success transition-colors">
                47
              </h3>
              <span className="text-success font-label-sm text-label-sm flex items-center">
                <span className="material-symbols-outlined text-[14px]">trending_up</span> 5
              </span>
            </div>
            <p className="font-label-sm text-label-sm text-text-muted mt-4">This Month</p>
          </div>
          <div className="bg-surface rounded-xl p-6 shadow-soft border border-border hover:shadow-hover transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-tertiary/10 rounded-lg text-tertiary">
                <span className="material-symbols-outlined">timer</span>
              </div>
            </div>
            <p className="text-text-muted font-label-md text-label-md mb-1">Full Mock Tests</p>
            <div className="flex items-baseline gap-2">
              <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-tertiary transition-colors">
                8
              </h3>
            </div>
            <p className="font-label-sm text-label-sm text-text-muted mt-4">Avg Score: 68/100</p>
          </div>
        </div>
        {/* Charts and Tables Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Usage Over Time Chart Area */}
          <div className="lg:col-span-2 bg-surface rounded-xl shadow-soft border border-border p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Usage Over Time</h3>
                <p className="text-text-muted font-label-sm text-label-sm mt-1">Token consumption (Last 30 Days)</p>
              </div>
              <select className="bg-surface-container border-none rounded-lg font-label-sm text-label-sm text-on-surface py-2 pl-3 pr-8 focus:ring-2 focus:ring-primary">
                <option>Last 30 Days</option>
                <option>This Week</option>
                <option>All Time</option>
              </select>
            </div>
            <div className="flex-1 w-full bg-surface-container-lowest rounded-lg border border-surface-variant relative min-h-[300px] flex items-end p-4 gap-2">
              <div className="w-full flex justify-between items-end h-[250px] gap-1">
                {CHART_BARS.map((h, i) => (
                  <div
                    key={i}
                    className="w-full bg-primary/40 hover:bg-primary/70 rounded-t-sm transition-colors group relative cursor-pointer"
                    style={{ height: `${h}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity">
                      {h * 400} Tokens
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Feature Breakdown Table */}
          <div className="bg-surface rounded-xl shadow-soft border border-border p-6 flex flex-col">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Feature Breakdown</h3>
            <p className="text-text-muted font-label-sm text-label-sm mb-6">Distribution of study activities.</p>
            <div className="space-y-4">
              {[
                { icon: 'chat', iconWrap: 'bg-primary/10 text-primary', name: 'Chat AI', desc: 'Concept Explanations', pct: '45%', tks: '540k tks' },
                { icon: 'quiz', iconWrap: 'bg-success/10 text-success', name: 'Quiz Engine', desc: 'Practice Tests', pct: '30%', tks: '360k tks' },
                { icon: 'search', iconWrap: 'bg-secondary/10 text-secondary', name: 'Semantic Search', desc: 'Document RAG', pct: '20%', tks: '240k tks' },
                { icon: 'more_horiz', iconWrap: 'bg-outline-variant/30 text-text-muted', name: 'Other', desc: 'System tasks', pct: '5%', tks: '60k tks' },
              ].map((row) => (
                <div key={row.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${row.iconWrap}`}>
                      <span className="material-symbols-outlined text-[18px]">{row.icon}</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">{row.name}</p>
                      <p className="font-label-sm text-label-sm text-text-muted">{row.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-label-md text-label-md text-on-surface">{row.pct}</p>
                    <p className="font-label-sm text-label-sm text-text-muted font-code">{row.tks}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <button className="w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md rounded-lg transition-colors">
                Export Detailed Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
