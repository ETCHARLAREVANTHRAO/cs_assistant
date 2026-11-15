import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  fetchAutomataPresets,
  simulateAutomaton,
  verifyAutomaton,
  type AutomatonModel,
  type SimulationResult,
  type VerificationResult,
} from '../services/api';

export default function AutomataStudio() {
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('ends_with_01');
  const [automaton, setAutomaton] = useState<AutomatonModel>({
    states: [
      { id: 'q0', label: 'q0', is_start: true, is_accept: false, x: 80, y: 140 },
      { id: 'q1', label: 'q1', is_start: false, is_accept: false, x: 220, y: 140 },
      { id: 'q2', label: 'q2', is_start: false, is_accept: true, x: 360, y: 140 },
    ],
    transitions: [
      { from_state: 'q0', to_state: 'q1', symbol: '0' },
      { from_state: 'q0', to_state: 'q0', symbol: '1' },
      { from_state: 'q1', to_state: 'q1', symbol: '0' },
      { from_state: 'q1', to_state: 'q2', symbol: '1' },
      { from_state: 'q2', to_state: 'q1', symbol: '0' },
      { from_state: 'q2', to_state: 'q0', symbol: '1' },
    ],
    alphabet: ['0', '1'],
  });

  const [inputString, setInputString] = useState<string>('100101');
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [verifResult, setVerifResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    fetchAutomataPresets().then((data) => {
      setPresets(data);
    });
  }, []);

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    const p = presets[key];
    if (p) {
      setAutomaton({
        states: p.states,
        transitions: p.transitions,
        alphabet: p.alphabet || ['0', '1'],
      });
      setSimResult(null);
      setCurrentStepIdx(-1);
      setIsPlaying(false);
      setVerifResult(null);
    }
  };

  const runSimulation = async () => {
    setIsPlaying(false);
    const res = await simulateAutomaton(automaton, inputString);
    setSimResult(res);
    setCurrentStepIdx(0);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyAutomaton(automaton, presets[selectedPresetKey]?.title || 'Binary Language');
      setVerifResult(res);
    } finally {
      setIsVerifying(false);
    }
  };

  // Step play timer
  useEffect(() => {
    if (!isPlaying || !simResult || currentStepIdx < 0) return;
    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev + 1 < simResult.steps.length) {
          return prev + 1;
        }
        setIsPlaying(false);
        return prev;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, simResult, currentStepIdx]);

  const activeStateId =
    currentStepIdx >= 0 && simResult && simResult.steps[currentStepIdx]
      ? simResult.steps[currentStepIdx].current_state
      : automaton.states.find((s) => s.is_start)?.id;

  return (
    <Layout activePage="automata" title="TOC Automata Studio">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-slate-900 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">hub</span>
                <span>Theory of Computation Visualizer</span>
              </div>
              <h1 className="text-2xl font-black text-white">Interactive Automata & State Machine Studio</h1>
              <p className="text-sm text-slate-300 mt-1">
                Design and simulate Deterministic Finite Automata (DFA). Trace input strings with tape head animations.
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
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-950/70 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {presets[k].title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Controls & String Input Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-slate-400">Input String:</span>
              <input
                type="text"
                value={inputString}
                onChange={(e) => setInputString(e.target.value)}
                placeholder="e.g. 100101"
                className="text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-white max-w-xs"
              />
              <button
                onClick={runSimulation}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>Simulate</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px] text-purple-400">
                  {isVerifying ? 'progress_activity' : 'verified'}
                </span>
                <span>{isVerifying ? 'Verifying...' : 'AI Verify DFA'}</span>
              </button>
            </div>
          </div>

          {/* Tape Visualization */}
          {inputString && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-2">
              <span className="text-xs text-slate-400 font-mono mr-2">Tape Head:</span>
              {inputString.split('').map((char, idx) => {
                const isActive = currentStepIdx === idx;
                const isPassed = currentStepIdx > idx;
                return (
                  <div
                    key={idx}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm border transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-500/40 scale-110 shadow-md'
                        : isPassed
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          )}

          {/* Result Alert */}
          {simResult && currentStepIdx === simResult.steps.length - 1 && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                simResult.accepted
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  {simResult.accepted ? 'check_circle' : 'cancel'}
                </span>
                <span>
                  String &quot;{inputString}&quot; is{' '}
                  <span className="underline">{simResult.accepted ? 'ACCEPTED' : 'REJECTED'}</span> by the automaton.
                </span>
              </div>
              <span className="font-mono text-[11px]">Final State: {simResult.path[simResult.path.length - 1]}</span>
            </div>
          )}
        </div>

        {/* Visual State Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Transition Diagram Canvas
            </h3>

            <div className="relative h-72 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full">
                {/* Transitions */}
                {automaton.transitions.map((t, idx) => {
                  const fromNode = automaton.states.find((s) => s.id === t.from_state);
                  const toNode = automaton.states.find((s) => s.id === t.to_state);
                  if (!fromNode || !toNode) return null;

                  const isSelfLoop = t.from_state === t.to_state;
                  const x1 = (fromNode.x || 100) + 30;
                  const y1 = (fromNode.y || 140) + 15;
                  const x2 = (toNode.x || 100) + 30;
                  const y2 = (toNode.y || 140) + 15;

                  if (isSelfLoop) {
                    return (
                      <g key={idx}>
                        <path
                          d={`M ${x1 - 10} ${y1 - 15} C ${x1 - 25} ${y1 - 50}, ${x1 + 25} ${y1 - 50}, ${x1 + 10} ${y1 - 15}`}
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="2"
                        />
                        <text
                          x={x1}
                          y={y1 - 45}
                          fill="#c084fc"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {t.symbol}
                        </text>
                      </g>
                    );
                  }

                  return (
                    <g key={idx}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="2" />
                      <text
                        x={(x1 + x2) / 2}
                        y={(y1 + y2) / 2 - 8}
                        fill="#c084fc"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {t.symbol}
                      </text>
                    </g>
                  );
                })}

                {/* States */}
                {automaton.states.map((s) => {
                  const x = (s.x || 100) + 30;
                  const y = (s.y || 140) + 15;
                  const isActive = activeStateId === s.id;

                  return (
                    <g key={s.id} className="cursor-pointer">
                      {/* Accept outer ring */}
                      {s.is_accept && (
                        <circle cx={x} cy={y} r={26} fill="none" stroke="#a855f7" strokeWidth="2.5" />
                      )}

                      {/* Main node */}
                      <circle
                        cx={x}
                        cy={y}
                        r={21}
                        fill={isActive ? '#9333ea' : '#1e293b'}
                        stroke={isActive ? '#f3e8ff' : '#64748b'}
                        strokeWidth="2.5"
                        className="transition-all duration-300"
                      />

                      {/* Label */}
                      <text
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {s.label}
                      </text>

                      {/* Start Arrow */}
                      {s.is_start && (
                        <path
                          d={`M ${x - 38} ${y} L ${x - 22} ${y}`}
                          stroke="#a855f7"
                          strokeWidth="3"
                          markerEnd="url(#arrow)"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Stepper & Transition Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">table_chart</span>
              <span>Transition Table δ(q, σ)</span>
            </h3>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-center border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2 text-left">State</th>
                    {automaton.alphabet.map((sym) => (
                      <th key={sym} className="p-2">σ = {sym}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {automaton.states.map((st) => (
                    <tr
                      key={st.id}
                      className={`text-center ${
                        activeStateId === st.id ? 'bg-purple-500/10 text-purple-400 font-bold' : ''
                      }`}
                    >
                      <td className="p-2 text-left font-bold text-slate-800 dark:text-slate-200">
                        {st.is_start ? '→ ' : ''}{st.label}{st.is_accept ? ' *' : ''}
                      </td>
                      {automaton.alphabet.map((sym) => {
                        const tr = automaton.transitions.find(
                          (t) => t.from_state === st.id && t.symbol === sym
                        );
                        return <td key={sym} className="p-2">{tr ? tr.to_state : '∅'}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AI Verification Results */}
            {verifResult && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-xs space-y-2">
                <div className="font-bold text-purple-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>AI Verification Summary</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{verifResult.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
