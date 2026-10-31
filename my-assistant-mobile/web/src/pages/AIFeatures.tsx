import { useState } from 'react';
import type { FormEvent } from 'react';
import Layout from '../components/Layout';
import { aiExamMentor, aiQuizGenerator, aiRevisionPlan, aiTutor } from '../services/api';

type ToolKey = 'tutor' | 'quiz' | 'mentor' | 'revision';

export default function AIFeatures() {
  const [tool, setTool] = useState<ToolKey>('tutor');
  const [topic, setTopic] = useState('Operating Systems deadlocks');
  const [level, setLevel] = useState('beginner');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [concern, setConcern] = useState('I am weak in DBMS and OS. How should I improve?');
  const [days, setDays] = useState(7);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = tool === 'tutor'
        ? await aiTutor({ topic, level })
        : tool === 'quiz'
          ? await aiQuizGenerator({ topic, count, difficulty })
          : tool === 'mentor'
            ? await aiExamMentor({ concern })
            : await aiRevisionPlan({ days, target: topic });
      setAnswer(res.answer);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'AI request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout activePage="ai" title="AI Features">
      <div className="p-gutter max-w-container-max w-full mx-auto pb-32">
        <h2 className="font-headline-lg text-headline-lg text-text-primary mb-2">AI Features</h2>
        <p className="font-body-md text-body-md text-text-muted mb-stack-lg">Tutor, quiz generator, exam mentor, wrong-option explanation, and revision planning.</p>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <aside className="lg:col-span-3 bg-surface rounded-lg border border-border shadow-soft p-4 grid gap-2">
            <Tab active={tool === 'tutor'} icon="school" label="AI Tutor" onClick={() => setTool('tutor')} />
            <Tab active={tool === 'quiz'} icon="quiz" label="Quiz Generator" onClick={() => setTool('quiz')} />
            <Tab active={tool === 'mentor'} icon="psychology" label="Exam Mentor" onClick={() => setTool('mentor')} />
            <Tab active={tool === 'revision'} icon="event_repeat" label="Revision Plans" onClick={() => setTool('revision')} />
          </aside>
          <section className="lg:col-span-9 space-y-4">
            <form onSubmit={run} className="bg-surface rounded-lg border border-border shadow-soft p-5 space-y-4">
              {(tool === 'tutor' || tool === 'quiz' || tool === 'revision') && <Input label="Topic / Target" value={topic} onChange={setTopic} />}
              {tool === 'tutor' && <Input label="Level" value={level} onChange={setLevel} />}
              {tool === 'quiz' && <div className="grid grid-cols-2 gap-3"><Input label="Count" type="number" value={String(count)} onChange={(v) => setCount(Number(v))} /><Input label="Difficulty" value={difficulty} onChange={setDifficulty} /></div>}
              {tool === 'mentor' && <TextArea label="Concern" value={concern} onChange={setConcern} />}
              {tool === 'revision' && <Input label="Days" type="number" value={String(days)} onChange={(v) => setDays(Number(v))} />}
              <button disabled={loading} className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-5 py-3 font-label-md text-label-md disabled:opacity-50"><span className="material-symbols-outlined">auto_awesome</span>Generate</button>
            </form>
            {error && <div className="rounded-lg border border-error/30 bg-error-container/30 p-4 text-on-error-container">{error}</div>}
            {answer && <div className="bg-surface rounded-lg border border-border shadow-soft p-5 whitespace-pre-line font-body-md text-body-md text-on-surface">{answer}</div>}
          </section>
        </div>
      </div>
    </Layout>
  );
}

function Tab({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button onClick={onClick} className={active ? 'flex items-center gap-2 rounded-lg bg-primary text-white px-3 py-2.5' : 'flex items-center gap-2 rounded-lg text-on-surface-variant hover:bg-surface-container px-3 py-2.5'}><span className="material-symbols-outlined text-sm">{icon}</span>{label}</button>;
}
function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block"><span className="font-label-md text-label-md text-text-primary">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="font-label-md text-label-md text-text-primary">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary" /></label>; }

