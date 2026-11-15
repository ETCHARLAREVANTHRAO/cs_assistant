import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import {
  type ResumeData,
  INITIAL_RESUME_DATA,
  sendResumeChat,
  analyzeResume,
  type ResumeAnalyzeResponse,
  matchJobDescription,
  tailorResumeToJd,
  type ResumeJdMatchResponse,
  parseResumeDocument,
  listCloudResumes,
  saveCloudResume,
  loadCloudResume,
  deleteCloudResume,
  type CloudResumeMeta,
} from '../services/api';

type TemplateType = 'modern' | 'classic' | 'minimal' | 'compact';
type ActiveView = 'chat' | 'editor' | 'preview';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
  hasUpdatedResume?: boolean;
}

const SAMPLE_PROFILES: Record<string, { label: string; desc: string; data: ResumeData }> = {
  gate_cs: {
    label: 'GATE CS & Software Engineer',
    desc: 'High-ranking GATE CSE profile with distributed systems & algorithmic focus.',
    data: INITIAL_RESUME_DATA,
  },
  fullstack: {
    label: 'Full-Stack Web Architect',
    desc: 'React 19, TypeScript, Node.js, and cloud microservices.',
    data: {
      ...INITIAL_RESUME_DATA,
      personalInfo: {
        ...INITIAL_RESUME_DATA.personalInfo,
        headline: 'Full-Stack Software Engineer | React, TypeScript & Node.js',
      },
      summary:
        'Full-Stack Developer with 2+ years of experience engineering high-performance web applications using React, TypeScript, GraphQL, and Node.js. Adept at state management, micro-frontends, and automated testing, with a track record of speeding up customer page loads by 50%.',
      experience: [
        {
          id: 'exp-fs-1',
          role: 'Full-Stack Developer',
          company: 'HyperScale Web Solutions',
          location: 'Remote',
          startDate: 'May 2024',
          endDate: 'Present',
          current: true,
          highlights: [
            'Architected scalable responsive web dashboards in Next.js 15 & React 19 serving 60k+ monthly active users.',
            'Optimized Core Web Vitals (LCP, CLS, INP), elevating Google Lighthouse performance scores from 64 to 98.',
            'Built real-time collaborative workspace using WebSocket channels and optimistic UI state management.',
          ],
        },
      ],
    },
  },
  backend: {
    label: 'Backend & Cloud Systems Engineer',
    desc: 'Specialized in Go, Python FastAPI, PostgreSQL & Docker.',
    data: {
      ...INITIAL_RESUME_DATA,
      personalInfo: {
        ...INITIAL_RESUME_DATA.personalInfo,
        headline: 'Backend Systems Engineer | Go, Python & High-Throughput APIs',
      },
      summary:
        'Backend Engineer specialized in building low-latency, event-driven architectures in Go and Python. Proficient in database query optimization, distributed caching with Redis, and containerized cloud orchestration with Docker and Kubernetes.',
    },
  },
  blank: {
    label: 'Blank Template',
    desc: 'Start fresh with an empty canvas.',
    data: {
      personalInfo: {
        fullName: 'Your Name',
        headline: 'Target Role (e.g. Software Development Engineer)',
        email: 'your.email@example.com',
        phone: '+91 90000 00000',
        location: 'City, Country',
        linkedin: 'https://linkedin.com/in/yourname',
        github: 'https://github.com/yourname',
        portfolio: 'https://yourportfolio.dev',
      },
      summary: 'Passionate and driven software engineer focused on building robust and scalable technology.',
      experience: [],
      education: [
        {
          id: 'edu-new',
          degree: 'B.Tech in Computer Science',
          institution: 'Your University',
          location: 'City, Country',
          startDate: '2022',
          endDate: '2026',
          gpa: '8.5 / 10',
          highlights: ['Key coursework: Data Structures, Algorithms, OS, DBMS, Networks.'],
        },
      ],
      projects: [],
      skills: [
        { name: 'Programming Languages', items: ['Python', 'C++', 'JavaScript', 'SQL'] },
        { name: 'Frameworks & Tools', items: ['React', 'FastAPI', 'Git', 'Docker'] },
      ],
      certifications: [],
      achievements: [],
    },
  },
};

