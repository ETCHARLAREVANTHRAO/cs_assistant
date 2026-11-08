import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Smooth-scroll anchor helper ─── */
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── Intersection Observer hook for section entrance animations ─── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Feature data ─── */
const FEATURES = [
  {
    icon: 'chat',
    title: 'AI Chat Assistant',
    desc: 'Ask any GATE CS question and get instant, accurate explanations. Powered by Gemini and your personal document vault via pgvector RAG.',
    tags: ['pgvector RAG', 'GATE Library', 'My Docs'],
    color: 'from-indigo-500 to-purple-600',
    light: 'bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: 'folder_open',
    title: 'Smart Documents',
    desc: 'Upload your notes, PDFs, and study material. The platform auto-indexes everything so the AI can reference your personal content.',
    tags: ['Upload PDFs', 'Auto-Index', 'Vector Search'],
    color: 'from-blue-500 to-cyan-500',
    light: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    icon: 'menu_book',
    title: 'Learning Hub',
    desc: 'Structured GATE CS syllabus map covering all 10 core subjects. Mark topics, track mastery, download cheat sheets, and run code snippets.',
    tags: ['10 Subjects', 'Code Runner', 'Progress Tracking'],
    color: 'from-emerald-500 to-teal-500',
    light: 'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: 'psychology',
    title: 'Doubt Solving',
    desc: 'Paste a problem, upload an image, or type a concept you are stuck on. Get verified, step-by-step AI tutor explanations with OCR support.',
    tags: ['Step-by-Step', 'OCR Image Upload', 'AI Tutor'],
    color: 'from-amber-500 to-orange-500',
    light: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    icon: 'event_note',
    title: 'Revision Planner',
    desc: "Build structured study schedules with spaced repetition. Track today's sessions, upcoming targets, and your active preparation streak.",
    tags: ['Spaced Repetition', 'Study Streak', 'Weekly Goals'],
    color: 'from-rose-500 to-pink-500',
    light: 'bg-rose-50 border-rose-100',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  {
    icon: 'library_books',
    title: 'Resources Hub',
    desc: 'Access formula sheets, error notebooks, solved PYQ solutions, cheat sheets, and curated references from standard GATE textbooks.',
    tags: ['Formula Sheets', 'Standard Books', 'Cheat Sheets'],
    color: 'from-violet-500 to-purple-500',
    light: 'bg-violet-50 border-violet-100',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    icon: 'quiz',
    title: 'PYQ Practice Engine',
    desc: 'Solve authentic GATE Computer Science previous-year papers (2012–2026) with official marking schemes, negative marking, and timed simulation.',
    tags: ['2012–2026 Papers', 'TCS iON Simulation', 'Negative Marking'],
    color: 'from-sky-500 to-indigo-500',
    light: 'bg-sky-50 border-sky-100',
    iconBg: 'bg-sky-100 text-sky-600',
  },
  {
    icon: 'science',
    title: 'AI Research Suite',
    desc: 'Discover and synthesize research papers, explore computer science topics in depth, and generate literature reviews using live AI summarization.',
    tags: ['Paper Discovery', 'AI Synthesis', 'Literature Review'],
    color: 'from-fuchsia-500 to-pink-500',
    light: 'bg-fuchsia-50 border-fuchsia-100',
    iconBg: 'bg-fuchsia-100 text-fuchsia-600',
  },
];

const HOW_STEPS = [
  { step: '01', icon: 'login', title: 'Sign In Securely', desc: 'Create your account or sign in with Google. Your data is protected with Firebase Authentication.' },
  { step: '02', icon: 'explore', title: 'Explore Your Dashboard', desc: 'Access your personalized GATE CS preparation hub with subjects, topics, and AI tools ready to go.' },
  { step: '03', icon: 'upload_file', title: 'Upload Study Material', desc: 'Add your own notes and PDFs. The AI reads and indexes your documents to include them in answers.' },
  { step: '04', icon: 'school', title: 'Learn, Practice & Revise', desc: 'Work through the syllabus, solve PYQs, ask the AI tutor tough questions, and run weekly mock tests.' },
  { step: '05', icon: 'insights', title: 'Track Your Progress', desc: 'Monitor subject accuracy, percentile prediction, weak topics, and time management across all attempts.' },
];

const WHY_ITEMS = [
  { icon: 'auto_awesome', title: 'Gemini-Powered AI Tutor', desc: 'Instant, deeply accurate explanations for any GATE CS concept, algorithm, or previous-year question.' },
  { icon: 'hub', title: 'pgvector RAG Architecture', desc: 'Retrieval-Augmented Generation pulls verified answers from GATE papers and your own uploaded notes.' },
  { icon: 'assignment_turned_in', title: '1,280+ Official Questions', desc: 'Complete PYQ bank from 2012 to 2026 with section-wise breakdown, accuracy tracking, and official keys.' },
  { icon: 'timeline', title: 'Live Analytics Dashboard', desc: 'Subject accuracy, improvement trend, time management breakdown, and AIR percentile predictions.' },
  { icon: 'schedule', title: 'Smart Spaced Repetition', desc: 'Scientifically designed revision planner ensures you review topics at their optimal forgetting-curve intervals.' },
  { icon: 'devices', title: 'Cross-Platform Companion', desc: 'Web, Windows desktop app, and Android APK. Study at your desk or revise on your phone between classes.' },
];

/* ─── Navbar ─── */
function Navbar() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-soft border-b border-gray-100 dark:border-slate-800'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-glow-indigo">
            <span className="material-symbols-outlined text-white text-base">psychology</span>
          </div>
          <span className={`font-extrabold text-base tracking-tight ${scrolled ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
            My Assistant
          </span>
        </button>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { label: 'Features', id: 'features' },
            { label: 'How it Works', id: 'how-it-works' },
            { label: 'Why Choose Us', id: 'why' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`text-xs font-semibold transition-colors cursor-pointer ${
                scrolled ? 'text-gray-600 hover:text-indigo-600' : 'text-white/80 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-glow-indigo hover:shadow-glow-purple active:scale-95 transition-all cursor-pointer"
            >
              Open Dashboard →
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className={`text-xs font-semibold transition-colors ${
                  scrolled ? 'text-gray-600 hover:text-indigo-600' : 'text-white/80 hover:text-white'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-glow-indigo hover:shadow-glow-purple active:scale-95 transition-all"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className={`md:hidden p-2 rounded-lg cursor-pointer ${scrolled ? 'text-gray-700' : 'text-white'}`}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 px-4 pb-4 pt-2 flex flex-col gap-3">
          {[{ label: 'Features', id: 'features' }, { label: 'How it Works', id: 'how-it-works' }, { label: 'Why Choose Us', id: 'why' }].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { scrollTo(item.id); setMenuOpen(false); }}
              className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 text-left py-1.5 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            {currentUser ? (
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold text-center cursor-pointer"
              >
                Open Dashboard →
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-indigo-600 py-1.5">Sign In</Link>
                <Link to="/login" className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold text-center">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Section: Hero ─── */
function HeroSection() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Deep cosmic background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 0%, #1e1b4b 0%, #0f1123 40%, #060810 100%)',
        }}
      />

      {/* Curved ambient light beams (Resq.io signature) */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: 'conic-gradient(from 180deg at 20% -10%, rgba(99,102,241,0.3) 0deg, transparent 60deg)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute top-0 right-0 w-full h-full pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg at 80% -10%, rgba(168,85,247,0.25) 0deg, transparent 60deg)',
          filter: 'blur(80px)',
        }}
      />

      {/* Stardust dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Centre glow orb */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Powered by Gemini 2.5 Flash &bull; pgvector RAG</span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] mb-6">
          Your Smarter Companion<br />
          <span
            className="inline-block"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            for GATE CS Preparation
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          An AI-powered learning platform that combines an intelligent chat tutor, previous-year question practice, spaced-repetition revision planning, and your personal study vault — all in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-7 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-glow-indigo hover:shadow-glow-purple hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">rocket_launch</span>
            Get Started Free
          </button>
          {currentUser ? (
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 backdrop-blur-sm transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">dashboard</span>
              Open Dashboard
            </button>
          ) : (
            <Link
              to="/login"
              className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              Sign In
            </Link>
          )}
        </div>

        {/* Social proof stats */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-16">
          {[
            { value: '1,280+', label: 'Official GATE Questions' },
            { value: '10', label: 'Core CS Subjects' },
            { value: '2012–2026', label: 'PYQ Coverage' },
            { value: 'pgvector', label: 'RAG Architecture' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stat.value}</div>
              <div className="text-xs text-slate-400 mt-0.5 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Floating Dashboard Preview Card */}
        <div className="relative mx-auto max-w-4xl animate-float">
          {/* Outer glow halo */}
          <div
            className="absolute -inset-1 rounded-3xl pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.3), rgba(56,189,248,0.3))', filter: 'blur(20px)' }}
          />

          {/* Dashboard mock card */}
          <div
            className="relative rounded-3xl overflow-hidden border border-white/10"
            style={{ background: 'rgba(17,20,34,0.85)', backdropFilter: 'blur(20px)' }}
          >
            {/* Chrome-style title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white/8 rounded-md px-3 py-1 text-xs text-slate-400 font-mono flex items-center gap-2 max-w-xs mx-auto">
                  <span className="text-emerald-400">🔒</span> my-assistant.app/chat
                </div>
              </div>
            </div>

            {/* Simulated App UI inside */}
            <div className="flex" style={{ height: '340px' }}>
              {/* Sidebar */}
              <div className="w-48 shrink-0 border-r border-white/8 p-3 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">psychology</span>
                  </div>
                  <span className="text-xs font-bold text-white">My Assistant</span>
                </div>
                {[
                  { icon: 'chat', label: 'AI Chat', active: true },
                  { icon: 'menu_book', label: 'Learning', active: false },
                  { icon: 'quiz', label: 'PYQ Practice', active: false },
                  { icon: 'folder_open', label: 'Documents', active: false },
                  { icon: 'insights', label: 'Analytics', active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium ${
                      item.active ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Chat area */}
              <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
                {/* AI message bubble */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">auto_awesome</span>
                  </div>
                  <div className="max-w-xs rounded-2xl rounded-tl-sm p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      In Banker's Algorithm, a state is <strong className="text-indigo-300">safe</strong> if there exists a sequence in which all processes can finish. For <span className="font-mono text-emerald-300">P1 → P3 → P2 → P4</span>, the need matrix satisfies...
                    </p>
                  </div>
                </div>

                {/* User message bubble */}
                <div className="flex items-start gap-2.5 justify-end">
                  <div className="max-w-xs rounded-2xl rounded-tr-sm p-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.3))' }}>
                    <p className="text-xs text-white">Explain the Banker's Algorithm with an example</p>
                  </div>
                  <div className="w-7 h-7 shrink-0 rounded-xl bg-slate-700 flex items-center justify-center text-xs font-bold text-white">S</div>
                </div>

                {/* Metric chips row */}
                <div className="flex items-center gap-2 mt-auto pt-2">
                  {[
                    { icon: 'library_books', label: 'GATE Library', color: 'text-indigo-400' },
                    { icon: 'folder_open', label: 'My Docs', color: 'text-emerald-400' },
                    { icon: 'star', label: 'Best Answer', color: 'text-amber-400' },
                  ].map((chip) => (
                    <div
                      key={chip.label}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${chip.color}`}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <span className="material-symbols-outlined text-xs">{chip.icon}</span>
                      {chip.label}
                    </div>
                  ))}
                </div>

                {/* Chat input */}
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2 mt-1"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span className="text-xs text-slate-400 flex-1">Ask anything about GATE CS...</span>
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs">send</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-50 animate-bounce">
          <span className="text-slate-400 text-xs font-medium">Scroll to explore</span>
          <span className="material-symbols-outlined text-slate-400">keyboard_arrow_down</span>
        </div>
      </div>
    </section>
  );
}

