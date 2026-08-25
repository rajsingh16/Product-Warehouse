import { Download, Eye, Trash2 } from 'lucide-react';
import { formatDate, formatFileSize } from '../../data/mockData';
import { fileService, getFileTypeLabel } from '../../services/fileService';
import type { ProjectFile } from '../../types';
import { Button } from '../common/Button';
import { FileIcon } from './FileIcon';

interface FileTableProps {
  files: ProjectFile[];
  onPreview: (file: ProjectFile) => void;
  onDelete?: (file: ProjectFile) => void;
}

export function FileTable({ files, onPreview, onDelete }: FileTableProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">No files in this folder. Upload files to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">File Name</th>
              <th className="px-4 py-3 font-medium text-slate-600">File Type</th>
              <th className="px-4 py-3 font-medium text-slate-600">Size</th>
              <th className="px-4 py-3 font-medium text-slate-600">Uploaded By</th>
              <th className="px-4 py-3 font-medium text-slate-600">Uploaded Date</th>
              <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileIcon type={file.type} />
                    <span className="font-medium text-slate-900">{file.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{getFileTypeLabel(file.type)}</td>
                <td className="px-4 py-3 text-slate-600">{formatFileSize(file.size)}</td>
                <td className="px-4 py-3 text-slate-600">{file.uploadedBy}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(file.uploadedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onPreview(file)}>
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => fileService.downloadFile(file)}>
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    {onDelete && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(file)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
