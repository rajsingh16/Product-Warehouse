import { Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { formatFileSize } from '../../data/mockData';
import { isSupportedFile } from '../../services/fileService';
import { Button } from '../common/Button';

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
}

interface SelectedFile {
  file: File;
  id: string;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedFile[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return;
    setError('');
    setStatus('idle');

    const newFiles: SelectedFile[] = [];
    const invalid: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (!isSupportedFile(file.name)) {
        invalid.push(file.name);
      } else {
        newFiles.push({ file, id: `${file.name}-${file.size}-${Date.now()}` });
      }
    });

    if (invalid.length > 0) {
      setError('This file type is not supported.');
    }

    if (newFiles.length > 0) {
      setSelected((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setSelected((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (selected.length === 0) return;
    setUploading(true);
    setProgress(0);
    setError('');
    setStatus('idle');

    const progressInterval = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 10));
    }, 150);

    try {
      await onUpload(selected.map((s) => s.file));
      setStatus('success');
      setSelected([]);
      setProgress(100);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.doc,.docx,.pdf,.xls,.xlsx,.csv,.json,.jpg,.jpeg,.png,.gif,.webp"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Button variant="secondary" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>

        {selected.length > 0 && (
          <Button onClick={handleUpload} isLoading={uploading}>
            Upload {selected.length} file{selected.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {selected.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selected.map(({ file, id }) => (
            <li
              key={id}
              className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="truncate text-slate-700">
                {file.name} — {formatFileSize(file.size)}
              </span>
              <button
                onClick={() => removeFile(id)}
                className="ml-2 rounded p-1 hover:bg-slate-200"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-slate-700 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Uploading...</p>
        </div>
      )}

      {status === 'success' && (
        <p className="mt-3 text-sm text-green-600">Files uploaded successfully.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
