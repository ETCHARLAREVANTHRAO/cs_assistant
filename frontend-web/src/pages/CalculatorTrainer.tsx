import { useState } from 'react';
import Layout from '../components/Layout';

interface DrillChallenge {
  id: string;
  level: string;
  prompt: string;
  targetExpression: string;
  expectedResult: number;
  tolerance: number;
  trapWarning: string;
}

const DRILLS: DrillChallenge[] = [
  {
    id: 'd1',
    level: 'Level 1: Fast Basics',
    prompt: 'Evaluate: (144 / 12) + (1.5^4)',
    targetExpression: '12 + 5.0625',
    expectedResult: 17.0625,
    tolerance: 0.01,
    trapWarning: 'In TCS iON, evaluate power x^y before addition to ensure proper operator precedence.',
  },
  {
    id: 'd2',
    level: 'Level 2: Logarithms & Memory',
    prompt: 'Store log₂(1024) in Memory (MS), then compute: MR × 3.5 - 5',
    targetExpression: '10 * 3.5 - 5',
    expectedResult: 30,
    tolerance: 0.01,
    trapWarning: 'Ensure you clear memory (MC) first so previous calculations do not contaminate M+.',
  },
  {
    id: 'd3',
    level: 'Level 3: Trig & Radians Trap',
    prompt: 'Set mode to RADIANS. Compute: sin(1.5708) + cos(0)',
    targetExpression: 'sin(pi/2) + cos(0)',
    expectedResult: 2.0,
    tolerance: 0.05,
    trapWarning: 'Common GATE trap: TCS iON defaults to Degrees! Failing to toggle to Rad causes huge errors.',
  },
  {
    id: 'd4',
    level: 'Level 4: NAT Floating Point Precision',
    prompt: 'Evaluate Effective Memory Access Time: 0.98 * 20 + 0.02 * (20 + 100)',
    targetExpression: '19.6 + 2.4',
    expectedResult: 22.0,
    tolerance: 0.01,
    trapWarning: 'In NAT questions, carry full precision before rounding at the final step.',
  },
];

