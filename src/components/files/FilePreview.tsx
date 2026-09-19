import { Download } from 'lucide-react';
import { fileService } from '../../services/fileService';
import type { ProjectFile } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface FilePreviewProps {
  file: ProjectFile | null;
  onClose: () => void;
}

const OFFICE_TYPES = ['doc', 'docx', 'xls', 'xlsx'];

export function FilePreview({ file, onClose }: FilePreviewProps) {
  if (!file) return null;

  const isImage = ['jpg', 'jpeg'].includes(file.type);
  const isPdf = file.type === 'pdf';
  const isText = ['txt', 'csv', 'json'].includes(file.type);
  const isOffice = OFFICE_TYPES.includes(file.type);

  const renderContent = () => {
    if (isImage || isPdf || isText || isOffice) {
      return (
        <div className="py-8 text-center">
          <p className="text-slate-600">Preview not available in prototype.</p>
          <p className="mt-2 text-sm text-slate-500">
            Download the file to view it in the appropriate application.
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => fileService.downloadFile(file)}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      );
    }

    return (
      <div className="py-8 text-center">
        <p className="text-slate-600">Preview not available for this file.</p>
        <Button className="mt-4" variant="secondary" onClick={() => fileService.downloadFile(file)}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    );
  };

  return (
    <Modal isOpen={!!file} onClose={onClose} title={file.name} size="xl">
      {renderContent()}
    </Modal>
  );
}
