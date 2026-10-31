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
  useEffect(() => { getCommunity().then(setData).catch(() => setData(null)); }, []);
  async function post(e: FormEvent) { e.preventDefault(); setError(''); try { const d = await createCommunityPost({ title, content, category }); setData(d); setTitle(''); setContent(''); } catch (err: any) { setError(err?.response?.data?.detail || 'Could not post.'); } }
  return <Layout activePage="community" title="Community"><div className="p-gutter max-w-container-max mx-auto pb-32 space-y-5">
    <h2 className="font-headline-lg text-headline-lg text-text-primary">Community</h2>
    <div className="grid lg:grid-cols-12 gap-gutter items-start"><section className="lg:col-span-8 space-y-4">
      <form onSubmit={post} className="bg-surface rounded-lg border border-border shadow-soft p-5 space-y-3"><h3 className="font-headline-sm">Start Discussion</h3>{error && <p className="text-error">{error}</p>}<input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3" /><select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3"><option value="discussion">Discussion</option><option value="doubt">Doubt</option><option value="faculty">Faculty answer request</option></select><textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Write your question or idea" rows={4} className="w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3" /><button className="bg-primary text-white rounded-lg px-4 py-2">Post</button></form>
      {(data?.posts ?? []).map((p: any) => <article key={p.post_id} className="bg-surface rounded-lg border border-border shadow-soft p-5"><div className="flex gap-2 mb-2"><span className="rounded-md bg-primary/10 text-primary px-2 py-1 text-sm">{p.category}</span><span className="text-text-muted text-sm">{p.author_id}</span></div><h3 className="font-headline-sm text-text-primary">{p.title}</h3><p className="mt-2 whitespace-pre-line">{p.content}</p><p className="mt-3 rounded-lg bg-surface-container-lowest p-3 text-text-muted">{p.faculty_answer}</p></article>)}
    </section><aside className="lg:col-span-4 space-y-4"><Panel title="Leaderboard" rows={(data?.leaderboard ?? []).map((x: any) => `${x.user_id}: ${x.best_score_percent}% (${x.attempts} attempts)`)} /><Panel title="Study Groups" rows={(data?.study_groups ?? []).map((x: any) => `${x.name}: ${x.focus}`)} /><Panel title="Mentor Sessions" rows={(data?.mentor_sessions ?? []).map((x: any) => `${x.title} - ${x.status}`)} /><Panel title="Success Stories" rows={data?.success_stories ?? []} /></aside></div>
  </div></Layout>;
}
function Panel({ title, rows }: { title: string; rows: string[] }) { return <section className="bg-surface rounded-lg border border-border shadow-soft p-5"><h3 className="font-headline-sm mb-3">{title}</h3><div className="space-y-2">{(rows.length ? rows : ['No data yet.']).map((r) => <p key={r} className="rounded-lg bg-surface-container-lowest p-3 text-sm">{r}</p>)}</div></section>; }

