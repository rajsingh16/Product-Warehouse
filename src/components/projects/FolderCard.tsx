import { Folder } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Folder as FolderType } from '../../types';

interface FolderCardProps {
  projectId: string;
  folder: FolderType;
}

export function FolderCard({ projectId, folder }: FolderCardProps) {
  return (
    <Link
      to={`/projects/${projectId}/${folder.id}`}
      className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
    >
      <Folder className="mb-3 h-12 w-12 text-slate-400 transition-colors group-hover:text-slate-600" />
      <span className="text-lg font-semibold text-slate-800">{folder.name}</span>
      <span className="mt-1 text-xs text-slate-500">{folder.files.length} files</span>
    </Link>
  );
}
