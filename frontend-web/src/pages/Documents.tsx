import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { getDocuments, uploadDocument, deleteDocument } from '../services/api';

interface DocCard {
  filename: string;
  status: 'ready' | 'indexing';
}

const FILTER_CHIPS = ['All', 'OS', 'CN', 'DBMS', 'Algorithms', 'TOC'];

function iconForFile(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'picture_as_pdf';
  if (['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp'].includes(ext)) return 'image';
  return 'article';
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
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    // Optimistic "Indexing..." card
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

  const handleDelete = async (filename: string) => {
    setMenuOpenFor(null);
    try {
      await deleteDocument(filename);
      await refetch();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to delete document.');
    }
  };

  return (
    <Layout activePage="documents" searchPlaceholder="Search documents...">
      <div className="p-gutter max-w-container-max mx-auto w-full">
        {/* Page Header & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-text-primary">Study Documents</h1>
            <p className="font-body-md text-body-md text-text-muted mt-1">
              Manage and review your reference materials.
            </p>
            {limitBytes > 0 && (
              <p className="font-label-sm text-label-sm text-text-muted mt-2">
                {formatMB(usedBytes)} MB / {formatMB(limitBytes)} MB used
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".md,.txt,.pdf,.docx,.jpg,.jpeg,.png,.bmp,.tiff,.webp"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-[16px] font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-soft hover:shadow-hover disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">
                {uploading ? 'hourglass_top' : 'add'}
              </span>
              {uploading ? 'Uploading...' : 'Upload Study Material'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-error-container/40 border border-error/30 text-error font-label-sm text-label-sm">
            {error}
          </div>
        )}

        {/* Filter Bar (visually present, non-functional) */}
        <div className="flex flex-wrap items-center gap-3 mb-8 border-b border-border pb-4">
          <span className="font-label-md text-label-md text-text-muted mr-2">Filter by Subject:</span>
          {FILTER_CHIPS.map((chip, i) =>
            i === 0 ? (
              <button
                key={chip}
                className="px-4 py-1.5 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm border border-secondary-container/30 hover:bg-secondary-container/30 transition-colors"
              >
                {chip}
              </button>
            ) : (
              <button
                key={chip}
                className="px-4 py-1.5 rounded-full bg-surface border border-border text-text-muted font-label-sm text-label-sm hover:border-primary hover:text-primary transition-colors"
              >
                {chip}
              </button>
            ),
          )}
        </div>

        {loading ? (
          <p className="text-text-muted font-body-md text-body-md">Loading documents...</p>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 py-24">
            <span className="material-symbols-outlined text-6xl text-outline-variant">description</span>
            <h3 className="font-headline-sm text-headline-sm text-text-primary">No documents yet</h3>
            <p className="font-body-md text-body-md text-text-muted max-w-sm">
              Upload your first study material to start chatting with your notes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {docs.map((doc) => (
              <div
                key={doc.filename}
                className="bg-surface rounded-[16px] p-6 shadow-soft hover:shadow-hover border border-border flex flex-col group cursor-pointer relative overflow-hidden transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container/10 transition-colors">
                    <span
                      className="material-symbols-outlined text-[28px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {iconForFile(doc.filename)}
                    </span>
                  </div>
                  <div className="relative">
                    <button
                      className="text-text-muted hover:text-primary transition-colors"
                      onClick={() =>
                        setMenuOpenFor((cur) => (cur === doc.filename ? null : doc.filename))
                      }
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {menuOpenFor === doc.filename && (
                      <div className="absolute right-0 top-8 z-10 bg-surface border border-border rounded-lg shadow-hover py-1 min-w-[120px]">
                        <button
                          onClick={() => handleDelete(doc.filename)}
                          className="w-full text-left px-4 py-2 text-error font-label-sm text-label-sm hover:bg-error-container/20 transition-colors flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3
                  className="font-headline-sm text-headline-sm text-text-primary mb-2 line-clamp-2"
                  title={doc.filename}
                >
                  {doc.filename}
                </h3>
                <div className="mt-auto pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    {doc.status === 'ready' ? (
                      <span className="flex items-center gap-1 text-success font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-text-muted font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                        Indexing...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
