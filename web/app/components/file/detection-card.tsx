"use client";
import NextImage from 'next/image';
import { getEndoFileInfo } from '../../constants/endofile-dataset';
import { FileText } from 'lucide-react';

export interface EFileDetectionCardProps {
  classId: string;
  photoUrl?: string | null;
  timestamp?: number;
  onClick?: () => void;
}

export default function EFileDetectionCard({
  classId,
  photoUrl,
  timestamp,
  onClick,
}: EFileDetectionCardProps) {
  const fileInfo = getEndoFileInfo(classId);

  // Parse system and file name manually as fallback if not in dictionary
  const parts = classId.split('_');
  const fallbackSystem = parts[0]?.replace(/-/g, ' ') || 'Sistema desconocido';
  const fileRaw = parts.slice(1).join('_');

  let orderStr: string | null = null;
  let fallbackFile = fileRaw.replace(/-/g, ' ');

  if (fileRaw.includes('-')) {
    const dashParts = fileRaw.split('-');
    orderStr = `${dashParts[0]}°`;
    fallbackFile = dashParts.slice(1).join(' ').replace(/-/g, ' ');
  }

  const systemName = fileInfo?.sistema || fallbackSystem;
  const fileName = fileInfo?.nombre || (orderStr ? `${orderStr} ${fallbackFile}` : fallbackFile);
  const orderDisplay = fileInfo?.numero ? `${fileInfo.numero}°` : orderStr;
  const date = new Date(timestamp!)

  return (
    <div
      onClick={onClick}
      className="group relative flex items-center gap-3.5 p-3 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest border border-outline hover:border-primary/50 shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer overflow-hidden text-on-surface"
    >
      {/* Thumbnail Image Container */}
      <div className="relative w-16 h-16 rounded-xl bg-surface-container-lowest border border-outline/80 overflow-hidden shrink-0 flex items-center justify-center">
        {photoUrl ? (
          <NextImage
            src={photoUrl}
            alt={fileName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-on-surface-variant">
            <FileText size={22} />
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="flex-1 min-w-0 pr-1">
        {/* System Badge & Order */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] uppercase font-bold tracking-wider text-on-surface-variant truncate">
            {systemName}
          </span>
          {orderDisplay && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-primary-container/30 border border-primary-container/50 text-[10px] font-bold text-on-primary-container font-mono">
              {orderDisplay}
            </span>
          )}
        </div>

        {/* Main File Name */}
        <h4 className="text-sm font-semibold text-on-surface tracking-wide truncate group-hover:text-on-primary-container transition-colors">
          {fileName}
        </h4>

        {/* Spec Pill Details */}
        {fileInfo && (
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-on-surface-variant">
            <span className="flex items-center gap-1 bg-surface-container-lowest px-2 py-0.5 rounded-md border border-outline/60">
              {`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
