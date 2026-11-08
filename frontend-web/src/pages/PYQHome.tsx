import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  pyqListPapers,
  pyqListAttempts,
  type PYQPaperSummary,
  type PYQAttemptSummary,
} from '../services/api';

export default function PYQHome() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PYQPaperSummary[]>([]);
  const [attempts, setAttempts] = useState<PYQAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  useEffect(() => {
    Promise.all([pyqListPapers(), pyqListAttempts()])
      .then(([p, a]) => {
        setPapers(p);
        setAttempts(a);
      })
      .catch(() => setError('Could not load practice tests. Please refresh to try again.'))
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    const list = Array.from(new Set(papers.map((p) => {
      const match = p.title.match(/20\d\d/);
      return match ? match[0] : '';
    }).filter(Boolean))).sort().reverse();
    return ['All', ...list];
  }, [papers]);

  const filteredPapers = useMemo(() => {
    if (selectedYear === 'All') return papers;
    return papers.filter((p) => p.title.includes(selectedYear));
  }, [papers, selectedYear]);

  return (
    <Layout activePage="pyq" title="GATE Previous Year Papers (2012–2026)">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Resq Beam Exam Hall Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-indigo-200">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                <span>Official TCS iON Exam Simulation Interface</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text tracking-tight">
                Full-Length Reconstructed GATE CS Papers
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Authentic question palettes, virtual numerical calculators, multi-select questions (MSQ), single-choice (MCQ), and numerical answer type (NAT) with strict negative marking.
              </p>
            </div>

            {/* Quick Stats Block */}
            <div className="flex items-center gap-3">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
                <p className="text-2xl font-black text-white">{papers.length}</p>
                <p className="text-[11px] text-indigo-300">Available Papers</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center min-w-[120px]">
                <p className="text-2xl font-black text-emerald-400">{attempts.length}</p>
                <p className="text-[11px] text-slate-300">Tests Attempted</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Year Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Filter by Year:</span>
          {years.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedYear === yr
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#0f111e] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {yr === 'All' ? 'All Papers' : `GATE ${yr}`}
            </button>
          ))}
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-indigo-500 animate-spin">progress_activity</span>
            <p className="text-xs text-slate-400">Loading verified papers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPapers.map((paper) => (
              <div
                key={paper.paper_id}
                className="group relative rounded-3xl p-6 bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <span className="material-symbols-outlined text-[22px]">history_edu</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                      Verified Key
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {paper.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {paper.total_questions} Questions
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        {paper.total_marks} Marks
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                        {paper.duration_minutes} Mins
                      </span>
                    </div>
                  </div>

                  {/* Section Breakdown */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    {paper.sections.map((s) => (
                      <div key={s.section} className="flex items-center justify-between">
                        <span>{s.section_title}</span>
                        <span className="font-mono text-[11px] text-slate-500 font-semibold">
                          {s.question_count} Qs • {s.total_marks}M
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    onClick={() => navigate(`/pyq/${paper.paper_id}/instructions`)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Begin Simulated Test</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past Attempts Section */}
        {attempts.length > 0 && (
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Your Past Test Performance &amp; Attempt Logs
                </h3>
                <p className="text-xs text-slate-400">
                  Click any past session to review answer sheets, question-by-question explanations, and negative marks analysis.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
              {attempts.map((a) => {
                const scorePercent = Math.round((a.total_marks / a.max_marks) * 100);
                return (
                  <button
                    key={a.attempt_id}
                    onClick={() => navigate(`/pyq/result/${a.attempt_id}`)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {scorePercent}%
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {a.paper_title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Submitted on {new Date(a.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                          {a.total_marks}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold"> / {a.max_marks}</span>
                        <p className="text-[10px] text-slate-400">Marks Secured</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all text-[20px]">
                        chevron_right
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
