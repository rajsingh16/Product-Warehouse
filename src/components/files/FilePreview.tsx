import { Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fileService, isImageType, isPdfType } from '../../services/fileService';
import type { ProjectFile } from '../../types';

import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface FilePreviewProps {
  file: ProjectFile | null;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [actionError, setActionError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fileType = file?.type?.toLowerCase() ?? '';
  const isImage = isImageType(fileType);
  const isPdf = isPdfType(fileType);
  const fileId = file?.id;

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    setPreviewUrl(null);
    setPreviewError('');
    setActionError('');

    if (!file || (!isImage && !isPdf)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fileService
      .getPreviewUrl(file)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        createdUrl = url;
        setPreviewUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setPreviewError(err instanceof Error ? err.message : 'Unable to preview this file.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Revoke only when the file changes or the modal unmounts, never right after assigning src.
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, isImage, isPdf]);

  if (!file) return null;

  const handleDownload = async () => {
    setActionError('');
    setDownloading(true);
    try {
      await fileService.downloadFile(file);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to download file.');
    } finally {
      setDownloading(false);
    }
  };

  const renderPreview = () => {
    if (!isImage && !isPdf) {
      return (
        <div className="flex min-h-[400px] items-center justify-center text-center">
          <p className="text-slate-600">Preview is not available for this file type.</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading preview...</p>
          </div>
        </div>
      );
    }

    if (previewError || !previewUrl) {
      return (
        <div className="flex min-h-[400px] items-center justify-center px-4 text-center">
          <p className="text-sm text-red-600">{previewError || 'Unable to load preview.'}</p>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex max-h-[70vh] min-h-[400px] items-center justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-[65vh] max-w-full object-contain"
            onError={() => setPreviewError('The image could not be displayed.')}
          />
        </div>
      );
    }

    return (
      <div className="h-[70vh] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <iframe src={previewUrl} title={`Preview of ${file.name}`} className="h-full w-full border-0" />
      </div>
    );
  };

  return (
    <Modal isOpen={!!file} onClose={onClose} title={file.name} size="xl">
      {renderPreview()}

      {/* The ONLY Download button */}
      <div className="mt-4 flex flex-col items-end gap-2 border-t border-slate-200 pt-4">
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        <Button variant="secondary" onClick={handleDownload} isLoading={downloading}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    </Modal>
  );
}