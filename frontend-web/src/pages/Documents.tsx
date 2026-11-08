import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getDocuments, uploadDocument, deleteDocument } from '../services/api';

interface DocCard {
  filename: string;
  status: 'ready' | 'indexing';
}

const FILTER_SUBJECTS = ['All', 'PDF', 'Word / Text', 'OCR Images'];

function getFileTypeCategory(filename: string): 'pdf' | 'doc' | 'image' | 'text' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp'].includes(ext)) return 'image';
  return 'text';
}

function iconForCategory(cat: string): { icon: string; bg: string; text: string } {
  switch (cat) {
    case 'pdf':
      return { icon: 'picture_as_pdf', bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50', text: 'text-rose-600 dark:text-rose-400' };
    case 'doc':
      return { icon: 'description', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50', text: 'text-blue-600 dark:text-blue-400' };
    case 'image':
      return { icon: 'image', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50', text: 'text-purple-600 dark:text-purple-400' };
    default:
      return { icon: 'article', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400' };
  }
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export default function Documents() {
  const [docs, setDocs] = useState<DocCard[]>([]);
  const [usedBytes, setUsedBytes] = useState(0);
  const [limitBytes, setLimitBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const refetch = async () => {
    try {
      const res = await getDocuments();
      setDocs(res.documents.map((filename) => ({ filename, status: 'ready' as const })));
      setUsedBytes(res.used_bytes);
      setLimitBytes(res.limit_bytes);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    setError('');
    setUploading(true);
    setDocs((prev) => [...prev, { filename: file.name, status: 'indexing' }]);
    try {
      await uploadDocument(file);
      await refetch();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Upload failed.');
      setDocs((prev) => prev.filter((d) => !(d.filename === file.name && d.status === 'indexing')));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadFile(file);
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Delete "${filename}" from your knowledge base?`)) return;
    try {
      await deleteDocument(filename);
      await refetch();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete document.');
    }
  };

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchesSearch = d.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const cat = getFileTypeCategory(d.filename);
      if (selectedFilter === 'PDF') return matchesSearch && cat === 'pdf';
      if (selectedFilter === 'Word / Text') return matchesSearch && (cat === 'doc' || cat === 'text');
      if (selectedFilter === 'OCR Images') return matchesSearch && cat === 'image';
      return matchesSearch;
    });
  }, [docs, searchQuery, selectedFilter]);

  const usedPercent = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0;

  return (
    <Layout activePage="documents" title="Study Document Library" searchPlaceholder="Search uploaded documents...">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
        {/* Top Header Card with Resq Beam Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 resq-hero-dark text-white border border-indigo-500/20 overflow-hidden shadow-xl">
          <div className="resq-beam" />
          <div className="resq-beam-right" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-indigo-200">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                <span>Personalized RAG Knowledge Base</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text tracking-tight">
                Your Uploaded Study Materials &amp; Notes
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Files are automatically parsed, chunked, and embedded into pgvector with FastEmbed so the AI can answer exact exam questions from your textbook notes.
              </p>
            </div>

            {/* Storage Progress Meter */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full md:w-72 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Vector Storage</span>
                <span className="font-bold text-white">{formatMB(usedBytes)} MB / {limitBytes > 0 ? formatMB(limitBytes) : '50.0'} MB</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${Math.max(5, usedPercent)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{docs.length} Active Documents</span>
                <span>{usedPercent}% Used</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drag and Drop Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-500/60 bg-white/60 dark:bg-[#0f111e]/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".md,.txt,.pdf,.docx,.jpg,.jpeg,.png,.bmp,.tiff,.webp"
            onChange={handleFileChange}
          />
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">
                {uploading ? 'hourglass_top' : 'cloud_upload'}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {uploading ? 'Processing & embedding document...' : 'Click to upload or drag & drop files here'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports PDF, DOCX, Markdown, Text notes, and Handwritten OCR Images (PNG/JPG)
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-[14px] text-emerald-500">verified</span>
              <span>Encrypted &amp; private to your account</span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Search & Subject Category Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {FILTER_SUBJECTS.map((chip) => {
              const active = selectedFilter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setSelectedFilter(chip)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-white dark:bg-[#0f111e] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* Quick Filter Search Input */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
              filter_list
            </span>
            <input
              type="text"
              placeholder="Filter by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#0f111e] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-indigo-500 animate-spin">progress_activity</span>
            <p className="text-xs text-slate-400">Loading your knowledge documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <span className="material-symbols-outlined text-3xl">folder_off</span>
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              {searchQuery ? 'No matching documents found' : 'No documents uploaded yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload your syllabus notes, standard textbook summaries, or handwritten formulas to start chatting.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const cat = getFileTypeCategory(doc.filename);
              const { icon, bg, text } = iconForCategory(cat);

              return (
                <div
                  key={doc.filename}
                  className="group relative rounded-2xl p-5 bg-white dark:bg-[#0f111e] border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${bg}`}>
                        <span className={`material-symbols-outlined text-[22px] ${text}`}>{icon}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.filename)}
                        title="Delete document"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </div>

                    <div>
                      <h3
                        className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                        title={doc.filename}
                      >
                        {doc.filename}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {cat}
                        </span>
                        {doc.status === 'ready' ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Indexed &amp; Ready
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                            <span className="material-symbols-outlined text-[13px] animate-spin">sync</span>
                            Chunking...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/chat?prompt=Summarize the key GATE concepts from ${encodeURIComponent(doc.filename)}`)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                      <span>Chat with this</span>
                    </button>
                    <span className="text-[10px] text-slate-400">Vector Embeddings Active</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
