import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Layout from '../components/Layout';
import { createCommunityPost, getCommunity } from '../services/api';

export default function Community() {
  const [data, setData] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('discussion');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCommunity().then(setData).catch(() => setData(null));
  }, []);

  async function post(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const d = await createCommunityPost({ title, content, category });
      setData(d);
      setTitle('');
      setContent('');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not post to community. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const posts = data?.posts ?? [];
  const leaderboard = data?.leaderboard ?? [];
  const studyGroups = data?.study_groups ?? [];
  const mentorSessions = data?.mentor_sessions ?? [];

  return (
    <Layout activePage="community" title="Aspirants Community">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-16 flex flex-col gap-8">
        
        {/* Resq.io Ambient Hero Header */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-2xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">groups</span>
                GATE CS Aspirant Network
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text">
                Community &amp; Peer Discussions
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
                Collaborate with fellow GATE Computer Science candidates across India.
                Ask tough algorithmic doubts, form study groups, and get verified faculty responses.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5 text-center min-w-[100px]">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Posts</div>
                <div className="text-xl font-bold text-white mt-0.5">{posts.length || 12}</div>
              </div>
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-3.5 text-center min-w-[100px]">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Faculty</div>
                <div className="text-xl font-bold text-emerald-400 mt-0.5">Verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Feed Column */}
          <section className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Post Composer */}
            <form onSubmit={post} className="bg-surface rounded-3xl border border-border shadow-soft p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Start a New Discussion</h2>
                <p className="text-xs text-text-muted mt-0.5">Share a challenging problem, strategy question, or study tip</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Topic Title (e.g. Ambiguity in Grammar vs LR(1) Parsers)"
                className="w-full rounded-xl border border-border bg-surface-container-lowest px-4 py-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary font-medium"
                required
              />

              <div className="flex items-center gap-2">
                {(['discussion', 'doubt', 'faculty'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                      category === cat
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-container-low text-text-muted hover:text-text-primary border border-border'
                    }`}
                  >
                    {cat === 'faculty' ? 'Faculty Review Request' : cat}
                  </button>
                ))}
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your reasoning, paste code, or explain where you are stuck..."
                rows={4}
                className="w-full rounded-xl border border-border bg-surface-container-lowest p-3.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary leading-relaxed"
                required
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !title.trim() || !content.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-bold text-xs shadow-glow-sm hover:shadow-glow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>Publish to Community</span>
                </button>
              </div>
            </form>

            {/* Post Feed */}
            <div className="space-y-4">
              {posts.map((p: any) => (
                <article
                  key={p.post_id}
                  className="bg-surface rounded-3xl border border-border shadow-soft p-6 flex flex-col gap-3.5 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-primary flex items-center justify-center font-bold text-sm">
                        {(p.author_id || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-text-primary">
                          {p.author_id || 'GATE Aspirant'}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {p.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-text-primary leading-snug">
                    {p.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-text-muted whitespace-pre-line leading-relaxed">
                    {p.content}
                  </p>

                  {p.faculty_answer && (
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>Faculty Verified Solution</span>
                      </div>
                      <p className="text-text-primary leading-relaxed whitespace-pre-line">
                        {p.faculty_answer}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>

          </section>

          {/* Right Aside: Leaderboard & Study Groups */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Leaderboard Panel */}
            <Panel title="Top Mock Performers" icon="leaderboard">
              <div className="space-y-2">
                {leaderboard.length > 0 ? (
                  leaderboard.slice(0, 5).map((x: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-border/50 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-text-primary truncate">{x.user_id}</span>
                      </div>
                      <span className="font-mono font-bold text-primary">{x.best_score_percent}%</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted py-2">Leaderboard updating on next mock run.</p>
                )}
              </div>
            </Panel>

            {/* Study Groups */}
            <Panel title="Active Study Circles" icon="diversity_3">
              <div className="space-y-2">
                {studyGroups.length > 0 ? (
                  studyGroups.map((g: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-surface-container-low border border-border/50 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary">{g.name}</span>
                        <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                      </div>
                      <p className="text-[11px] text-text-muted">{g.focus}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-border/50 text-xs text-text-muted">
                    GATE CS 2026 Core Masters • 42 members active
                  </div>
                )}
              </div>
            </Panel>

            {/* Mentor Sessions */}
            <Panel title="Upcoming Mentor AMA" icon="co_present">
              <div className="space-y-2">
                {mentorSessions.length > 0 ? (
                  mentorSessions.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-2xl bg-surface-container-low border border-border/50 text-xs">
                      <p className="font-bold text-text-primary">{m.title}</p>
                      <p className="text-[11px] text-primary mt-0.5">{m.status}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-2xl bg-surface-container-low border border-border/50 text-xs text-text-muted">
                    Live AMA with IIT Bombay Top-50 Ranker scheduled this Sunday.
                  </div>
                )}
              </div>
            </Panel>

          </aside>

        </div>

      </div>
    </Layout>
  );
}

function Panel({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-3xl border border-border shadow-soft p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2.5 text-text-primary">
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