export default function CalculatorTrainer() {
  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [memory, setMemory] = useState<number>(0);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [isRadians, setIsRadians] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ expr: string; res: string }>>([]);

  // Drill State
  const [activeDrillIndex, setActiveDrillIndex] = useState<number>(0);
  const [drillFeedback, setDrillFeedback] = useState<{ status: 'idle' | 'success' | 'fail'; msg: string }>({
    status: 'idle',
    msg: '',
  });

  const currentDrill = DRILLS[activeDrillIndex];

  // Key handlers
  const handleDigit = (digit: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? digit : prev + digit));
  };

  const handleOperator = (op: string) => {
    setExpression((prev) => `${prev} ${display} ${op}`);
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEqual = () => {
    try {
      const fullExpr = `${expression} ${display}`
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/mod/g, '%');
      const safeEvaluator = new Function('"use strict";return (' + fullExpr + ')');
      const res = safeEvaluator();
      const resStr = String(Number(res.toFixed(6)));
      setHistory((prev) => [{ expr: `${expression} ${display}`, res: resStr }, ...prev.slice(0, 9)]);
      setDisplay(resStr);
      setExpression('');

      // Check against current drill
      if (Math.abs(Number(res) - currentDrill.expectedResult) <= currentDrill.tolerance) {
        setDrillFeedback({
          status: 'success',
          msg: `🎯 Correct! Result ${resStr} matches expected ${currentDrill.expectedResult}.`,
        });
      } else {
        setDrillFeedback({
          status: 'fail',
          msg: `⚠️ Result ${resStr} differs from expected ${currentDrill.expectedResult}. Note: ${currentDrill.trapWarning}`,
        });
      }
    } catch {
      setDisplay('Error');
    }
  };

  // Scientific Functions
  const handleUnary = (func: string) => {
    const val = parseFloat(display);
    if (isNaN(val)) return;

    let res = 0;
    const toAngle = (v: number) => (isRadians ? v : (v * Math.PI) / 180);

    switch (func) {
      case 'sin':
        res = Math.sin(toAngle(val));
        break;
      case 'cos':
        res = Math.cos(toAngle(val));
        break;
      case 'tan':
        res = Math.tan(toAngle(val));
        break;
      case 'ln':
        res = Math.log(val);
        break;
      case 'log10':
        res = Math.log10(val);
        break;
      case 'log2':
        res = Math.log2(val);
        break;
      case 'sqrt':
        res = Math.sqrt(val);
        break;
      case 'sqr':
        res = val * val;
        break;
      case 'cube':
        res = val * val * val;
        break;
      case 'inv':
        res = 1 / val;
        break;
      case 'fact':
        let f = 1;
        for (let i = 2; i <= Math.min(val, 20); i++) f *= i;
        res = f;
        break;
      case 'exp':
        res = Math.exp(val);
        break;
      case 'neg':
        res = -val;
        break;
      default:
        res = val;
    }
    setDisplay(String(Number(res.toFixed(6))));
  };

  // Memory functions
  const handleMemory = (action: string) => {
    const val = parseFloat(display) || 0;
    if (action === 'MS') {
      setMemory(val);
      setHasMemory(true);
    } else if (action === 'MR') {
      setDisplay(String(memory));
    } else if (action === 'MC') {
      setMemory(0);
      setHasMemory(false);
    } else if (action === 'M+') {
      setMemory((prev) => prev + val);
      setHasMemory(true);
    } else if (action === 'M-') {
      setMemory((prev) => prev - val);
      setHasMemory(true);
    }
  };

  return (
    <Layout activePage="calculator" title="TCS iON Virtual Calculator Trainer">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="material-symbols-outlined text-sm">calculate</span>
                <span>Official Exam Interface Simulation</span>
              </div>
              <h1 className="text-2xl font-black text-white">TCS iON Virtual Calculator & Speed Trainer</h1>
              <p className="text-sm text-slate-300 mt-1">
                Pixel-perfect replica of the GATE virtual calculator. Practice real speed drills and avoid memory & radians traps.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-mono font-bold">GATE Exam Mode Active</span>
            </div>
          </div>
        </div>

        {/* Drill Challenge Prompt Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold font-mono">
                {currentDrill.level}
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">{currentDrill.prompt}</h3>
            </div>

            <div className="flex items-center gap-2">
              {DRILLS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveDrillIndex(idx);
                    setDrillFeedback({ status: 'idle', msg: '' });
                    handleClear();
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition ${
                    activeDrillIndex === idx
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {drillFeedback.status !== 'idle' && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                drillFeedback.status === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
              }`}
            >
              <span className="material-symbols-outlined text-sm mt-0.5">
                {drillFeedback.status === 'success' ? 'check_circle' : 'warning'}
              </span>
              <span>{drillFeedback.msg}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main TCS iON Calculator Body */}
          <div className="lg:col-span-2 bg-[#1e232a] border-2 border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4 select-none">
            {/* Calculator Brand Banner */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-700">
              <span className="font-bold text-slate-300">TCS iON GATE Scientific Calculator</span>
              <div className="flex items-center gap-3">
                {hasMemory && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                    [M]
                  </span>
                )}
                <button
                  onClick={() => setIsRadians(!isRadians)}
                  className={`px-2 py-0.5 rounded font-bold text-[11px] transition ${
                    isRadians ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {isRadians ? 'Rad' : 'Deg'}
                </button>
              </div>
            </div>

            {/* LCD Screen Display */}
            <div className="bg-[#12151a] border border-slate-700 rounded-xl p-4 text-right space-y-1">
              <div className="text-xs font-mono text-slate-400 h-5 overflow-hidden">{expression || ' '}</div>
              <div className="text-3xl font-black font-mono text-white tracking-wider overflow-x-auto">
                {display}
              </div>
            </div>

            {/* Keypad Grid */}
            <div className="grid grid-cols-6 gap-2">
              {/* Row 1: Memory & Specials */}
              <button onClick={() => handleMemory('MC')} className="calc-btn-fn">MC</button>
              <button onClick={() => handleMemory('MR')} className="calc-btn-fn">MR</button>
              <button onClick={() => handleMemory('MS')} className="calc-btn-fn">MS</button>
              <button onClick={() => handleMemory('M+')} className="calc-btn-fn">M+</button>
              <button onClick={() => handleMemory('M-')} className="calc-btn-fn">M-</button>
              <button onClick={handleBackspace} className="calc-btn-warn">⌫</button>

              {/* Row 2: Trig & Powers */}
              <button onClick={() => handleUnary('sin')} className="calc-btn-fn">sin</button>
              <button onClick={() => handleUnary('cos')} className="calc-btn-fn">cos</button>
              <button onClick={() => handleUnary('tan')} className="calc-btn-fn">tan</button>
              <button onClick={() => handleUnary('sqr')} className="calc-btn-fn">x²</button>
              <button onClick={() => handleUnary('sqrt')} className="calc-btn-fn">√x</button>
              <button onClick={handleClear} className="calc-btn-danger">C</button>

              {/* Row 3: Logs & Inverses */}
              <button onClick={() => handleUnary('ln')} className="calc-btn-fn">ln</button>
              <button onClick={() => handleUnary('log10')} className="calc-btn-fn">log₁₀</button>
              <button onClick={() => handleUnary('log2')} className="calc-btn-fn">log₂</button>
              <button onClick={() => handleDigit('7')} className="calc-btn-num">7</button>
              <button onClick={() => handleDigit('8')} className="calc-btn-num">8</button>
              <button onClick={() => handleDigit('9')} className="calc-btn-num">9</button>

              {/* Row 4: Fact, Powers & Digits */}
              <button onClick={() => handleUnary('fact')} className="calc-btn-fn">n!</button>
              <button onClick={() => handleUnary('cube')} className="calc-btn-fn">x³</button>
              <button onClick={() => handleOperator('÷')} className="calc-btn-op">÷</button>
              <button onClick={() => handleDigit('4')} className="calc-btn-num">4</button>
              <button onClick={() => handleDigit('5')} className="calc-btn-num">5</button>
              <button onClick={() => handleDigit('6')} className="calc-btn-num">6</button>

              {/* Row 5: Mod, Mult & Digits */}
              <button onClick={() => handleUnary('inv')} className="calc-btn-fn">1/x</button>
              <button onClick={() => handleOperator('mod')} className="calc-btn-op">mod</button>
              <button onClick={() => handleOperator('×')} className="calc-btn-op">×</button>
              <button onClick={() => handleDigit('1')} className="calc-btn-num">1</button>
              <button onClick={() => handleDigit('2')} className="calc-btn-num">2</button>
              <button onClick={() => handleDigit('3')} className="calc-btn-num">3</button>

              {/* Row 6: Exp, Plus, Minus, Zero & Equals */}
              <button onClick={() => handleUnary('exp')} className="calc-btn-fn">eˣ</button>
              <button onClick={() => handleOperator('-')} className="calc-btn-op">−</button>
              <button onClick={() => handleOperator('+')} className="calc-btn-op">+</button>
              <button onClick={() => handleUnary('neg')} className="calc-btn-num">±</button>
              <button onClick={() => handleDigit('0')} className="calc-btn-num">0</button>
              <button onClick={() => handleDigit('.')} className="calc-btn-num">.</button>
            </div>

            {/* Equals Big Bar */}
            <button
              onClick={handleEqual}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base shadow-md transition"
            >
              = Calculate
            </button>
          </div>

          {/* History Tape & Trap Warnings */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">history</span>
                <span>Calculation Tape</span>
              </h3>

              <div className="h-64 overflow-y-auto space-y-2 font-mono text-xs">
                {history.length === 0 ? (
                  <div className="text-slate-500 italic p-2 text-center">No calculations yet.</div>
                ) : (
                  history.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => setDisplay(h.res)}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-500 transition"
                    >
                      <div className="text-slate-400 text-[11px] truncate">{h.expr} =</div>
                      <div className="text-slate-800 dark:text-white font-bold text-sm">{h.res}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                <span>GATE Calculator Pro-Tip</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Physical computer keyboards are disabled during the official GATE exam. Practice clicking with your mouse to build real muscle memory!
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .calc-btn-fn {
          padding: 10px 4px;
          border-radius: 8px;
          background-color: #2b323c;
          color: #cbd5e1;
          font-family: monospace;
          font-size: 11px;
          font-weight: bold;
          transition: all 0.1s;
        }
        .calc-btn-fn:hover { background-color: #3b4452; color: #fff; }
        .calc-btn-num {
          padding: 10px 4px;
          border-radius: 8px;
          background-color: #333b47;
          color: #fff;
          font-family: monospace;
          font-size: 13px;
          font-weight: 900;
          transition: all 0.1s;
        }
        .calc-btn-num:hover { background-color: #475263; }
        .calc-btn-op {
          padding: 10px 4px;
          border-radius: 8px;
          background-color: #4f46e5;
          color: #fff;
          font-family: monospace;
          font-size: 12px;
          font-weight: bold;
          transition: all 0.1s;
        }
        .calc-btn-op:hover { background-color: #6366f1; }
        .calc-btn-warn {
          padding: 10px 4px;
          border-radius: 8px;
          background-color: #b45309;
          color: #fff;
          font-size: 12px;
          font-weight: bold;
        }
        .calc-btn-danger {
          padding: 10px 4px;
          border-radius: 8px;
          background-color: #e11d48;
          color: #fff;
          font-size: 12px;
          font-weight: bold;
        }
      `}</style>
    </Layout>
  );
}
