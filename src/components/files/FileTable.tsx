import { Download, Eye,Folder as FolderIcon, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom'
import { formatDate, formatFileSize } from '../../data/mockData';
import { fileService, getFileTypeLabel } from '../../services/fileService';
import type { Folder, ProjectFile } from '../../types';
import { Button } from '../common/Button';
import { FileIcon } from './FileIcon';
import { useEffect, useState, useMemo } from 'react';
import { Pagination } from '../common/Pagination';

interface FileTableProps {
  files: ProjectFile[]; 
  folders?: Folder[];
  project: string;
  onPreview?: (file: ProjectFile) => void;
  onDelete?: (file: ProjectFile) => void;
}

export function FileTable({ files,folders =[], project, onPreview, onDelete }: FileTableProps) {

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [files.length, folders.length]);

  const total = folders.length + files.length;

  const visibleFolders = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return folders.slice(
      Math.max(0, startIndex),
      Math.min(folders.length, endIndex)
    );
  }, [folders, page, pageSize]);

  const visibleFiles = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return files.slice(
      Math.max(0, startIndex - folders.length),
      Math.max(0, endIndex - folders.length)
    );
  }, [files, folders.length, page, pageSize]);

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <p className="text-slate-500">No files in this folder. Upload files to get started.</p>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
      <div className="max-h-[calc(100vh-26rem)] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 font-medium text-slate-600">File Type</th>
              <th className="px-4 py-3 font-medium text-slate-600">Size</th>
              <th className="px-4 py-3 font-medium text-slate-600">Uploaded By</th>
              <th className="px-4 py-3 font-medium text-slate-600">Modified On</th>
              <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
          {visibleFolders.map((folder) => (
              <tr key={folder.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    to={`/projects/${project}/${folder.id}`}
                    className="flex items-center gap-2 font-medium text-slate-900 hover:underline"
                  >
                    <FolderIcon className="h-5 w-5 text-slate-500" />
                    <span>{folder.name}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  Folder
                </td>
                <td className="px-4 py-3 text-slate-600">
                  -
                </td>
                <td className="px-4 py-3 text-slate-600">
                  -
                </td>
                <td className="px-4 py-3 text-slate-600">
                  -
                </td>
                <td className ="px-4 py-3">
                  <Link to={`/project/${project}/${folder.id}`}
                  className = "text-sm text-slate-600 hover:underline">
                    Open
                  </Link>
                </td>

              </tr>
            ))}
            {visibleFiles.map((file) => (
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
                    {onPreview && (
                      <Button variant="ghost" size="sm" onClick={() => onPreview(file)}>
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    )}
                    {onPreview && (
                      <Button variant="ghost" size="sm" onClick={() => fileService.downloadFile(file)}>
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    )}
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
      {total > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
