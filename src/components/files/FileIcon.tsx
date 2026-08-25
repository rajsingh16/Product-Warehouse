import {
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Table,
} from 'lucide-react';

interface FileIconProps {
  type: string;
  className?: string;
}

export function FileIcon({ type, className = 'h-5 w-5' }: FileIconProps) {
  const props = { className: `${className} text-slate-500` };

  switch (type) {
    case 'pdf':
      return <FileType {...props} className={`${className} text-red-500`} />;
    case 'doc':
    case 'docx':
      return <FileText {...props} className={`${className} text-blue-500`} />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet {...props} className={`${className} text-green-600`} />;
    case 'csv':
      return <Table {...props} className={`${className} text-emerald-600`} />;
    case 'json':
      return <FileCode {...props} className={`${className} text-amber-600`} />;
    case 'jpg':
    case 'jpeg':
      return <FileImage {...props} className={`${className} text-purple-500`} />;
    case 'txt':
    default:
      return <FileText {...props} />;
  }
}
