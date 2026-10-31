import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getRevision } from '../services/api';

export default function Revision() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getRevision().then(setData).catch(() => setData(null)); }, []);
  if (!data) return <Layout activePage="revision" title="Revision"><div className="p-gutter">Loading...</div></Layout>;
  return <Layout activePage="revision" title="Revision"><div className="p-gutter max-w-container-max mx-auto pb-32 space-y-5">
    <h2 className="font-headline-lg text-headline-lg text-text-primary">Revision</h2>
    <Plan title="7-Day Revision Plan" rows={data['7_day']} />
    <Plan title="30-Day Crash Course" rows={data['30_day']} />
    <Plan title="Last-Minute Notes" rows={data.last_minute} />
    <section className="bg-surface rounded-lg border border-border shadow-soft p-5"><h3 className="font-headline-sm text-headline-sm mb-4">Most Repeated PYQs</h3><div className="grid md:grid-cols-2 gap-3">{data.most_repeated_pyqs.map((x: any) => <div key={x.topic} className="rounded-lg bg-surface-container-lowest p-3"><p className="font-label-md">{x.topic}</p><p className="text-text-muted">{x.question_count} questions, {x.total_marks} marks</p></div>)}</div></section>
    <Plan title="Personalized Focus" rows={data.personalized_focus} />
  </div></Layout>;
}
function Plan({ title, rows }: { title: string; rows: string[] }) { return <section className="bg-surface rounded-lg border border-border shadow-soft p-5"><h3 className="font-headline-sm text-headline-sm mb-4">{title}</h3><div className="space-y-2">{(rows?.length ? rows : ['Take one attempt to generate personalized revision.']).map((row) => <p key={row} className="rounded-lg bg-surface-container-lowest p-3">{row}</p>)}</div></section>; }