export default function ResumeBuilder() {
  // Load initial resume from localStorage or fallback
  const [resume, setResume] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem('my_assistant_resume_draft');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_RESUME_DATA;
  });

  const [history, setHistory] = useState<ResumeData[]>([]);
  const [template, setTemplate] = useState<TemplateType>('modern');
  const [activeMobileView, setActiveMobileView] = useState<ActiveView>('preview');
  const [desktopRightView, setDesktopRightView] = useState<'preview' | 'editor'>('preview');

  const [zoom, setZoom] = useState<number>(100);
  const [atsScore, setAtsScore] = useState<number>(88);
  const [atsModalOpen, setAtsModalOpen] = useState<boolean>(false);
  const [atsAnalysis, setAtsAnalysis] = useState<ResumeAnalyzeResponse | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // FEATURE 1: Job Description Match & Tailor State
  const [jdModalOpen, setJdModalOpen] = useState<boolean>(false);
  const [jdText, setJdText] = useState<string>('');
  const [jdMatch, setJdMatch] = useState<ResumeJdMatchResponse | null>(null);
  const [isMatchingJd, setIsMatchingJd] = useState<boolean>(false);
  const [isTailoringJd, setIsTailoringJd] = useState<boolean>(false);

  // FEATURE 2: Direct PDF / DOCX Document Import State
  const [isParsingDoc, setIsParsingDoc] = useState<boolean>(false);
  const docUploadInputRef = useRef<HTMLInputElement>(null);

  // FEATURE 3: WYSIWYG Inline Editing State
  const [isInlineEdit, setIsInlineEdit] = useState<boolean>(true);

  // FEATURE 4: Cloud Sync & Multi-Version Resume Management State
  const [activeResumeId, setActiveResumeId] = useState<string>('primary-v1');
  const [resumeTitle, setResumeTitle] = useState<string>('Primary Tech Resume');
  const [cloudVersions, setCloudVersions] = useState<CloudResumeMeta[]>([]);
  const [cloudModalOpen, setCloudModalOpen] = useState<boolean>(false);
  const [isCloudSaving, setIsCloudSaving] = useState<boolean>(false);

  // Chat Copilot State
  const [chatMessages, setChatMessages] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to the **AI Resume Studio**!\n\nI am your live career architect. As you chat, I can **rewrite bullet points**, **add impactful metrics (Google XYZ style)**, **tailor your resume for specific engineering roles**, or **optimize your ATS keyword coverage** in real time.\n\n✨ **New Superpowers**:\n• **Target Job Description Matcher**: Paste any job description to get match % & 1-click tailoring.\n• **Direct PDF / Word Import**: Upload your existing resume to parse instantly.\n• **WYSIWYG Direct Edit**: Click and type directly on the resume paper.\n• **Cloud Sync & Multiple Versions**: Save, name, and switch between resume profiles.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Strengthen action verbs (XYZ format)',
        'Tailor for Backend Engineer',
        'Add GATE CS achievements',
        'Audit ATS score & weaknesses',
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeFormSection, setActiveFormSection] = useState<string>('personal');

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const resumePrintRef = useRef<HTMLDivElement>(null);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('my_assistant_resume_draft', JSON.stringify(resume));
    } catch {}
  }, [resume]);

  // Load cloud resume list on startup
  useEffect(() => {
    listCloudResumes().then((list) => {
      setCloudVersions(list);
    }).catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages, isAiLoading]);

  // Calculate live ATS score on resume changes
  useEffect(() => {
    let score = 50;
    if (resume.personalInfo.fullName && resume.personalInfo.email && resume.personalInfo.phone) score += 15;
    if (resume.summary && resume.summary.length > 50) score += 10;
    if (resume.experience.length >= 1) score += 10;
    if (resume.projects.length >= 2) score += 15;

    const allBullets = [
      ...resume.experience.flatMap((e) => e.highlights),
      ...resume.projects.flatMap((p) => p.highlights),
    ].join(' ');

    const actionVerbs = [
      'architected',
      'engineered',
      'optimized',
      'automated',
      'spearheaded',
      'built',
      'slashed',
      'reduced',
      'designed',
    ].filter((v) => allBullets.toLowerCase().includes(v));

    if (actionVerbs.length >= 4) score += 15;
    else if (actionVerbs.length >= 2) score += 8;

    const hasMetrics = /\d+%|\d+x|\d+ms|qps|rpm|\$\d+|\d+\+/i.test(allBullets);
    if (hasMetrics) score += 10;

    const totalSkills = resume.skills.reduce((sum, s) => sum + s.items.length, 0);
    if (totalSkills >= 12) score += 10;
    else if (totalSkills >= 6) score += 6;

    setAtsScore(Math.min(96, Math.max(30, score)));
  }, [resume]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const updateResumeWithHistory = (newResume: ResumeData, reason?: string) => {
    setHistory((prev) => [...prev, resume]);
    setResume(newResume);
    if (reason) showToast(reason);
  };

  const undoLastChange = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setResume(previous);
    showToast('Reverted previous change.');
  };

  // ==========================================
  // FEATURE 1: JOB DESCRIPTION MATCH & TAILOR
  // ==========================================
  const handleAnalyzeJdMatch = async () => {
    if (!jdText.trim()) return;
    setIsMatchingJd(true);
    try {
      const match = await matchJobDescription(resume, jdText);
      setJdMatch(match);
    } catch {
      showToast('Error analyzing job description match.');
    } finally {
      setIsMatchingJd(false);
    }
  };

  const handleApplyTailoredResume = async () => {
    if (!jdText.trim()) return;
    setIsTailoringJd(true);
    try {
      const tailored = await tailorResumeToJd(resume, jdText);
      updateResumeWithHistory(tailored.updated_resume, `🎯 Tailored for ${jdMatch?.role_summary || 'Target Role'} (${tailored.match_percentage}% Match)!`);
      setJdModalOpen(false);
    } catch {
      showToast('Error tailoring resume.');
    } finally {
      setIsTailoringJd(false);
    }
  };

  // ==========================================
  // FEATURE 2: DIRECT PDF / DOCX IMPORT
  // ==========================================
  const handleUploadResumeDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDoc(true);
    showToast(`⏳ AI is parsing ${file.name}...`);
    try {
      const parsedRes = await parseResumeDocument(file);
      if (parsedRes && parsedRes.resume) {
        updateResumeWithHistory(parsedRes.resume, `✨ Parsed ${file.name} successfully into live resume!`);
        setDesktopRightView('preview');
      } else {
        showToast('Could not extract structured resume data from document.');
      }
    } catch {
      showToast('Error parsing resume document.');
    } finally {
      setIsParsingDoc(false);
      e.target.value = '';
    }
  };

  // ==========================================
  // FEATURE 3: WYSIWYG CLICK-TO-EDIT HANDLERS
  // ==========================================
  const handleInlinePersonalInfoBlur = (field: keyof typeof resume.personalInfo, text: string) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: text.trim(),
      },
    }));
  };

  const handleInlineSummaryBlur = (text: string) => {
    setResume((prev) => ({ ...prev, summary: text.trim() }));
  };

  const handleInlineExpHighlightBlur = (expId: string, hIdx: number, newText: string) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => {
        if (exp.id !== expId) return exp;
        const nextH = [...exp.highlights];
        nextH[hIdx] = newText.trim();
        return { ...exp, highlights: nextH };
      }),
    }));
  };

  const handleInlineProjHighlightBlur = (projId: string, hIdx: number, newText: string) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => {
        if (proj.id !== projId) return proj;
        const nextH = [...proj.highlights];
        nextH[hIdx] = newText.trim();
        return { ...proj, highlights: nextH };
      }),
    }));
  };

  const handleInlineAchievementBlur = (aIdx: number, newText: string) => {
    setResume((prev) => {
      const nextAch = [...prev.achievements];
      nextAch[aIdx] = newText.trim();
      return { ...prev, achievements: nextAch };
    });
  };

  // ==========================================
  // FEATURE 4: CLOUD SYNC & MULTI-VERSION
  // ==========================================
  const handleSaveToCloud = async () => {
    setIsCloudSaving(true);
    try {
      await saveCloudResume(activeResumeId, resumeTitle, resume, atsScore);
      showToast(`☁️ Saved "${resumeTitle}" to cloud!`);
      const updatedList = await listCloudResumes();
      setCloudVersions(updatedList);
    } catch {
      showToast('Error saving resume to cloud.');
    } finally {
      setIsCloudSaving(false);
    }
  };

  const handleLoadCloudVersion = async (meta: CloudResumeMeta) => {
    try {
      const loaded = await loadCloudResume(meta.resume_id);
      setActiveResumeId(meta.resume_id);
      setResumeTitle(meta.title);
      updateResumeWithHistory(loaded.resume, `Loaded version "${meta.title}".`);
      setCloudModalOpen(false);
    } catch {
      showToast('Error loading cloud resume.');
    }
  };

  const handleDeleteCloudVersion = async (resumeId: string) => {
    try {
      await deleteCloudResume(resumeId);
      setCloudVersions((prev) => prev.filter((v) => v.resume_id !== resumeId));
      showToast('Version deleted.');
    } catch {
      showToast('Error deleting version.');
    }
  };

  const handleCreateNewVersion = () => {
    const newId = `resume-${Date.now()}`;
    const newTitle = `Version ${cloudVersions.length + 1}`;
    setActiveResumeId(newId);
    setResumeTitle(newTitle);
    updateResumeWithHistory(INITIAL_RESUME_DATA, `Started new resume version: ${newTitle}`);
    setCloudModalOpen(false);
  };

  // AI Chat Submission
  const handleSendMessage = async (msgToSend?: string) => {
    const text = (msgToSend ?? inputMessage).trim();
    if (!text || isAiLoading) return;

    setInputMessage('');
    const userTurn: ChatTurn = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userTurn]);
    setIsAiLoading(true);

    try {
      const historyPayload = chatMessages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendResumeChat(text, resume, historyPayload);

      const assistantTurn: ChatTurn = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: response.suggestions,
        hasUpdatedResume: Boolean(response.updated_resume),
      };

      setChatMessages((prev) => [...prev, assistantTurn]);

      if (response.updated_resume) {
        updateResumeWithHistory(response.updated_resume, '✨ Resume updated live by AI Copilot!');
      }
      if (response.ats_score) {
        setAtsScore(response.ats_score);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection issue. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run deep ATS audit
  const runAtsAudit = async () => {
    setIsAuditing(true);
    setAtsModalOpen(true);
    try {
      const res = await analyzeResume(resume, resume.personalInfo.headline);
      setAtsAnalysis(res);
      setAtsScore(res.score);
    } catch {
      // handled
    } finally {
      setIsAuditing(false);
    }
  };

  // Export to PDF / Print
  const handleExportPdf = () => {
    window.print();
  };

  // Copy plain text formatted for ATS portals
  const handleCopyPlainText = () => {
    const lines: string[] = [];
    const p = resume.personalInfo;
    lines.push(p.fullName.toUpperCase());
    lines.push(p.headline);
    lines.push(`${p.email} | ${p.phone} | ${p.location}`);
    if (p.linkedin) lines.push(`LinkedIn: ${p.linkedin}`);
    if (p.github) lines.push(`GitHub: ${p.github}`);
    if (p.portfolio) lines.push(`Portfolio: ${p.portfolio}`);
    lines.push('\n--- PROFESSIONAL SUMMARY ---');
    lines.push(resume.summary);

    if (resume.experience.length > 0) {
      lines.push('\n--- WORK EXPERIENCE ---');
      resume.experience.forEach((exp) => {
        lines.push(`${exp.role} - ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})`);
        exp.highlights.forEach((h) => lines.push(`* ${h}`));
      });
    }

    if (resume.projects.length > 0) {
      lines.push('\n--- TECHNICAL PROJECTS ---');
      resume.projects.forEach((proj) => {
        lines.push(`${proj.title} [${proj.technologies.join(', ')}]`);
        proj.highlights.forEach((h) => lines.push(`* ${h}`));
      });
    }

    if (resume.education.length > 0) {
      lines.push('\n--- EDUCATION ---');
      resume.education.forEach((edu) => {
        lines.push(`${edu.degree} - ${edu.institution} (${edu.startDate} - ${edu.endDate}) - GPA: ${edu.gpa}`);
      });
    }

    if (resume.skills.length > 0) {
      lines.push('\n--- TECHNICAL SKILLS ---');
      resume.skills.forEach((cat) => {
        lines.push(`${cat.name}: ${cat.items.join(', ')}`);
      });
    }

    if (resume.achievements.length > 0) {
      lines.push('\n--- HONORS & ACHIEVEMENTS ---');
      resume.achievements.forEach((ach) => lines.push(`* ${ach}`));
    }

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('📋 Formatted plain text copied to clipboard!');
  };

  // Export JSON backup
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resume, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `resume_${resume.personalInfo.fullName.toLowerCase().replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 Resume backup exported as JSON.');
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.personalInfo) {
          updateResumeWithHistory(parsed, '📂 Resume restored successfully from file!');
        } else {
          showToast('Invalid resume JSON format.');
        }
      } catch {
        showToast('Error reading resume JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Form edit handlers
  const handlePersonalInfoChange = (field: keyof typeof resume.personalInfo, val: string) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: val,
      },
    }));
  };

  const handleSummaryChange = (val: string) => {
    setResume((prev) => ({ ...prev, summary: val }));
  };

  // Quick AI field Polish
  const requestFieldPolish = (fieldLabel: string, currentContent: string) => {
    handleSendMessage(`Please enhance and polish this ${fieldLabel} for my tech resume:\n\n"${currentContent}"`);
  };

  return (
    <Layout activePage="resume" title="AI Resume Studio">
      <div id="resume-root-container" className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-[#07080e]">
        {/* TOP CONTROLS & UTILITIES BAR */}
        <div className="no-print bg-white/95 dark:bg-[#0d0f1b]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs z-20">
          {/* Left: Role Badge, Cloud Resume Title & ATS Score */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[20px]">
                badge
              </span>
              {/* Editable Resume Title */}
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                title="Click to rename this resume version"
                className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-indigo-500 w-36 sm:w-48 truncate"
              />
            </div>

            {/* Cloud Versions Dropdown Button */}
            <button
              onClick={() => setCloudModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Manage multiple saved versions in the cloud"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-500">cloud</span>
              <span className="hidden md:inline">Versions ({cloudVersions.length})</span>
            </button>

            {/* Save to Cloud Button */}
            <button
              onClick={handleSaveToCloud}
              disabled={isCloudSaving}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 rounded-lg transition"
              title="Save current resume to Firebase cloud"
            >
              {isCloudSaving ? (
                <span className="w-3 h-3 rounded-full border border-indigo-500 border-t-transparent animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[15px]">cloud_upload</span>
              )}
              <span className="hidden sm:inline">Save Cloud</span>
            </button>

            {/* ATS Score Pill */}
            <button
              onClick={runAtsAudit}
              title="Click to view full ATS Audit breakdown"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-xs"
            >
              {isAuditing ? (
                <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 border-t-transparent animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <span>ATS: {atsScore}</span>
              <span className="material-symbols-outlined text-[15px]">analytics</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={undoLastChange}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                title="Undo last change"
              >
                <span className="material-symbols-outlined text-[16px]">undo</span>
              </button>
            )}
          </div>

          {/* Center: Template & Mode Switchers */}
          <div className="flex items-center gap-2">
            {/* Template Selector */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs font-medium">
              {(
                [
                  { id: 'modern', label: 'Modern' },
                  { id: 'classic', label: 'Classic Ivy' },
                  { id: 'minimal', label: 'Minimal' },
                  { id: 'compact', label: 'Compact' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-all ${
                    template === t.id
                      ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* WYSIWYG Inline Edit Mode Toggle */}
            <button
              onClick={() => setIsInlineEdit((v) => !v)}
              title="Click to toggle inline text editing directly on the document sheet"
              className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition ${
                isInlineEdit
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isInlineEdit ? 'edit' : 'edit_off'}
              </span>
              <span>{isInlineEdit ? 'Inline Edit ON' : 'Read Only'}</span>
            </button>

            {/* Desktop Right Pane View Toggle (Preview vs Form Editor) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs">
              <button
                onClick={() => setDesktopRightView('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  desktopRightView === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">visibility</span>
                <span>Document View</span>
              </button>
              <button
                onClick={() => setDesktopRightView('editor')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  desktopRightView === 'editor'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                <span>Form Editor</span>
              </button>
            </div>
          </div>

          {/* Right: Actions (Job Match, Import PDF, Export PDF, Samples) */}
          <div className="flex items-center gap-2">
            {/* FEATURE 1: Target Job Description Matcher Button */}
            <button
              onClick={() => setJdModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition"
            >
              <span className="material-symbols-outlined text-[16px]">target</span>
              <span>Job Match</span>
            </button>

            {/* FEATURE 2: Direct PDF / Word Import Button */}
            <button
              onClick={() => docUploadInputRef.current?.click()}
              disabled={isParsingDoc}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              title="Upload existing resume in PDF, Word, or TXT format"
            >
              {isParsingDoc ? (
                <span className="w-3 h-3 rounded-full border border-indigo-500 border-t-transparent animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
              )}
              <span className="hidden sm:inline">Import Resume</span>
            </button>
            <input
              ref={docUploadInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleUploadResumeDocument}
              className="hidden"
            />

            {/* Zoom Controls */}
            <div className="hidden xl:flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
              <button onClick={() => setZoom((z) => Math.max(75, z - 10))} className="hover:text-slate-800 dark:hover:text-white px-1">-</button>
              <span className="w-8 text-center">{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(125, z + 10))} className="hover:text-slate-800 dark:hover:text-white px-1">+</button>
            </div>

            {/* Sample Selector Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 transition">
                <span className="material-symbols-outlined text-[16px]">folder_special</span>
                <span className="hidden sm:inline">Samples</span>
                <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 hidden group-hover:block z-30">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Load Pre-Built Sample
                </div>
                {Object.entries(SAMPLE_PROFILES).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => updateResumeWithHistory(item.data, `Loaded "${item.label}" sample.`)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 transition"
                  >
                    <div className="font-semibold text-indigo-600 dark:text-indigo-400">{item.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Copy Plain Text */}
            <button
              onClick={handleCopyPlainText}
              title="Copy clean text formatted for ATS portals"
              className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              <span>Copy</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-sm shadow-indigo-500/25 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export PDF</span>
            </button>

            {/* Extra Options (JSON backup) */}
            <div className="relative group">
              <button
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Backup and JSON Options"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 hidden group-hover:block z-30">
                <button
                  onClick={handleExportJson}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  Export JSON
                </button>
                <label className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px]">file_upload</span>
                  Import JSON
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE SEGMENTED CONTROL TAB BAR */}
        <div className="no-print lg:hidden bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80 px-4 py-1.5 flex items-center justify-around text-xs font-semibold">
          <button
            onClick={() => setActiveMobileView('chat')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition ${
              activeMobileView === 'chat'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            <span>AI Copilot</span>
          </button>
          <button
            onClick={() => setActiveMobileView('preview')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition ${
              activeMobileView === 'preview'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Live Resume</span>
          </button>
          <button
            onClick={() => setActiveMobileView('editor')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg transition ${
              activeMobileView === 'editor'
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Form Editor</span>
          </button>
        </div>

        {/* TOAST BANNER */}
        {toastMessage && (
          <div className="no-print fixed top-16 right-6 z-50 animate-bounce bg-slate-900/95 dark:bg-indigo-950/95 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-indigo-500/40 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MAIN WORKSPACE SPLIT (Chat on Left, Editor/Preview on Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* ========================================================= */}
          {/* LEFT COLUMN: AI RESUME COPILOT CHAT                       */}
          {/* ========================================================= */}
          <div
            className={`no-print w-full lg:w-[410px] xl:w-[450px] flex-shrink-0 flex flex-col bg-white dark:bg-[#0d0f1b] border-r border-slate-200/80 dark:border-slate-800/80 transition-all ${
              activeMobileView === 'chat' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-white">AI Career Copilot</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Live Document Sync</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  setChatMessages([
                    {
                      id: 'cleared',
                      role: 'assistant',
                      content: 'Chat history cleared. How can I assist you with your resume next?',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ])
                }
                title="Clear chat"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[17px]">delete_sweep</span>
              </button>
            </div>

            {/* Chat Message Stream */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scroll">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                        : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {msg.hasUpdatedResume && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Applied to Live Resume
                        </span>
                        <button
                          onClick={undoLastChange}
                          className="hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(sug)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition text-left cursor-pointer"
                        >
                          ✨ {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isAiLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>AI Copilot is optimizing and editing resume...</span>
                </div>
              )}
            </div>

            {/* Quick Action Pills above Input */}
            <div className="px-3 py-1.5 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
              <button
                onClick={() => handleSendMessage('Please strengthen my experience bullet points using action verbs and measurable metrics (XYZ formula).')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition"
              >
                ⚡ Strengthen Bullets
              </button>
              <button
                onClick={() => handleSendMessage('Tailor my resume summary and skills specifically for a Backend / Distributed Systems Engineer role.')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition"
              >
                🎯 Tailor for Backend
              </button>
              <button
                onClick={() => handleSendMessage('Add my GATE CSE rank and algorithmic achievements to the honors and summary sections.')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition"
              >
                🏆 Highlight GATE Rank
              </button>
              <button
                onClick={() => handleSendMessage('Check my resume for missing ATS technical skills and suggest high-demand additions.')}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium transition"
              >
                💡 ATS Keywords
              </button>
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0d0f1b]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask AI to edit, improve, or rephrase anything..."
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isAiLoading}
                  className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition flex items-center justify-center shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </form>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: DOCUMENT PREVIEW OR FORM EDITOR             */}
          {/* ========================================================= */}
          <div
            className={`flex-1 flex flex-col overflow-hidden bg-slate-100/80 dark:bg-[#07080e] ${
              activeMobileView === 'chat' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Sub-view: FORM EDITOR */}
            {(desktopRightView === 'editor' || activeMobileView === 'editor') && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6 sidebar-scroll">
                {/* Form Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  {[
                    { id: 'personal', label: 'Contact Info', icon: 'person' },
                    { id: 'summary', label: 'Summary', icon: 'short_text' },
                    { id: 'experience', label: 'Experience', icon: 'work' },
                    { id: 'projects', label: 'Projects', icon: 'code' },
                    { id: 'education', label: 'Education', icon: 'school' },
                    { id: 'skills', label: 'Skills', icon: 'psychology' },
                    { id: 'honors', label: 'Honors', icon: 'military_tech' },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setActiveFormSection(sec.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeFormSection === sec.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{sec.icon}</span>
                      <span>{sec.label}</span>
                    </button>
                  ))}
                </div>

                {/* Section: Personal Info */}
                {activeFormSection === 'personal' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-500">person</span>
                      Personal &amp; Contact Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Full Name</label>
                        <input
                          type="text"
                          value={resume.personalInfo.fullName}
                          onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Target Title / Headline</label>
                        <input
                          type="text"
                          value={resume.personalInfo.headline}
                          onChange={(e) => handlePersonalInfoChange('headline', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Email Address</label>
                        <input
                          type="email"
                          value={resume.personalInfo.email}
                          onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Phone Number</label>
                        <input
                          type="text"
                          value={resume.personalInfo.phone}
                          onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Location</label>
                        <input
                          type="text"
                          value={resume.personalInfo.location}
                          onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">LinkedIn URL</label>
                        <input
                          type="text"
                          value={resume.personalInfo.linkedin}
                          onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">GitHub URL</label>
                        <input
                          type="text"
                          value={resume.personalInfo.github}
                          onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Portfolio / Website</label>
                        <input
                          type="text"
                          value={resume.personalInfo.portfolio}
                          onChange={(e) => handlePersonalInfoChange('portfolio', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section: Summary */}
                {activeFormSection === 'summary' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">short_text</span>
                        Professional Summary
                      </h3>
                      <button
                        onClick={() => requestFieldPolish('Professional Summary', resume.summary)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                        AI Polish
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={resume.summary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      placeholder="Write 2-3 high-impact sentences describing your technical strengths and engineering achievements..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed text-slate-800 dark:text-white"
                    />
                    <div className="text-[11px] text-slate-400 text-right">
                      {resume.summary.split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>
                )}

                {/* Section: Experience */}
                {activeFormSection === 'experience' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">work</span>
                        Work Experience &amp; Internships ({resume.experience.length})
                      </h3>
                      <button
                        onClick={() => {
                          const newExp = {
                            id: `exp-${Date.now()}`,
                            role: 'Software Engineer',
                            company: 'Company Name',
                            location: 'City, Country',
                            startDate: 'Month Year',
                            endDate: 'Present',
                            current: true,
                            highlights: ['Architected scalable features, achieving measurable business growth.'],
                          };
                          setResume((prev) => ({ ...prev, experience: [newExp, ...prev.experience] }));
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Position
                      </button>
                    </div>

                    {resume.experience.map((exp, index) => (
                      <div
                        key={exp.id}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                            Position #{index + 1}
                          </span>
                          <button
                            onClick={() =>
                              setResume((prev) => ({
                                ...prev,
                                experience: prev.experience.filter((e) => e.id !== exp.id),
                              }))
                            }
                            className="text-rose-500 hover:text-rose-600 text-xs flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Job Title / Role</label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item) =>
                                    item.id === exp.id ? { ...item, role: val } : item
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Company Name</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item) =>
                                    item.id === exp.id ? { ...item, company: val } : item
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Dates (e.g. Jan 2025 - Present)</label>
                            <input
                              type="text"
                              value={exp.startDate + (exp.endDate ? ` - ${exp.endDate}` : '')}
                              onChange={(e) => {
                                const parts = e.target.value.split('-');
                                const start = parts[0]?.trim() || '';
                                const end = parts[1]?.trim() || '';
                                setResume((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item) =>
                                    item.id === exp.id ? { ...item, startDate: start, endDate: end } : item
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Location</label>
                            <input
                              type="text"
                              value={exp.location}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume((prev) => ({
                                  ...prev,
                                  experience: prev.experience.map((item) =>
                                    item.id === exp.id ? { ...item, location: val } : item
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Bullet Highlights */}
                        <div className="space-y-2 pt-2">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Key Bullet Points (Google XYZ formula)
                          </label>
                          {exp.highlights.map((h, hIdx) => (
                            <div key={hIdx} className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs">•</span>
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newHighlights = [...exp.highlights];
                                  newHighlights[hIdx] = val;
                                  setResume((prev) => ({
                                    ...prev,
                                    experience: prev.experience.map((item) =>
                                      item.id === exp.id ? { ...item, highlights: newHighlights } : item
                                    ),
                                  }));
                                }}
                                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                              />
                              <button
                                onClick={() => {
                                  const newHighlights = exp.highlights.filter((_, idx) => idx !== hIdx);
                                  setResume((prev) => ({
                                    ...prev,
                                    experience: prev.experience.map((item) =>
                                      item.id === exp.id ? { ...item, highlights: newHighlights } : item
                                    ),
                                  }));
                                }}
                                className="text-slate-400 hover:text-rose-500 p-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newHighlights = [
                                ...exp.highlights,
                                'Engineered and shipped high-performance feature, improving user satisfaction by 25%.',
                              ];
                              setResume((prev) => ({
                                ...prev,
                                experience: prev.experience.map((item) =>
                                  item.id === exp.id ? { ...item, highlights: newHighlights } : item
                                ),
                              }));
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium pt-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">add</span>
                            Add Bullet Point
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section: Projects */}
                {activeFormSection === 'projects' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">code</span>
                        Technical Projects ({resume.projects.length})
                      </h3>
                      <button
                        onClick={() => {
                          const newProj = {
                            id: `proj-${Date.now()}`,
                            title: 'Scalable Microservice System',
                            role: 'Lead Architect',
                            link: 'https://github.com/example/project',
                            technologies: ['Python', 'Docker', 'Redis', 'PostgreSQL'],
                            highlights: [
                              'Designed and implemented low-latency caching layer, cutting response times by 40%.',
                              'Deployed automated unit and integration tests achieving 92% code coverage.',
                            ],
                          };
                          setResume((prev) => ({ ...prev, projects: [newProj, ...prev.projects] }));
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Project
                      </button>
                    </div>

                    {resume.projects.map((proj, pIdx) => (
                      <div
                        key={proj.id}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                            Project #{pIdx + 1}
                          </span>
                          <button
                            onClick={() =>
                              setResume((prev) => ({
                                ...prev,
                                projects: prev.projects.filter((p) => p.id !== proj.id),
                              }))
                            }
                            className="text-rose-500 hover:text-rose-600 text-xs flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Project Title</label>
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume((prev) => ({
                                  ...prev,
                                  projects: prev.projects.map((p) =>
                                    p.id === proj.id ? { ...p, title: val } : p
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Role / Subtitle</label>
                            <input
                              type="text"
                              value={proj.role}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume((prev) => ({
                                  ...prev,
                                  projects: prev.projects.map((p) =>
                                    p.id === proj.id ? { ...p, role: val } : p
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                              Technologies (comma separated)
                            </label>
                            <input
                              type="text"
                              value={proj.technologies.join(', ')}
                              onChange={(e) => {
                                const techs = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                                setResume((prev) => ({
                                  ...prev,
                                  projects: prev.projects.map((p) =>
                                    p.id === proj.id ? { ...p, technologies: techs } : p
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Project Highlights */}
                        <div className="space-y-2 pt-2">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Bullet Points (Impact &amp; Architecture)
                          </label>
                          {proj.highlights.map((h, hIdx) => (
                            <div key={hIdx} className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs">•</span>
                              <input
                                type="text"
                                value={h}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newHighlights = [...proj.highlights];
                                  newHighlights[hIdx] = val;
                                  setResume((prev) => ({
                                    ...prev,
                                    projects: prev.projects.map((p) =>
                                      p.id === proj.id ? { ...p, highlights: newHighlights } : p
                                    ),
                                  }));
                                }}
                                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                              />
                              <button
                                onClick={() => {
                                  const newHighlights = proj.highlights.filter((_, idx) => idx !== hIdx);
                                  setResume((prev) => ({
                                    ...prev,
                                    projects: prev.projects.map((p) =>
                                      p.id === proj.id ? { ...p, highlights: newHighlights } : p
                                    ),
                                  }));
                                }}
                                className="text-slate-400 hover:text-rose-500 p-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newHighlights = [
                                ...proj.highlights,
                                'Optimized system throughput to sustain 10k+ concurrent requests with zero packet loss.',
                              ];
                              setResume((prev) => ({
                                ...prev,
                                projects: prev.projects.map((p) =>
                                  p.id === proj.id ? { ...p, highlights: newHighlights } : p
                                ),
                              }));
                            }}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium pt-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">add</span>
                            Add Bullet Point
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section: Education */}
                {activeFormSection === 'education' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">school</span>
                        Education
                      </h3>
                      <button
                        onClick={() => {
                          const newEdu = {
                            id: `edu-${Date.now()}`,
                            degree: 'Degree Name',
                            institution: 'Institution / College',
                            location: 'City, Country',
                            startDate: '2022',
                            endDate: '2026',
                            gpa: '8.8 / 10',
                            highlights: [],
                          };
                          setResume((prev) => ({ ...prev, education: [...prev.education, newEdu] }));
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Education
                      </button>
                    </div>

                    {resume.education.map((edu) => (
                      <div
                        key={edu.id}
                        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Degree &amp; Major</label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume((prev) => ({
                                  ...prev,
                                  education: prev.education.map((item) =>
                                    item.id === edu.id ? { ...item, degree: val } : item
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Institution</label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume((prev) => ({
                                  ...prev,
                                  education: prev.education.map((item) =>
                                    item.id === edu.id ? { ...item, institution: val } : item
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Graduation Year / Range</label>
                            <input
                              type="text"
                              value={`${edu.startDate} - ${edu.endDate}`}
                              onChange={(e) => {
                                const parts = e.target.value.split('-');
                                const start = parts[0]?.trim() || '';
                                const end = parts[1]?.trim() || '';
                                setResume((prev) => ({
                                  ...prev,
                                  education: prev.education.map((item) =>
                                    item.id === edu.id ? { ...item, startDate: start, endDate: end } : item
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">GPA / Grade / Honors</label>
                            <input
                              type="text"
                              value={edu.gpa}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResume((prev) => ({
                                  ...prev,
                                  education: prev.education.map((item) =>
                                    item.id === edu.id ? { ...item, gpa: val } : item
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section: Technical Skills */}
                {activeFormSection === 'skills' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">psychology</span>
                        Technical Skills ({resume.skills.reduce((sum, s) => sum + s.items.length, 0)} keywords)
                      </h3>
                      <button
                        onClick={() => {
                          const newCat = { name: 'New Category', items: ['Skill1', 'Skill2'] };
                          setResume((prev) => ({ ...prev, skills: [...prev.skills, newCat] }));
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Category
                      </button>
                    </div>

                    {resume.skills.map((cat, cIdx) => (
                      <div
                        key={cIdx}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newSkills = [...resume.skills];
                              newSkills[cIdx] = { ...newSkills[cIdx], name: val };
                              setResume((prev) => ({ ...prev, skills: newSkills }));
                            }}
                            className="font-bold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              setResume((prev) => ({
                                ...prev,
                                skills: prev.skills.filter((_, idx) => idx !== cIdx),
                              }));
                            }}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={cat.items.join(', ')}
                          onChange={(e) => {
                            const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            const newSkills = [...resume.skills];
                            newSkills[cIdx] = { ...newSkills[cIdx], items };
                            setResume((prev) => ({ ...prev, skills: newSkills }));
                          }}
                          placeholder="Comma-separated items (e.g. Python, Docker, PostgreSQL)"
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Section: Honors & Achievements */}
                {activeFormSection === 'honors' && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">military_tech</span>
                        Honors &amp; Achievements
                      </h3>
                      <button
                        onClick={() => {
                          setResume((prev) => ({
                            ...prev,
                            achievements: [
                              ...prev.achievements,
                              'GATE CS All India Rank: Top 0.5% nationwide.',
                            ],
                          }));
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Honor
                      </button>
                    </div>

                    <div className="space-y-2">
                      {resume.achievements.map((ach, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2">
                          <span className="text-amber-500 material-symbols-outlined text-[16px]">star</span>
                          <input
                            type="text"
                            value={ach}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newAch = [...resume.achievements];
                              newAch[aIdx] = val;
                              setResume((prev) => ({ ...prev, achievements: newAch }));
                            }}
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
                          />
                          <button
                            onClick={() => {
                              setResume((prev) => ({
                                ...prev,
                                achievements: prev.achievements.filter((_, idx) => idx !== aIdx),
                              }));
                            }}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub-view: LIVE RENDERED RESUME SHEET (WITH WYSIWYG CLICK-TO-EDIT) */}
            {(desktopRightView === 'preview' || activeMobileView === 'preview') && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start sidebar-scroll">
                <div
                  ref={resumePrintRef}
                  id="resume-print-area"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  className={`resume-sheet w-full max-w-[800px] bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-11 transition-transform duration-150 ${
                    template === 'classic'
                      ? 'font-serif'
                      : template === 'compact'
                      ? 'text-[12px] leading-tight p-6 sm:p-8'
                      : 'font-sans'
                  }`}
                >
                  {/* ========================================================= */}
                  {/* RESUME TEMPLATE: MODERN TECH (DEFAULT)                    */}
                  {/* ========================================================= */}
                  {template === 'modern' && (
                    <div className="space-y-5">
                      {/* Header */}
                      <div className="border-b-2 border-indigo-600 pb-4">
                        <h1
                          contentEditable={isInlineEdit}
                          suppressContentEditableWarning
                          onBlur={(e) => handleInlinePersonalInfoBlur('fullName', e.currentTarget.textContent || '')}
                          title={isInlineEdit ? 'Click to edit Name inline' : undefined}
                          className={`text-2xl font-extrabold tracking-tight text-slate-900 ${
                            isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none focus:ring-1 focus:ring-indigo-500' : ''
                          }`}
                        >
                          {resume.personalInfo.fullName}
                        </h1>
                        <p
                          contentEditable={isInlineEdit}
                          suppressContentEditableWarning
                          onBlur={(e) => handleInlinePersonalInfoBlur('headline', e.currentTarget.textContent || '')}
                          title={isInlineEdit ? 'Click to edit Headline inline' : undefined}
                          className={`text-sm font-semibold text-indigo-700 mt-0.5 ${
                            isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none focus:ring-1 focus:ring-indigo-500' : ''
                          }`}
                        >
                          {resume.personalInfo.headline}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-2 font-medium">
                          {resume.personalInfo.email && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">mail</span>
                              <span
                                contentEditable={isInlineEdit}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlinePersonalInfoBlur('email', e.currentTarget.textContent || '')}
                                className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                              >
                                {resume.personalInfo.email}
                              </span>
                            </span>
                          )}
                          {resume.personalInfo.phone && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">call</span>
                              <span
                                contentEditable={isInlineEdit}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlinePersonalInfoBlur('phone', e.currentTarget.textContent || '')}
                                className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                              >
                                {resume.personalInfo.phone}
                              </span>
                            </span>
                          )}
                          {resume.personalInfo.location && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
                              <span
                                contentEditable={isInlineEdit}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlinePersonalInfoBlur('location', e.currentTarget.textContent || '')}
                                className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                              >
                                {resume.personalInfo.location}
                              </span>
                            </span>
                          )}
                          {resume.personalInfo.linkedin && (
                            <a href={resume.personalInfo.linkedin} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                              LinkedIn
                            </a>
                          )}
                          {resume.personalInfo.github && (
                            <a href={resume.personalInfo.github} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                              GitHub
                            </a>
                          )}
                          {resume.personalInfo.portfolio && (
                            <a href={resume.personalInfo.portfolio} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                              Portfolio
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      {resume.summary && (
                        <div className="resume-section">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2">
                            Professional Summary
                          </h2>
                          <p
                            contentEditable={isInlineEdit}
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineSummaryBlur(e.currentTarget.textContent || '')}
                            title={isInlineEdit ? 'Click to edit summary directly' : undefined}
                            className={`text-xs leading-relaxed text-slate-700 ${
                              isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none focus:ring-1 focus:ring-indigo-500' : ''
                            }`}
                          >
                            {resume.summary}
                          </p>
                        </div>
                      )}

                      {/* Experience */}
                      {resume.experience.length > 0 && (
                        <div className="resume-section space-y-3">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1">
                            Experience &amp; Internships
                          </h2>
                          {resume.experience.map((exp) => (
                            <div key={exp.id} className="space-y-1">
                              <div className="flex items-baseline justify-between text-xs">
                                <div>
                                  <span
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const val = e.currentTarget.textContent || '';
                                      setResume((prev) => ({
                                        ...prev,
                                        experience: prev.experience.map((item) => (item.id === exp.id ? { ...item, role: val } : item)),
                                      }));
                                    }}
                                    className={`font-bold text-slate-900 ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                                  >
                                    {exp.role}
                                  </span>
                                  <span
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const val = e.currentTarget.textContent?.replace(/^—\s*/, '') || '';
                                      setResume((prev) => ({
                                        ...prev,
                                        experience: prev.experience.map((item) => (item.id === exp.id ? { ...item, company: val } : item)),
                                      }));
                                    }}
                                    className={`text-slate-600 ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                                  >
                                    {' '}— {exp.company}
                                  </span>
                                </div>
                                <span className="text-slate-500 font-medium">
                                  {exp.startDate} – {exp.endDate || 'Present'} | {exp.location}
                                </span>
                              </div>
                              <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                                {exp.highlights.map((h, i) => (
                                  <li
                                    key={i}
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleInlineExpHighlightBlur(exp.id, i, e.currentTarget.textContent || '')}
                                    title={isInlineEdit ? 'Click to edit bullet point directly' : undefined}
                                    className={`leading-snug ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none focus:ring-1 focus:ring-indigo-500' : ''}`}
                                  >
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Technical Projects */}
                      {resume.projects.length > 0 && (
                        <div className="resume-section space-y-3">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1">
                            Technical Projects
                          </h2>
                          {resume.projects.map((proj) => (
                            <div key={proj.id} className="space-y-1">
                              <div className="flex items-baseline justify-between text-xs">
                                <div>
                                  <span
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const val = e.currentTarget.textContent || '';
                                      setResume((prev) => ({
                                        ...prev,
                                        projects: prev.projects.map((p) => (p.id === proj.id ? { ...p, title: val } : p)),
                                      }));
                                    }}
                                    className={`font-bold text-slate-900 ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                                  >
                                    {proj.title}
                                  </span>
                                  {proj.role && <span className="text-slate-600"> ({proj.role})</span>}
                                  {proj.link && (
                                    <a
                                      href={proj.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="ml-2 text-indigo-600 hover:underline text-[11px]"
                                    >
                                      [Demo / Code]
                                    </a>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1 text-[11px] text-slate-500">
                                  {proj.technologies.join(' • ')}
                                </div>
                              </div>
                              <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                                {proj.highlights.map((h, i) => (
                                  <li
                                    key={i}
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleInlineProjHighlightBlur(proj.id, i, e.currentTarget.textContent || '')}
                                    title={isInlineEdit ? 'Click to edit bullet point directly' : undefined}
                                    className={`leading-snug ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none focus:ring-1 focus:ring-indigo-500' : ''}`}
                                  >
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Technical Skills */}
                      {resume.skills.length > 0 && (
                        <div className="resume-section">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2">
                            Technical Skills
                          </h2>
                          <div className="space-y-1.5 text-xs">
                            {resume.skills.map((cat, i) => (
                              <div key={i} className="flex">
                                <span className="font-bold text-slate-800 w-44 flex-shrink-0">
                                  {cat.name}:
                                </span>
                                <span
                                  contentEditable={isInlineEdit}
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const items = (e.currentTarget.textContent || '').split(',').map((s) => s.trim()).filter(Boolean);
                                    const next = [...resume.skills];
                                    next[i] = { ...next[i], items };
                                    setResume((prev) => ({ ...prev, skills: next }));
                                  }}
                                  className={`text-slate-700 ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                                >
                                  {cat.items.join(', ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {resume.education.length > 0 && (
                        <div className="resume-section space-y-2">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1">
                            Education
                          </h2>
                          {resume.education.map((edu) => (
                            <div key={edu.id} className="flex items-baseline justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900">{edu.degree}</span>
                                <div className="text-slate-600">{edu.institution}</div>
                              </div>
                              <div className="text-right text-slate-500">
                                <div>
                                  {edu.startDate} – {edu.endDate}
                                </div>
                                <div className="font-semibold text-slate-700">{edu.gpa}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Achievements */}
                      {resume.achievements.length > 0 && (
                        <div className="resume-section">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1 mb-2">
                            Honors &amp; Achievements
                          </h2>
                          <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                            {resume.achievements.map((ach, i) => (
                              <li
                                key={i}
                                contentEditable={isInlineEdit}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlineAchievementBlur(i, e.currentTarget.textContent || '')}
                                className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                              >
                                {ach}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* RESUME TEMPLATE: CLASSIC IVY LEAGUE / TECH STANDARD       */}
                  {/* ========================================================= */}
                  {template === 'classic' && (
                    <div className="space-y-4 font-serif">
                      <div className="text-center border-b border-slate-900 pb-3">
                        <h1
                          contentEditable={isInlineEdit}
                          suppressContentEditableWarning
                          onBlur={(e) => handleInlinePersonalInfoBlur('fullName', e.currentTarget.textContent || '')}
                          className={`text-2xl font-bold tracking-normal uppercase text-slate-900 ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                        >
                          {resume.personalInfo.fullName}
                        </h1>
                        <p
                          contentEditable={isInlineEdit}
                          suppressContentEditableWarning
                          onBlur={(e) => handleInlinePersonalInfoBlur('headline', e.currentTarget.textContent || '')}
                          className={`text-xs text-slate-700 italic mt-0.5 ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                        >
                          {resume.personalInfo.headline}
                        </p>
                        <div className="text-xs text-slate-700 mt-1.5 flex flex-wrap justify-center gap-x-3">
                          {resume.personalInfo.location && <span>{resume.personalInfo.location}</span>}
                          {resume.personalInfo.phone && <span>• {resume.personalInfo.phone}</span>}
                          {resume.personalInfo.email && <span>• {resume.personalInfo.email}</span>}
                        </div>
                      </div>

                      {resume.summary && (
                        <div className="resume-section">
                          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-slate-900 pb-0.5 mb-1.5">
                            Professional Summary
                          </h2>
                          <p
                            contentEditable={isInlineEdit}
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineSummaryBlur(e.currentTarget.textContent || '')}
                            className={`text-xs leading-relaxed text-slate-800 ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                          >
                            {resume.summary}
                          </p>
                        </div>
                      )}

                      {resume.education.length > 0 && (
                        <div className="resume-section space-y-1.5">
                          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-slate-900 pb-0.5">
                            Education
                          </h2>
                          {resume.education.map((edu) => (
                            <div key={edu.id} className="text-xs">
                              <div className="flex justify-between font-bold">
                                <span>{edu.institution}</span>
                                <span>{edu.startDate} – {edu.endDate}</span>
                              </div>
                              <div className="flex justify-between italic text-slate-700">
                                <span>{edu.degree}</span>
                                <span>{edu.gpa}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {resume.experience.length > 0 && (
                        <div className="resume-section space-y-2.5">
                          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-slate-900 pb-0.5">
                            Experience
                          </h2>
                          {resume.experience.map((exp) => (
                            <div key={exp.id} className="text-xs space-y-1">
                              <div className="flex justify-between font-bold">
                                <span>{exp.company}</span>
                                <span className="font-normal">{exp.startDate} – {exp.endDate || 'Present'}</span>
                              </div>
                              <div className="flex justify-between italic text-slate-700">
                                <span>{exp.role}</span>
                                <span>{exp.location}</span>
                              </div>
                              <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-800">
                                {exp.highlights.map((h, i) => (
                                  <li
                                    key={i}
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleInlineExpHighlightBlur(exp.id, i, e.currentTarget.textContent || '')}
                                    className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                                  >
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {resume.projects.length > 0 && (
                        <div className="resume-section space-y-2">
                          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-slate-900 pb-0.5">
                            Technical Projects
                          </h2>
                          {resume.projects.map((proj) => (
                            <div key={proj.id} className="text-xs space-y-0.5">
                              <div className="font-bold flex justify-between">
                                <span>{proj.title} <span className="font-normal italic">| {proj.technologies.join(', ')}</span></span>
                              </div>
                              <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-800">
                                {proj.highlights.map((h, i) => (
                                  <li
                                    key={i}
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleInlineProjHighlightBlur(proj.id, i, e.currentTarget.textContent || '')}
                                    className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                                  >
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {resume.skills.length > 0 && (
                        <div className="resume-section">
                          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-slate-900 pb-0.5 mb-1.5">
                            Technical Skills
                          </h2>
                          <div className="text-xs space-y-1 text-slate-800">
                            {resume.skills.map((cat, i) => (
                              <div key={i}>
                                <span className="font-bold">{cat.name}: </span>
                                <span>{cat.items.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {resume.achievements.length > 0 && (
                        <div className="resume-section">
                          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-slate-900 pb-0.5 mb-1.5">
                            Honors &amp; Awards
                          </h2>
                          <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-800">
                            {resume.achievements.map((ach, i) => (
                              <li
                                key={i}
                                contentEditable={isInlineEdit}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlineAchievementBlur(i, e.currentTarget.textContent || '')}
                                className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                              >
                                {ach}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* RESUME TEMPLATE: MINIMALIST / COMPACT                     */}
                  {/* ========================================================= */}
                  {(template === 'minimal' || template === 'compact') && (
                    <div className="space-y-4 font-sans text-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline border-b border-slate-300 pb-2">
                        <div>
                          <h1
                            contentEditable={isInlineEdit}
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlinePersonalInfoBlur('fullName', e.currentTarget.textContent || '')}
                            className={`text-xl font-black text-slate-900 uppercase tracking-tight ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                          >
                            {resume.personalInfo.fullName}
                          </h1>
                          <p
                            contentEditable={isInlineEdit}
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlinePersonalInfoBlur('headline', e.currentTarget.textContent || '')}
                            className={`text-xs font-medium text-slate-600 ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                          >
                            {resume.personalInfo.headline}
                          </p>
                        </div>
                        <div className="text-[11px] text-slate-500 sm:text-right mt-1 sm:mt-0 space-y-0.5">
                          <div>{resume.personalInfo.email} | {resume.personalInfo.phone}</div>
                          <div>{resume.personalInfo.location}</div>
                        </div>
                      </div>

                      {resume.summary && (
                        <div className="resume-section">
                          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1">
                            Overview
                          </h2>
                          <p
                            contentEditable={isInlineEdit}
                            suppressContentEditableWarning
                            onBlur={(e) => handleInlineSummaryBlur(e.currentTarget.textContent || '')}
                            className={`text-slate-700 leading-normal ${isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}`}
                          >
                            {resume.summary}
                          </p>
                        </div>
                      )}

                      {resume.experience.length > 0 && (
                        <div className="resume-section space-y-2">
                          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">
                            Experience
                          </h2>
                          {resume.experience.map((exp) => (
                            <div key={exp.id} className="space-y-0.5">
                              <div className="flex justify-between font-bold text-slate-900">
                                <span>{exp.role} · <span className="font-normal text-slate-600">{exp.company}</span></span>
                                <span className="text-slate-500 font-normal">{exp.startDate} – {exp.endDate || 'Present'}</span>
                              </div>
                              <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                                {exp.highlights.map((h, i) => (
                                  <li
                                    key={i}
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleInlineExpHighlightBlur(exp.id, i, e.currentTarget.textContent || '')}
                                    className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                                  >
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {resume.projects.length > 0 && (
                        <div className="resume-section space-y-2">
                          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5">
                            Projects
                          </h2>
                          {resume.projects.map((proj) => (
                            <div key={proj.id} className="space-y-0.5">
                              <div className="flex justify-between font-bold text-slate-900">
                                <span>
                                  {proj.title}
                                  <span className="font-mono text-[10px] ml-2 text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">
                                    {proj.technologies.slice(0, 4).join(', ')}
                                  </span>
                                </span>
                              </div>
                              <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                                {proj.highlights.map((h, i) => (
                                  <li
                                    key={i}
                                    contentEditable={isInlineEdit}
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleInlineProjHighlightBlur(proj.id, i, e.currentTarget.textContent || '')}
                                    className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                                  >
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {resume.skills.length > 0 && (
                        <div className="resume-section">
                          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1">
                            Skills &amp; Technologies
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
                            {resume.skills.map((cat, i) => (
                              <div key={i}>
                                <span className="font-bold text-slate-900">{cat.name}: </span>
                                <span>{cat.items.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {resume.education.length > 0 && (
                        <div className="resume-section">
                          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1">
                            Education
                          </h2>
                          {resume.education.map((edu) => (
                            <div key={edu.id} className="flex justify-between text-slate-800">
                              <span><strong>{edu.degree}</strong>, {edu.institution}</span>
                              <span className="text-slate-500">{edu.startDate} – {edu.endDate} | {edu.gpa}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {resume.achievements.length > 0 && (
                        <div className="resume-section">
                          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-0.5 mb-1">
                            Honors
                          </h2>
                          <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700">
                            {resume.achievements.map((ach, i) => (
                              <li
                                key={i}
                                contentEditable={isInlineEdit}
                                suppressContentEditableWarning
                                onBlur={(e) => handleInlineAchievementBlur(i, e.currentTarget.textContent || '')}
                                className={isInlineEdit ? 'hover:bg-indigo-50/60 rounded px-1 cursor-text focus:outline-none' : ''}
                              >
                                {ach}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL 1: JOB DESCRIPTION MATCH & TAILOR                   */}
        {/* ========================================================= */}
        {jdModalOpen && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto sidebar-scroll">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-[22px]">target</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Target Job Description Matcher
                    </h3>
                    <p className="text-xs text-slate-500">Scan JD requirements, compute ATS match score, and auto-tailor</p>
                  </div>
                </div>
                <button
                  onClick={() => setJdModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Paste JD Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Paste Target Job Posting / Description
                </label>
                <textarea
                  rows={6}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the job description from LinkedIn, Indeed, or career page here..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleAnalyzeJdMatch}
                  disabled={!jdText.trim() || isMatchingJd}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl transition flex items-center gap-1.5"
                >
                  {isMatchingJd ? (
                    <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">analytics</span>
                  )}
                  <span>Calculate Match %</span>
                </button>
              </div>

              {/* Match Result Display */}
              {jdMatch && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Target Role: {jdMatch.role_summary}
                      </div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                        {jdMatch.match_percentage}% <span className="text-xs font-medium text-slate-500">Compatibility</span>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-full border-4 border-amber-500 flex items-center justify-center font-black text-lg text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 shadow-sm">
                      {jdMatch.match_percentage}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl space-y-1.5">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Matching Skills ({jdMatch.matching_skills.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {jdMatch.matching_skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded text-[11px] font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 rounded-xl space-y-1.5">
                      <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        Missing JD Keywords ({jdMatch.missing_skills.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {jdMatch.missing_skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded text-[11px] font-medium">
                            +{s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Tailor Action */}
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-[11px] text-slate-500">
                      AI will reframe summary and bullet points to match this job.
                    </span>
                    <button
                      onClick={handleApplyTailoredResume}
                      disabled={isTailoringJd}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      {isTailoringJd ? (
                        <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[17px]">auto_fix_high</span>
                      )}
                      <span>✨ 1-Click Tailor Resume to this Job</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 2: CLOUD VERSIONS & MULTI-RESUME MANAGER           */}
        {/* ========================================================= */}
        {cloudModalOpen && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[85vh] overflow-y-auto sidebar-scroll">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Cloud Resume Profiles
                    </h3>
                    <p className="text-xs text-slate-500">Save and switch between tailored versions</p>
                  </div>
                </div>
                <button
                  onClick={() => setCloudModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Version List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>SAVED VERSIONS</span>
                  <button
                    onClick={handleCreateNewVersion}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                    New Version
                  </button>
                </div>

                {cloudVersions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No cloud resumes saved yet. Click &quot;Save Cloud&quot; to back up your current resume!
                  </div>
                ) : (
                  cloudVersions.map((item) => (
                    <div
                      key={item.resume_id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${
                        item.resume_id === activeResumeId
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                          <span>{item.title}</span>
                          {item.resume_id === activeResumeId && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-600 text-white font-semibold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ATS Score: {item.ats_score}% • Updated {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.resume_id !== activeResumeId && (
                          <button
                            onClick={() => handleLoadCloudVersion(item)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
                          >
                            Load
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteCloudVersion(item.resume_id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          title="Delete version"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setCloudModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL 3: ATS AUDIT BREAKDOWN MODAL                        */}
        {/* ========================================================= */}
        {atsModalOpen && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 max-w-xl w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto sidebar-scroll">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined text-[22px]">verified</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      ATS Resume Analysis &amp; Audit
                    </h3>
                    <p className="text-xs text-slate-500">Industry benchmark for applicant tracking systems</p>
                  </div>
                </div>
                <button
                  onClick={() => setAtsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Overall Score Banner */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/25 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    ATS Readiness Rating
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {atsScore} <span className="text-base font-medium text-slate-400">/ 100</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {atsScore >= 85
                      ? 'Excellent! High probability of passing recruiter filters and keyword screening.'
                      : atsScore >= 70
                      ? 'Solid foundation. A few metric additions will push you into the top tier.'
                      : 'Needs refinement. Use the AI suggestions below to optimize impact.'}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-xl text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm">
                  {atsScore}%
                </div>
              </div>

              {/* Strengths */}
              {atsAnalysis?.strengths && atsAnalysis.strengths.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>
                    Identified Strengths
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {atsAnalysis.strengths.map((st, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60"
                      >
                        ✓ {st}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvements */}
              {atsAnalysis?.improvements && atsAnalysis.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-[16px]">trending_up</span>
                    Recommended Enhancements
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {atsAnalysis.improvements.map((imp, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between"
                      >
                        <span>• {imp}</span>
                        <button
                          onClick={() => {
                            setAtsModalOpen(false);
                            handleSendMessage(`Please help me fix this ATS recommendation: "${imp}"`);
                          }}
                          className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 transition cursor-pointer"
                        >
                          Ask AI to Fix
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing High-Demand Keywords */}
              {atsAnalysis?.missing_keywords && atsAnalysis.missing_keywords.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-500 text-[16px]">tag</span>
                    Suggested Tech Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.missing_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-mono"
                      >
                        +{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setAtsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
