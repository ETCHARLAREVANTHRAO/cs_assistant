import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  fetchSandboxPresets,
  traceCodeExecution,
  type CodeTraceResult,
} from '../services/api';

export default function CodeSandbox() {
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('pointer_arithmetic');
  const [traceData, setTraceData] = useState<CodeTraceResult | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetchSandboxPresets().then((data) => {
      setPresets(data);
      traceCodeExecution('pointer_arithmetic').then((res) => {
        setTraceData(res);
        setCurrentStepIdx(0);
        setIsLoading(false);
      });
    });
  }, []);

  const handleSelectPreset = async (key: string) => {
    setSelectedPresetKey(key);
    setIsLoading(true);
    const res = await traceCodeExecution(key);
    setTraceData(res);
    setCurrentStepIdx(0);
    setIsLoading(false);
  };

  const currentStep = traceData?.steps[currentStepIdx];
  const codeLines = (presets[selectedPresetKey]?.code || '').split('\n');

  return (
    <Layout activePage="sandbox" title="C/C++ Memory & Pointer Tracing">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">memory</span>
                <span>Hardware & Pointer Simulation</span>
              </div>
              <h1 className="text-2xl font-black text-white">C/C++ Memory & Pointer Tracing Sandbox</h1>
              <p className="text-sm text-slate-300 mt-1">
                Visual stack frames, pointer dereferencing addresses, and memory alignment padding for tricky GATE CS questions.
              </p>
            </div>

            {/* Presets Chips */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(presets).map((k) => (
                <button
                  key={k}
                  onClick={() => handleSelectPreset(k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedPresetKey === k
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {presets[k].title.split(':')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stepper Controls Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentStepIdx === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 transition"
            >
              ← Prev Step
            </button>
            <button
              onClick={() =>
                setCurrentStepIdx((prev) =>
                  traceData ? Math.min(traceData.steps.length - 1, prev + 1) : prev
                )
              }
              disabled={!traceData || currentStepIdx >= traceData.steps.length - 1}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition flex items-center gap-1"
            >
              <span>Next Step</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <button
              onClick={() => setCurrentStepIdx(0)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">
              Step {currentStepIdx + 1} of {traceData?.steps.length || 0}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
              {currentStep?.statement || 'Ready'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Viewer with Active Line Highlight */}
          <div className="bg-[#12151c] border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
              <span className="font-bold text-slate-300">source.c</span>
              <span>C99 Standard (GCC)</span>
            </div>

            <div className="space-y-1">
              {codeLines.map((line: string, idx: number) => {
                const lineNum = idx + 1;
                const isCurrent = currentStep?.line_number === lineNum;
                return (
                  <div
                    key={idx}
                    className={`flex items-center py-1 px-2 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-400 font-bold'
                        : 'text-slate-400 hover:bg-slate-900/50'
                    }`}
                  >
                    <span className="w-8 select-none text-slate-600 text-right pr-3">{lineNum}</span>
                    <span className="flex-1 whitespace-pre">{line}</span>
                  </div>
                );
              })}
            </div>

            {/* stdout Box */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500">Program stdout:</div>
              <div className="bg-black/80 rounded-xl p-3 text-emerald-400 font-mono text-xs h-16 flex items-center">
                {currentStep?.stdout_line ? (
                  <span>&gt; {currentStep.stdout_line}</span>
                ) : (
                  <span className="text-slate-600 italic">No output on this step</span>
                )}
              </div>
            </div>
          </div>

          {/* Visual Memory Stack & Explanation */}
          <div className="space-y-4">
            {/* Memory Stack Frames */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-400">layers</span>
                <span>Active Stack Activation Records</span>
              </h3>

              <div className="space-y-2">
                {currentStep?.stack_frames.map((frame, fIdx) => (
                  <div
                    key={fIdx}
                    className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 font-mono">
                        Frame: {frame.func}()
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Base: 0x7ffd_{fIdx * 16}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {Object.keys(frame.vars).map((vKey) => (
                        <div
                          key={vKey}
                          className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between"
                        >
                          <span className="text-slate-400">{vKey}:</span>
                          <span className="text-white font-bold">{String(frame.vars[vKey])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Explanation */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs space-y-2">
              <div className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Step Analysis</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{currentStep?.explanation}</p>
            </div>

            {/* GATE Exam Takeaway */}
            {traceData && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>GATE Exam Rule</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{traceData.exam_takeaway}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
