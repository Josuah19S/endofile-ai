"use client";
import React from 'react';
import NextImage from 'next/image';
import { getEndoFileInfo } from '../constants/endofile-dataset';
import { FileText, Gauge, Zap, Ruler, ArrowLeft, Activity, Info } from 'lucide-react';

interface FileDetailViewProps {
  classId: string;
  photoUrl?: string | null;
  onBack?: () => void;
}

export default function FileDetailView({
  classId,
  photoUrl,
  onBack,
}: FileDetailViewProps) {
  const fileInfo = getEndoFileInfo(classId);

  // Fallback parsing if classId is not found in dictionary
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
  const orderDisplay = fileInfo?.numero ? `${fileInfo.numero}°` : orderStr;
  const fileName = fileInfo?.nombre || (orderStr ? `${orderStr} ${fallbackFile}` : fallbackFile);

  // Velocity range logic: if min === max, display as recommended velocity
  let velocityDisplay: string = 'N/D';
  if (fileInfo?.velocidadMin !== undefined || fileInfo?.velocidadMax !== undefined) {
    const min = fileInfo.velocidadMin;
    const max = fileInfo.velocidadMax;
    if (min !== undefined && max !== undefined) {
      if (min === max) {
        velocityDisplay = `${min} RPM (Recomendada)`;
      } else {
        velocityDisplay = `${min} - ${max} RPM`;
      }
    } else {
      velocityDisplay = `${min ?? max} RPM`;
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 text-on-surface">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Navigation back button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft size={16} /> Volver a Detecciones Recientes
          </button>
        )}

        {/* Top Header & Photo Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Larger Image Display Box */}
          <div className="relative w-9/10 h-52 md:h-56 m-auto rounded-2xl bg-surface-container-lowest border border-outline/80 overflow-hidden flex items-center justify-center shadow-inner">
            {photoUrl ? (
              <NextImage
                src={photoUrl}
                alt={fileName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-on-surface-variant/40">
                <FileText size={48} />
                <span className="text-xs mt-2 font-medium">Sin foto previa</span>
              </div>
            )}
          </div>

          {/* System & Title Meta Card */}
          <div className="flex flex-col justify-between shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase font-bold tracking-wider text-on-surface-variant">
                {systemName}
              </span>
              {orderDisplay && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-primary-container/30 border border-primary-container/50 text-xs font-bold text-on-primary-container font-mono">
                  {orderDisplay}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-on-surface">
              {fileName}
            </h2>
          </div>
        </div>

        {/* Technical Specs Parameters */}
        <div>
          <h3 className="text-xs uppercase font-bold tracking-wider text-on-surface-variant mb-2.5 flex items-center gap-1.5">
            Especificaciones Técnicas
          </h3>

          <div className="grid grid-cols-1 gap-1">
            <div className="p-2">
              <div className="flex items-center gap-2 mb-1 text-on-surface-variant">
                <span className="text-xs uppercase font-semibold text-on-surface-variant">Diámetro Apical</span>
                <span className="font-bold text-on-surface text-sm">
                  {fileInfo ? `ISO #${fileInfo.diametroApical} (${(fileInfo.diametroApical / 100).toFixed(2)}mm)` : 'N/D'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-varient">
                <span className="text-xs uppercase font-semibold text-on-surface-variant">Conicidad (Taper)</span>
                <span className="font-bold text-on-surface text-sm">
                  {fileInfo ? `${(fileInfo.conicidad * 100).toFixed(0)}% (${fileInfo.conicidad})` : 'N/D'}
                </span>
              </div>

              {/* Longitud */}
              <div className="flex items-center gap-2 mb-1 text-on-surface-variant">
                <span className="text-xs font-semibold uppercase tracking-wider">Longitud</span>
                <span className="text-base font-bold text-on-surface">
                  {fileInfo?.longitud ? `${fileInfo.longitud} mm` : '25 mm'}
                </span>
                {fileInfo?.longitudesAdicionales && fileInfo.longitudesAdicionales.length > 0 && (
                  <span className="text-xs ml-2 text-on-surface-variant/90">
                    Alt: {fileInfo.longitudesAdicionales.join(', ')} mm
                  </span>
                )}
              </div>
              {/* Velocidad */}
              <div className="flex items-center gap-2 mb-1 text-on-surface-variant">
                <span className="text-xs font-semibold uppercase tracking-wider">Velocidad</span>
                <span className="text-base font-bold text-on-surface">
                  {velocityDisplay}
                </span>
              </div>
              {/* Torque */}
              <div className="flex items-center gap-2 mb-1 text-on-surface-variant">
                <span className="text-xs font-semibold uppercase tracking-wider">Torque</span>
                <span className="text-base font-bold text-on-surface">
                  {fileInfo?.torque !== undefined ? `${fileInfo.torque} Ncm` : '2.0 Ncm'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