/* ─── Section: About ─── */
function AboutSection() {
  const { ref, visible } = useInView();

  return (
    <section id="about" className="py-24 bg-white">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: text */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-5">
              <span className="material-symbols-outlined text-sm">info</span>
              About the Platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-5">
              Built for GATE CS.<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Powered by AI.
              </span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-5 text-sm sm:text-base">
              My Assistant is an AI-powered preparation platform built specifically for GATE Computer Science and Information Technology aspirants. It combines an intelligent tutor, a comprehensive PYQ practice engine, structured syllabus coverage, and smart revision tools — all backed by real GATE papers.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8 text-sm sm:text-base">
              Unlike generic AI tools, My Assistant understands GATE CS deeply. It retrieves answers from a pgvector database of official GATE questions and standard textbooks using Retrieval-Augmented Generation — so every explanation is grounded in verified content.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: 'verified', label: 'GATE-Specific Answers', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { icon: 'speed', label: 'Instant AI Responses', color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: 'lock', label: 'Secure & Private', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: 'devices', label: 'Web + Mobile + Desktop', color: 'text-sky-600', bg: 'bg-sky-50' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: visual bento grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 rounded-3xl p-5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-glow-indigo">
              <span className="material-symbols-outlined text-3xl mb-3 opacity-80">auto_awesome</span>
              <h3 className="text-base font-bold mb-1.5">Gemini-Powered Tutor</h3>
              <p className="text-xs text-indigo-100 leading-relaxed">
                Ask any GATE CS concept and receive mathematically-verified, step-by-step explanations drawn from official GATE papers, standard textbooks, and your own uploaded study material.
              </p>
            </div>
            <div className="rounded-3xl p-5 bg-gray-50 border border-gray-100">
              <span className="material-symbols-outlined text-2xl text-indigo-500 mb-2">quiz</span>
              <div className="text-2xl font-black text-gray-900 font-mono">1,280+</div>
              <div className="text-xs text-gray-500 font-medium">Official GATE Questions</div>
            </div>
            <div className="rounded-3xl p-5 bg-gray-50 border border-gray-100">
              <span className="material-symbols-outlined text-2xl text-purple-500 mb-2">local_fire_department</span>
              <div className="text-2xl font-black text-gray-900">2012–2026</div>
              <div className="text-xs text-gray-500 font-medium">PYQ Paper Coverage</div>
            </div>
            <div className="rounded-3xl p-5 bg-emerald-50 border border-emerald-100">
              <span className="material-symbols-outlined text-2xl text-emerald-600 mb-2">hub</span>
              <div className="text-2xl font-black text-gray-900">pgvector</div>
              <div className="text-xs text-gray-500 font-medium">RAG Architecture</div>
            </div>
            <div className="rounded-3xl p-5 bg-sky-50 border border-sky-100">
              <span className="material-symbols-outlined text-2xl text-sky-600 mb-2">menu_book</span>
              <div className="text-2xl font-black text-gray-900">10</div>
              <div className="text-xs text-gray-500 font-medium">Core CS Subjects</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section: Features ─── */
function FeaturesSection() {
  const { ref, visible } = useInView();

  return (
    <section id="features" className="py-24" style={{ background: 'linear-gradient(180deg, #f8f9ff 0%, #f1f0fe 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-5 shadow-sm">
            <span className="material-symbols-outlined text-sm">apps</span>
            Complete Feature Suite
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-5">
            Everything for Your GATE CS Journey
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
            Nine powerful modules working together to cover every aspect of GATE Computer Science preparation — from conceptual learning to timed exam simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, idx) => (
            <FeatureCard key={f.title} feature={f} delay={idx * 60} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, delay }: { feature: typeof FEATURES[0]; delay: number }) {
  const { ref, visible } = useInView(0.08);

  return (
    <div
      ref={ref}
      className={`resq-card-light rounded-3xl p-6 flex flex-col gap-3.5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`w-11 h-11 rounded-2xl ${feature.iconBg} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-xl">{feature.icon}</span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 leading-snug">{feature.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed flex-1">{feature.desc}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {feature.tags.map((tag) => (
          <span key={tag} className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Section: How It Works ─── */
function HowItWorksSection() {
  const { ref, visible } = useInView();

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-5">
            <span className="material-symbols-outlined text-sm">linear_scale</span>
            Simple Onboarding
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-5">
            Start Preparing in Minutes
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Getting started is straightforward. Sign in and your intelligent preparation companion is ready within seconds.
          </p>
        </div>

        {/* Steps timeline */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-200 to-transparent mx-32" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
            {HOW_STEPS.map((s, idx) => (
              <HowCard key={s.step} step={s} delay={idx * 80} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowCard({ step, delay }: { step: typeof HOW_STEPS[0]; delay: number }) {
  const { ref, visible } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`flex flex-col items-center text-center gap-4 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-glow-indigo">
          <span className="material-symbols-outlined text-white text-2xl">{step.icon}</span>
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-indigo-200 flex items-center justify-center text-[10px] font-black text-indigo-600">
          {step.step}
        </div>
      </div>
      <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">{step.desc}</p>
    </div>
  );
}

/* ─── Section: Why Choose ─── */
function WhySection() {
  const { ref, visible } = useInView();

  return (
    <section
      id="why"
      className="py-24 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 100%, #1e1b4b 0%, #0f1123 60%, #060810 100%)' }}
    >
      {/* Beam elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="resq-beam opacity-50" />
        <div className="resq-beam-right opacity-50" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-5">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            Competitive Advantage
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-5">
            Why Aspirants Choose<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              My Assistant
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Purpose-built for GATE Computer Science, not a generic AI assistant with a GATE theme.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY_ITEMS.map((item, idx) => (
            <WhyCard key={item.title} item={item} delay={idx * 70} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyCard({ item, delay }: { item: typeof WHY_ITEMS[0]; delay: number }) {
  const { ref, visible } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`p-6 rounded-3xl border border-white/8 transition-all duration-700 hover:border-indigo-500/40 hover:-translate-y-1 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)', transitionDelay: `${delay}ms` }}
    >
      <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-xl">{item.icon}</span>
      </div>
      <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
    </div>
  );
}

/* ─── Section: CTA ─── */
function CTASection() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { ref, visible } = useInView();

  return (
    <section className="py-24 bg-white">
      <div
        ref={ref}
        className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div
          className="relative rounded-3xl p-12 sm:p-16 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f1123 60%, #0a0f1e 100%)' }}
        >
          {/* Glow effects */}
          <div className="absolute resq-beam opacity-70" />
          <div className="absolute resq-beam-right opacity-70" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Start Preparing Today
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-5">
              Ready for GATE CS?<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 40%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Start for Free.
              </span>
            </h2>

            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base mb-10 leading-relaxed">
              Join thousands of GATE CS aspirants who use My Assistant to study smarter, practice efficiently, and walk into the examination hall with confidence.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-glow-indigo hover:shadow-glow-purple hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                Get Started Free
              </button>
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 backdrop-blur-sm transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  Open Dashboard
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section: Footer ─── */
function Footer() {
  return (
    <footer className="bg-gray-950 text-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-base">psychology</span>
              </div>
              <span className="font-extrabold text-base tracking-tight">My Assistant</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              An AI-powered GATE Computer Science preparation platform combining intelligent tutoring, PYQ practice, spaced revision, and document-indexed RAG answers.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Platform</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'AI Chat Tutor', path: '/chat' },
                { label: 'PYQ Practice', path: '/pyq' },
                { label: 'Learning Hub', path: '/learning' },
                { label: 'Revision Planner', path: '/revision-planner' },
                { label: 'Progress Analytics', path: '/progress' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Account</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Sign In', path: '/login' },
                { label: 'Create Account', path: '/login' },
                { label: 'Plans & Billing', path: '/billing' },
                { label: 'Settings', path: '/settings' },
                { label: 'Downloads', path: '/downloads' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="text-xs text-gray-400 hover:text-indigo-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} My Assistant – GATE CS Aspirant. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Powered by Gemini 2.5 Flash &bull; pgvector RAG &bull; Firebase Auth</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Root Landing Page Component ─── */
export default function Landing() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans antialiased">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WhySection />
      <CTASection />
      <Footer />
    </div>
  );
}
