import { useState } from 'react';
import Layout from '../components/Layout';
import { solveDoubt } from '../services/api';

export default function Doubts() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [answer, setAnswer] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setAnswer('');
    setExtractedText('');
    setLoading(true);
    try {
      const result = await solveDoubt({ message, subject, topic, file });
      setAnswer(result.answer);
      setExtractedText(result.extracted_text);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Could not solve this doubt. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !loading && (message.trim() || file);

  return (
    <Layout activePage="doubts" title="Doubt Solver">
      <div className="max-w-container-max mx-auto px-4 md:px-gutter pb-12 grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        <section className="lg:col-span-5 bg-surface rounded-lg border border-border shadow-soft p-6 space-y-5">
          <div>
            <h2 className="font-headline-md text-headline-md text-text-primary mb-2">Ask a Doubt</h2>
            <p className="font-body-md text-body-md text-text-muted">Type your question or upload a handwritten/photo doubt.</p>
          </div>

          {error && <div className="bg-error-container/30 border border-error/30 text-on-error-container rounded-lg p-3 font-body-md text-body-md">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="rounded-lg border border-border bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic"
              className="rounded-lg border border-border bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe where you are stuck..."
            rows={8}
            className="w-full rounded-lg border border-border bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
          />

          <label className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-4 cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-primary">upload_file</span>
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-text-primary truncate">{file ? file.name : 'Upload image or file'}</p>
                <p className="font-label-sm text-label-sm text-text-muted">PNG, JPG, PDF, DOCX, TXT</p>
              </div>
            </div>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.bmp,.tiff,.webp,.pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full bg-primary text-white rounded-lg py-3 font-label-md text-label-md hover:bg-on-primary-fixed-variant disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Solve Doubt
          </button>
        </section>

        <section className="lg:col-span-7 space-y-5">
          <div className="bg-surface rounded-lg border border-border shadow-soft p-6 min-h-[320px]">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <span className="material-symbols-outlined">school</span>
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Tutor Answer</h3>
            </div>
            {answer ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-body-md text-body-md text-on-surface-variant">{answer}</div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center text-text-muted">
                <span className="material-symbols-outlined text-5xl text-primary mb-3">psychology_alt</span>
                <p className="font-body-md text-body-md">Your structured explanation will appear here.</p>
              </div>
            )}
          </div>

          {extractedText && (
            <details className="bg-surface rounded-lg border border-border shadow-soft p-5">
              <summary className="cursor-pointer font-label-md text-label-md text-text-primary">OCR text extracted from upload</summary>
              <pre className="mt-4 whitespace-pre-wrap font-code text-code text-on-surface-variant bg-surface-container-low rounded-lg p-4 overflow-auto max-h-80">{extractedText}</pre>
            </details>
          )}
        </section>
      </div>
    </Layout>
  );
}