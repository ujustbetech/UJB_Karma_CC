'use client';

import { FileText } from 'lucide-react';

function formatSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function FilePreview({ file }) {
  if (!file?.url) return null;

  const isPdf =
    file.fileName?.toLowerCase().endsWith('.pdf') ||
    file.url.toLowerCase().includes('.pdf');

  const name =
    file.fileName ||
    file.url.split('/').pop()?.split('?')[0] ||
    'File';

  const ext = name.split('.').pop()?.toUpperCase() || '';

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 mt-2"
    >
      {/* PREVIEW */}
      {isPdf ? (
        <FileText size={34} className="text-red-600" />
      ) : (
        <img
          src={file.url}
          className="w-20 h-20 object-cover rounded-lg"
        />
      )}

      {/* INFO */}
      <div className="text-sm">
        <div className="font-medium text-slate-700">{name}</div>

        <div className="text-xs text-slate-500">
          {ext}
          {file.size ? ` • ${formatSize(file.size)}` : ''}
        </div>

        <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
          {file.path}
        </div>
      </div>
    </a>
  );
}
