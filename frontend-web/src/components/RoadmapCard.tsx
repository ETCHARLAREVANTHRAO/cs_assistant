import React from 'react';

export interface ConceptRoadmap {
  concept_key: string;
  title: string;
  subject: string;
  unit: string;
  gate_weightage?: string;
  prerequisites_above?: Array<{ level: string; title: string }>;
  current_focus?: {
    title: string;
    cell_type?: string;
    core_mechanism?: string;
    advantages?: string;
    drawbacks?: string;
  };
  exam_trap?: string;
  what_to_learn_below?: Array<{
    title: string;
    category: string;
    desc: string;
  }>;
  click_to_ask_chips?: string[];
  practice_pyq?: string;
}

interface RoadmapCardProps {
  roadmap: ConceptRoadmap;
  onSelectPrompt?: (prompt: string) => void;
}

export const RoadmapCard: React.FC<RoadmapCardProps> = ({ roadmap, onSelectPrompt }) => {
  if (!roadmap) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-4 text-xs">
      
      {/* Top Badge: Syllabus Position */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60">
        <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300">
          <span className="material-symbols-outlined text-[16px]">account_tree</span>
          <span>{roadmap.subject}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 dark:text-slate-400">{roadmap.unit}</span>
        </div>
        {roadmap.gate_weightage && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            {roadmap.gate_weightage}
          </span>
        )}
      </div>

      {/* 3-Tier Hierarchy Container */}
      <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#0c0e1a] border border-slate-200/80 dark:border-slate-800/80">
        
        {/* Tier 1: Prerequisites Above */}
        {roadmap.prerequisites_above && roadmap.prerequisites_above.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
              Prerequisites Above (What Came Before)
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {roadmap.prerequisites_above.map((p, idx) => (
                <React.Fragment key={idx}>
                  <div className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400">{p.level}:</span>
                    <span>{p.title}</span>
                  </div>
                  {idx < roadmap.prerequisites_above!.length - 1 && (
                    <span className="text-slate-400 font-bold">➔</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Tier 2: Active Question Focus Node */}
        {roadmap.current_focus && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-indigo-500/40 shadow-sm shadow-indigo-500/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-extrabold text-[13px] text-indigo-700 dark:text-indigo-300">
                  📍 Active Focus: {roadmap.current_focus.title}
                </span>
              </div>
              {roadmap.current_focus.cell_type && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono text-[10px] font-bold">
                  {roadmap.current_focus.cell_type}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              {roadmap.current_focus.core_mechanism && (
                <div className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Core Mechanism: </span>
                  {roadmap.current_focus.core_mechanism}
                </div>
              )}
              {roadmap.current_focus.advantages && (
                <div className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Advantage: </span>
                  {roadmap.current_focus.advantages}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tier 3: Subtopics to Explore Next (Below) */}
        {roadmap.what_to_learn_below && roadmap.what_to_learn_below.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
              Next Topics to Learn (What Lies Below)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roadmap.what_to_learn_below.map((sub, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectPrompt?.(`Explain ${sub.title} and how it connects to ${roadmap.title}`)}
                  className="group text-left p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {sub.title}
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {sub.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {sub.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* High-Yield Exam Trap Callout */}
      {roadmap.exam_trap && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px] shrink-0 mt-0.5">
            warning
          </span>
          <div>
            <span className="font-bold text-amber-700 dark:text-amber-300">Exam Trap Alert: </span>
            <span>{roadmap.exam_trap.replace(/^⚠️\s*Exam Trap:\s*/i, '')}</span>
          </div>
        </div>
      )}

      {/* Interactive Click-to-Ask Prompts */}
      {roadmap.click_to_ask_chips && roadmap.click_to_ask_chips.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">psychology</span>
            Explore Further (Click to Ask)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {roadmap.click_to_ask_chips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt?.(chip)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-slate-900 border border-indigo-200/70 dark:border-slate-800 text-indigo-700 dark:text-indigo-300 font-medium text-[11px] hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[13px]">send</span>
                <span>{chip}</span>
              </button>
            ))}

            {roadmap.practice_pyq && (
              <button
                type="button"
                onClick={() => onSelectPrompt?.(`Solve the previous years GATE question for ${roadmap.title}: ${roadmap.practice_pyq}`)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[13px]">quiz</span>
                <span>Practice PYQ ({roadmap.practice_pyq})</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

