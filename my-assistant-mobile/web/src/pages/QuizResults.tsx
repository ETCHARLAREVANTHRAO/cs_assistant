import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

export default function QuizResults() {
  const [expanded, setExpanded] = useState<number | null>(0);

  const toggle = (i: number) => setExpanded((cur) => (cur === i ? null : i));

  return (
    <Layout activePage="quiz" title="Quiz Results">
      <div className="max-w-[900px] mx-auto flex flex-col gap-stack-lg px-4 md:px-gutter pb-margin-desktop">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 font-label-sm text-label-sm text-text-muted">
          <Link className="hover:text-primary transition-colors" to="/revision-planner">
            Revision Planner
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface-variant">Mixed Subjects Mock Test</span>
        </div>
        {/* Hero Score Card */}
        <section className="bg-surface border border-border rounded-xl shadow-soft p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-fixed opacity-30 rounded-full blur-3xl pointer-events-none" />
          <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center rounded-full border-[12px] border-surface-container-highest">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
              <circle
                className="text-success stroke-current"
                cx="50"
                cy="50"
                fill="none"
                r="44"
                stroke="currentColor"
                strokeDasharray="276.46"
                strokeDashoffset="55.29"
                strokeLinecap="round"
                strokeWidth="12"
              />
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="font-headline-lg text-headline-lg font-bold text-text-primary tabular-nums">
                8<span className="text-outline text-[24px]">/10</span>
              </span>
              <span className="font-label-sm text-label-sm text-success bg-success/10 px-2.5 py-0.5 rounded-full mt-1 border border-success/20">
                80% Score
              </span>
            </div>
          </div>
          <div className="flex flex-col text-center md:text-left z-10 flex-1">
            <h1 className="font-headline-md text-headline-md text-text-primary">Great job!</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-lg">
              You've demonstrated a strong grasp of core concepts, especially in Algorithms. Review the detailed
              explanations for the questions you missed to solidify your understanding before the next mock.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
              <Link
                to="/quiz"
                className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                Retake Quiz
              </Link>
              <Link
                to="/revision-planner"
                className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-surface-container border border-outline-variant/50 transition-all active:scale-95"
              >
                Back to Planner
              </Link>
            </div>
          </div>
        </section>
        {/* Stats Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-soft flex items-center gap-5 transition-transform hover:-translate-y-0.5 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary border border-secondary/10 shrink-0">
              <span className="material-symbols-outlined text-[28px]">timer</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-1">Total Time Spent</p>
              <div className="flex items-baseline gap-2">
                <p className="font-headline-md text-headline-md text-text-primary">
                  24<span className="text-outline text-[16px] font-normal">m</span> 15
                  <span className="text-outline text-[16px] font-normal">s</span>
                </p>
              </div>
              <p className="text-[13px] text-text-muted mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">speed</span>
                Avg 2m 25s per question
              </p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6 shadow-soft flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">pie_chart</span>
                Subject Performance
              </p>
            </div>
            <div className="flex flex-col gap-3.5">
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1.5">
                  <span className="text-text-primary">Algorithms</span>
                  <span className="text-success font-bold">100%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-success w-full rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-md text-label-md mb-1.5">
                  <span className="text-text-primary">Operating Systems</span>
                  <span className="text-tertiary-container font-bold">50%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-error to-tertiary-container w-1/2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: '50%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Detailed Question Review */}
        <section className="flex flex-col gap-stack-md mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-headline-sm text-headline-sm text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">fact_check</span>
              Question Review
            </h3>
            <div className="flex items-center gap-3 font-label-sm text-label-sm">
              <span className="flex items-center gap-1 text-success">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> 8 Correct
              </span>
              <span className="flex items-center gap-1 text-error">
                <span className="material-symbols-outlined text-[16px]">cancel</span> 2 Incorrect
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {/* Item 1: Correct */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <button
                onClick={() => toggle(0)}
                className={`w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low transition-colors text-left ${expanded === 0 ? 'border-b border-border' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 border border-success/20">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-label-sm text-label-sm text-outline">Q1</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-muted text-[11px] font-medium tracking-wide">
                      Computer Organization
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-text-primary line-clamp-1">
                    Consider a machine with a byte addressable main memory of 2^32 bytes and block size of 16
                    bytes...
                  </p>
                </div>
                <span className="material-symbols-outlined text-outline">
                  {expanded === 0 ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expanded === 0 && (
                <div className="p-6 bg-surface-bright flex flex-col gap-5">
                  <div className="font-body-md text-body-md text-text-primary p-4 bg-surface rounded-lg border border-border/50">
                    <p>
                      Consider a machine with a byte addressable main memory of 2<sup>32</sup> bytes and block size of
                      16 bytes. Assume that a direct mapped cache consisting of 32 lines is used with this machine.
                      How many bits will be there in Tag, Line and Word field of format of main memory addresses?
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-success/5 border border-success/20 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
                      <span className="material-symbols-outlined text-success mt-0.5">radio_button_checked</span>
                      <div>
                        <p className="font-label-md text-label-md text-success">Your Answer (Correct)</p>
                        <p className="font-code text-code text-text-primary mt-1 bg-surface-container-lowest px-2 py-1 rounded inline-block border border-border/50">
                          23, 5, 4
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 p-5 rounded-lg border border-primary/20 bg-primary/5 relative">
                    <div className="absolute -top-3 left-4 bg-surface-bright px-2 flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider">Explanation</span>
                    </div>
                    <div className="font-body-md text-body-md text-text-primary space-y-2 mt-2">
                      <p>
                        Physical Address = <code className="font-code text-[13px] bg-white px-1 py-0.5 rounded border border-border">32 bits</code>.
                      </p>
                      <p>
                        Block Size = 16 Bytes = 2<sup>4</sup> Bytes → Word Offset ={' '}
                        <code className="font-code text-[13px] bg-white px-1 py-0.5 rounded border border-border">4 bits</code>.
                      </p>
                      <p>
                        Number of Lines = 32 = 2<sup>5</sup> → Line Offset ={' '}
                        <code className="font-code text-[13px] bg-white px-1 py-0.5 rounded border border-border">5 bits</code>.
                      </p>
                      <p>
                        Tag bits = Total - (Line + Word) = 32 - (5 + 4) ={' '}
                        <code className="font-code text-[13px] bg-white px-1 py-0.5 rounded border border-border">23 bits</code>.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-primary/10 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/30 shadow-sm cursor-pointer hover:border-primary/50 transition-colors">
                        <span className="material-symbols-outlined text-[14px] text-primary">menu_book</span>
                        Source Notes: Cache Mapping Techniques
                      </div>
                      <button className="text-text-muted hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Item 2: Incorrect */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <button
                onClick={() => toggle(1)}
                className={`w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low transition-colors text-left ${expanded === 1 ? 'border-b border-border' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0 border border-error/20">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </div>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-label-sm text-label-sm text-outline">Q2</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-muted text-[11px] font-medium tracking-wide">
                      Operating Systems
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-text-primary line-clamp-1">
                    In a virtual memory system, if a page table entry has the valid bit set to 0, it implies...
                  </p>
                </div>
                <span className="material-symbols-outlined text-outline">
                  {expanded === 1 ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expanded === 1 && (
                <div className="p-6 bg-surface-bright flex flex-col gap-5 border-t border-border">
                  <div className="font-body-md text-body-md text-text-primary p-4 bg-surface rounded-lg border border-border/50">
                    <p>In a virtual memory system, if a page table entry has the valid bit set to 0, it implies that:</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-error/5 border border-error/20 relative overflow-hidden opacity-80">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-error" />
                      <span className="material-symbols-outlined text-error mt-0.5">cancel</span>
                      <div>
                        <p className="font-label-md text-label-md text-error">Your Answer (Incorrect)</p>
                        <p className="font-body-md text-text-primary mt-1">The page is in physical memory but not accessible.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-success/5 border border-success/20 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
                      <span className="material-symbols-outlined text-success mt-0.5">check_circle</span>
                      <div>
                        <p className="font-label-md text-label-md text-success">Correct Answer</p>
                        <p className="font-body-md text-text-primary mt-1">
                          The page is not currently mapped to physical memory (Page Fault).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Item 3: Correct (Collapsed by default) */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md">
              <button
                onClick={() => toggle(2)}
                className={`w-full p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low transition-colors text-left ${expanded === 2 ? 'border-b border-border' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 border border-success/20">
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </div>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-label-sm text-label-sm text-outline">Q3</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-muted text-[11px] font-medium tracking-wide">
                      Algorithms
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-text-primary line-clamp-1">
                    What is the worst-case time complexity of QuickSort?
                  </p>
                </div>
                <span className="material-symbols-outlined text-outline">
                  {expanded === 2 ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expanded === 2 && (
                <div className="p-6 bg-surface-bright flex flex-col gap-5 border-t border-border">
                  <p className="text-text-muted italic">Question details expanded.</p>
                </div>
              )}
            </div>
          </div>
          {/* Bottom Action */}
          <div className="flex justify-center mt-6 mb-8">
            <button className="bg-surface text-primary border border-primary/20 font-label-md text-label-md px-6 py-2.5 rounded-xl hover:bg-primary/5 transition-all shadow-sm active:scale-95 flex items-center gap-2">
              View All Questions
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
