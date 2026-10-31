import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getExamInfo } from '../services/api';

export default function ExamInfo() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getExamInfo().then(setData).catch(() => setData(null)); }, []);
  return <Layout activePage="exam-info" title="Exam Info"><Page data={data} /></Layout>;
}
function Page({ data }: { data: any }) {
  if (!data) return <div className="p-gutter">Loading...</div>;
  return <div className="p-gutter max-w-container-max mx-auto pb-32 space-y-5">
    <div><h2 className="font-headline-lg text-headline-lg text-text-primary">GATE 2027</h2><p className="text-text-muted mt-2">Organizer: {data.organizer}. Source: <a className="text-primary" href={data.official_source} target="_blank">official website</a></p></div>
    <Grid title="Notifications" items={data.notifications} icon="campaign" />
    <section className="bg-surface rounded-lg border border-border shadow-soft p-5"><h3 className="font-headline-sm text-headline-sm mb-4">Important Dates</h3><div className="grid md:grid-cols-2 gap-3">{data.important_dates.map((d: any) => <div key={d.label} className="rounded-lg bg-surface-container-lowest p-3"><p className="font-label-md">{d.label}</p><p className="text-primary font-bold">{d.date}</p></div>)}</div></section>
    <Grid title="Exam Pattern" items={data.exam_pattern} icon="fact_check" />
    <Grid title="Cutoffs" items={data.cutoffs.map((x: any) => `${x.category}: ${x.note}`)} icon="analytics" />
    <Grid title="College Predictor" items={data.college_predictor} icon="account_balance" />
    <Grid title="PSU Information" items={data.psu_information} icon="business_center" />
    <Grid title="M.Tech Guidance" items={data.mtech_guidance} icon="school" />
  </div>;
}
function Grid({ title, items, icon }: { title: string; items: string[]; icon: string }) { return <section className="bg-surface rounded-lg border border-border shadow-soft p-5"><h3 className="font-headline-sm text-headline-sm mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-primary">{icon}</span>{title}</h3><div className="grid md:grid-cols-2 gap-3">{items.map((item) => <p key={item} className="rounded-lg bg-surface-container-lowest p-3 text-on-surface">{item}</p>)}</div></section>; }
