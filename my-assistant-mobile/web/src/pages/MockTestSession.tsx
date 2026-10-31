import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  pyqGetPracticeTaxonomy,
  pyqListPapers,
  pyqStartAttempt,
  pyqStartPractice,
  type PracticeTaxonomyResponse,
  type PYQPaperSummary,
} from '../services/api';

const EMPTY_TAXONOMY: PracticeTaxonomyResponse = {
  subjects: [],
  chapters: [],
  topics: [],
  difficulty: [],
  question_types: [],
};

export default function MockTestSession() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PYQPaperSummary[]>([]);
  const [taxonomy, setTaxonomy] = useState<PracticeTaxonomyResponse>(EMPTY_TAXONOMY);
  const [sectionSubject, setSectionSubject] = useState('');
  const [starting, setStarting] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([pyqListPapers(), pyqGetPracticeTaxonomy()])
      .then(([paperData, taxonomyData]) => {
        setPapers(paperData);
        setTaxonomy(taxonomyData);
        setSectionSubject(taxonomyData.subjects[0]?.name ?? '');
      })
      .catch(() => setError('Could not load mock test options. Please refresh to try again.'))
      .finally(() => setLoading(false));
  }, []);

  async function startFullPaper(paperId: string) {
    setStarting(paperId);
    setError('');
    try {
      const attempt = await pyqStartAttempt(paperId);
      navigate(`/pyq/attempt/${attempt.attempt_id}`, { state: { attempt } });
    } catch {
      setError('Could not start this full-length mock. Please try again.');
      setStarting('');
    }
  }

  async function startGenerated(kind: 'sectional' | 'adaptive') {
    setStarting(kind);
    setError('');
    try {
      const attempt = await pyqStartPractice(
        kind === 'sectional'
          ? { subjects: sectionSubject ? [sectionSubject] : [], count: 30 }
          : { difficulty: ['Medium', 'Hard'], count: 25 },
      );
      navigate(`/pyq/attempt/${attempt.attempt_id}`, { state: { attempt } });
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not start this mock test. Please change filters and try again.');
      setStarting('');
    }
  }

  return (
    <Layout activePage="quiz" title="Mock Tests">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-12 space-y-gutter">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-text-primary mb-2">Mock Test Center</h2>
          <p className="font-body-md text-body-md text-text-muted max-w-3xl">
            Start full-length GATE-style papers, subject sectional tests, or adaptive mixed drills from the current PYQ bank.
          </p>
        </div>

        {error && <div className="bg-error-container/30 border border-error/30 text-on-error-container rounded-lg p-4">{error}</div>}

        {loading ? (
          <div className="flex items-center gap-3 text-text-muted font-label-md text-label-md">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Loading mock tests...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {papers.map((paper) => (
                <div key={paper.paper_id} className="bg-surface rounded-lg border border-border shadow-soft p-6 flex flex-col gap-4">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Pill label="Full Length" />
                      <Pill label={`${paper.duration_minutes} min`} />
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">{paper.title}</h3>
                    <p className="font-body-md text-body-md text-text-muted">{paper.total_questions} questions, {paper.total_marks} marks, exact GATE-style exam player.</p>
                  </div>
                  <button
                    onClick={() => startFullPaper(paper.paper_id)}
                    disabled={!!starting}
                    className="mt-auto self-start bg-primary text-white px-5 py-2.5 rounded-lg font-label-md text-label-md hover:bg-on-primary-fixed-variant disabled:opacity-50 flex items-center gap-2"
                  >
                    {starting === paper.paper_id && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Start Full Mock
                  </button>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-surface rounded-lg border border-border shadow-soft p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-secondary">
                  <span className="material-symbols-outlined">view_agenda</span>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">Sectional Test</h3>
                </div>
                <p className="font-body-md text-body-md text-text-muted">Focus on one subject with a timed 30-question drill.</p>
                <div className="relative">
                  <select
                    value={sectionSubject}
                    onChange={(e) => setSectionSubject(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-border text-on-background rounded-lg px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {taxonomy.subjects.map((subject) => (
                      <option key={subject.name} value={subject.name}>{subject.name} ({subject.question_count})</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
                </div>
                <button onClick={() => startGenerated('sectional')} disabled={!!starting || !sectionSubject} className="self-start bg-secondary text-white px-5 py-2.5 rounded-lg font-label-md text-label-md disabled:opacity-50 flex items-center gap-2">
                  {starting === 'sectional' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Start Sectional
                </button>
              </div>

              <div className="bg-surface rounded-lg border border-border shadow-soft p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">Adaptive Test</h3>
                </div>
                <p className="font-body-md text-body-md text-text-muted">A mixed Medium/Hard drill to stress-test speed and accuracy.</p>
                <div className="grid grid-cols-3 gap-3">
                  <Info label="Questions" value="25" />
                  <Info label="Difficulty" value="M/H" />
                  <Info label="Mode" value="Timed" />
                </div>
                <button onClick={() => startGenerated('adaptive')} disabled={!!starting} className="self-start bg-primary text-white px-5 py-2.5 rounded-lg font-label-md text-label-md hover:bg-on-primary-fixed-variant disabled:opacity-50 flex items-center gap-2">
                  {starting === 'adaptive' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Start Adaptive
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="bg-primary-fixed text-primary px-3 py-1 rounded-full font-label-sm text-label-sm">{label}</span>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-lg border border-border p-3">
      <div className="font-label-sm text-label-sm text-text-muted">{label}</div>
      <div className="font-headline-sm text-headline-sm text-text-primary">{value}</div>
    </div>
  );
}