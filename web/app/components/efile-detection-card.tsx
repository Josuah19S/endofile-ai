"use client";
import React from 'react';
import NextImage from 'next/image';
import { getEndoFileInfo } from '../constants/endofile-dataset';
import { FileText, Gauge, Zap } from 'lucide-react';

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

  return (
    <div
      onClick={onClick}
      className="group relative flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 shadow-lg hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Thumbnail Image Container */}
      <div className="relative w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
        {photoUrl ? (
          <NextImage
            src={photoUrl}
            alt={fileName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600">
            <FileText size={22} />
          </div>
        )}
      </div>

      {/* Content Info */}
      <div className="flex-1 min-w-0 pr-1">
        {/* System Badge & Order */}
        <div className="flex items-center gap-1.5 mb-1">
          {orderDisplay && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[10px] font-bold text-blue-400 font-mono">
              {orderDisplay}
            </span>
          )}
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400 truncate">
            {systemName}
          </span>
        </div>

        {/* Main File Name */}
        <h4 className="text-sm font-semibold text-white tracking-wide truncate group-hover:text-blue-300 transition-colors">
          {fileName}
        </h4>

        {/* Spec Pill Details */}
        {fileInfo && (
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              ISO #{fileInfo.diametroApical}
            </span>
            <span className="flex items-center gap-1 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800/60">
              Taper {(fileInfo.conicidad * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
