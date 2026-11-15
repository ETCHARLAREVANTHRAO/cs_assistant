import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  fetchKnowledgeTree,
  fetchKnowledgeStats,
  fetchWeaknessDrill,
  type SkillNode,
  type KnowledgeStats,
  type WeaknessQuestion,
} from '../services/api';

export default function KnowledgeGraph() {
  const [tree, setTree] = useState<SkillNode[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [drillQuestions, setDrillQuestions] = useState<WeaknessQuestion[]>([]);
  const [drillActive, setDrillActive] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<boolean>(false);
  const [, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchKnowledgeTree(), fetchKnowledgeStats()])
      .then(([t, s]) => {
        setTree(t);
        setStats(s);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleStartDrill = async () => {
    const qList = await fetchWeaknessDrill();
    setDrillQuestions(qList);
    setSelectedAnswers({});
    setShowExplanations(false);
    setDrillActive(true);
  };

  const filteredNodes =
    selectedSubject === 'all' ? tree : tree.filter((n) => n.subject.toLowerCase().includes(selectedSubject.toLowerCase()));

  const subjects = ['all', 'Operating Systems', 'Algorithms', 'Databases (DBMS)', 'Computer Networks', 'Theory of Computation'];

  return (
    <Layout activePage="knowledge-graph" title="AIR Booster & Knowledge Graph">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">radar</span>
                <span>AI Skill Tree & Predictive Analytics</span>
              </div>
              <h1 className="text-2xl font-black text-white">AIR Booster & Knowledge Graph</h1>
              <p className="text-sm text-slate-300 mt-1">
                Visual skill mastery tree. Detects statistical weak spots across GATE CS and generates targeted 5-question booster drills.
              </p>
            </div>

            <button
              onClick={handleStartDrill}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-900/30 transition flex items-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Launch Weakness Killer Drill</span>
            </button>
          </div>
        </div>

        {/* Predictive Analytics Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400">Predicted Score</div>
              <div className="text-2xl font-black text-indigo-400 font-mono mt-1">{stats.predicted_gate_score}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{stats.predicted_marks} / 100 Marks</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400">Estimated AIR Bracket</div>
              <div className="text-base font-black text-emerald-400 font-mono mt-2">{stats.estimated_air_bracket}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Based on PYQ and Speed Battles</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-[10px] uppercase font-bold text-slate-400">Overall Mastery</div>
              <div className="text-2xl font-black text-purple-400 font-mono mt-1">{stats.overall_mastery_percentage}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across 10 GATE Subjects</div>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl shadow-sm">
              <div className="text-[10px] uppercase font-bold text-rose-400">Critical Weak Spots</div>
              <div className="text-2xl font-black text-rose-400 font-mono mt-1">{stats.critical_weakness_count} Topics</div>
              <div className="text-[11px] text-rose-300/80 mt-0.5">&lt;60% accuracy threshold</div>
            </div>
          </div>
        )}

        {/* 1-Click Weakness Killer Modal / Inline Drill */}
        {drillActive && (
          <div className="bg-white dark:bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  Personalized 5-Question Weakness Drill
                </h3>
              </div>
              <button
                onClick={() => setDrillActive(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Drill
              </button>
            </div>

            <div className="space-y-6">
              {drillQuestions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 font-mono">
                      {q.subject} • {q.topic}
                    </span>
                    <span className="text-slate-400 font-mono">{q.difficulty}</span>
                  </div>

                  <p className="font-semibold text-slate-800 dark:text-white text-sm leading-relaxed">
                    Q{qIdx + 1}: {q.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selectedAnswers[q.id] === optIdx;
                      const isCorrect = q.correct_option_index === optIdx;
                      let btnStyle = 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                      if (isChosen) btnStyle = 'bg-indigo-600 text-white border-indigo-500';
                      if (showExplanations) {
                        if (isCorrect) btnStyle = 'bg-emerald-600 text-white border-emerald-500';
                        else if (isChosen && !isCorrect) btnStyle = 'bg-rose-600 text-white border-rose-500';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={showExplanations}
                          onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                          className={`p-3 rounded-xl border text-left font-medium transition ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {showExplanations && (
                    <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] text-slate-300 leading-relaxed">
                      <span className="font-bold text-indigo-400">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              {!showExplanations ? (
                <button
                  onClick={() => setShowExplanations(true)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition"
                >
                  Verify Answers & Check Explanations
                </button>
              ) : (
                <button
                  onClick={() => setDrillActive(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                >
                  Done with Drill
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedSubject === sub
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {sub === 'all' ? 'All Core Subjects' : sub}
            </button>
          ))}
        </div>

        {/* Skill Tree Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((node) => {
            const isMastered = node.status === 'mastered';
            const isWeak = node.status === 'weak';
            return (
              <div
                key={node.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-indigo-500 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono">
                      {node.subject}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{node.title}</h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isMastered
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isWeak
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {node.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Mastery Level</span>
                    <span className="font-bold text-white">{node.mastery_level}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${node.mastery_level}%` }}
                      className={`h-full rounded-full ${
                        isMastered ? 'bg-emerald-400' : isWeak ? 'bg-rose-500' : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Subtopics chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {node.sample_subtopics.map((st, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-400 font-mono"
                    >
                      {st}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Weightage: ~{node.gate_weightage_marks} Marks</span>
                  <span className="text-indigo-400 font-semibold cursor-pointer hover:underline">
                    Drill Topic →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
