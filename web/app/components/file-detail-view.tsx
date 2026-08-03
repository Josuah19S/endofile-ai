"use client";
import NextImage from 'next/image';
import { getEndoFileInfo } from '../constants/endofile-dataset';
import { getFilePhoto } from '../constants/endofile-photos';
import { FileText, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface FileDetailViewProps {
  classId: string;
  photoUrl?: string | null;
  /** Label of the back button, so the catalog can point back at itself. */
  backLabel?: string;
  onBack?: () => void;
  onNewer?: () => void;
  onOlder?: () => void;
  hasNewer?: boolean;
  hasOlder?: boolean;
}

export default function FileDetailView({
  classId,
  photoUrl,
  backLabel = 'Volver a Detecciones Recientes',
  onBack,
  onNewer,
  onOlder,
  hasNewer,
  hasOlder,
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
      velocityDisplay = min === max ? `${min} rpm (recomendada)` : `${min} – ${max} rpm`;
    } else {
      velocityDisplay = `${min ?? max} rpm`;
    }
  }

  let lengthDisplay = 'N/D';
  if (fileInfo?.longitud) {
    const alt = fileInfo.longitudesAdicionales;
    lengthDisplay = alt && alt.length > 0
      ? `${fileInfo.longitud} mm (alt. ${alt.join(', ')} mm)`
      : `${fileInfo.longitud} mm`;
  }

  // Every spec goes through the same shape, so no row can drift in font or size
  const specs = [
    {
      label: 'Diámetro apical',
      value: fileInfo ? `ISO #${fileInfo.diametroApical} · ${(fileInfo.diametroApical / 100).toFixed(2)} mm` : 'N/D',
    },
    {
      label: 'Conicidad',
      value: fileInfo ? `${(fileInfo.conicidad * 100).toFixed(0)} % · ${fileInfo.conicidad}` : 'N/D',
    },
    { label: 'Longitud', value: lengthDisplay },
    { label: 'Velocidad', value: velocityDisplay },
    { label: 'Torque', value: fileInfo?.torque !== undefined ? `${fileInfo.torque} Ncm` : 'N/D' },
  ];

  // The media box holds the *capture*, so it only earns its space when there is one (or a
  // scan gallery to walk through). The reference photograph below is a different thing: it
  // belongs to the file itself and only some of them have been photographed.
  const showMedia = Boolean(photoUrl) || Boolean(onNewer) || Boolean(onOlder);
  // Detections arrive with the model's class id, the catalog with the dictionary key; for
  // the aliased systems those differ, so try both before giving up on a photo.
  const referencePhoto = getFilePhoto(classId) ?? getFilePhoto(fileInfo?.id);

  const HeaderBlock = (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs uppercase font-bold tracking-widest text-primary">
          {systemName}
        </span>
        {orderDisplay && (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/20 text-primary border border-primary/40">
            {orderDisplay}
          </span>
        )}
      </div>

      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface break-words">
        {fileName}
      </h2>

      {referencePhoto && (
        <figure className="mt-3 w-full max-w-[420px]">
          <div className="rounded-xl overflow-hidden border border-outline/70 bg-surface-container-lowest">
            <NextImage
              src={referencePhoto.src}
              alt={`Fotografía de referencia de ${fileName}`}
              width={referencePhoto.width}
              height={referencePhoto.height}
              sizes="(min-width: 768px) 420px, 100vw"
              className="w-full h-auto"
            />
          </div>
          <figcaption className="mt-1.5 text-[11px] text-on-surface-variant/80">
            Imagen de referencia del fabricante
          </figcaption>
        </figure>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 text-on-surface">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Navigation back button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer mb-1"
          >
            <ArrowLeft size={16} /> {backLabel}
          </button>
        )}

        {showMedia ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Image Box with Lateral Navigation Controls */}
            <div className="flex items-center gap-2 w-full">
              {onNewer && (
                <button
                  type="button"
                  onClick={onNewer}
                  disabled={!hasNewer}
                  className={`p-2.5 rounded-full border transition-all cursor-pointer shrink-0 ${hasNewer
                      ? 'bg-surface-container-high hover:bg-surface-container-highest border-outline hover:border-primary hover:text-primary text-on-surface hover:scale-105 active:scale-95 shadow-md hover:shadow-[0_0_12px_rgba(34,173,250,0.35)]'
                      : 'opacity-30 border-transparent text-on-surface-variant cursor-not-allowed'
                    }`}
                  aria-label="Foto más reciente"
                  title="Foto más reciente"
                >
                  <ChevronLeft size={20} />
                </button>
              )}

              {/* Image Display Box */}
              <div className="relative flex-1 h-52 md:h-56 rounded-2xl bg-surface-container-lowest border border-outline/80 overflow-hidden flex items-center justify-center shadow-inner">
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
                    <span className="text-[11px] mt-2 font-medium">Sin foto previa</span>
                  </div>
                )}
              </div>

              {onOlder && (
                <button
                  type="button"
                  onClick={onOlder}
                  disabled={!hasOlder}
                  className={`p-2.5 rounded-full border transition-all cursor-pointer shrink-0 ${hasOlder
                      ? 'bg-surface-container-high hover:bg-surface-container-highest border-outline hover:border-primary hover:text-primary text-on-surface hover:scale-105 active:scale-95 shadow-md hover:shadow-[0_0_12px_rgba(34,173,250,0.35)]'
                      : 'opacity-30 border-transparent text-on-surface-variant cursor-not-allowed'
                    }`}
                  aria-label="Foto anterior"
                  title="Foto anterior"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            {HeaderBlock}
          </div>
        ) : (
          HeaderBlock
        )}

        {/* Technical Specs Parameters */}
        <section>
          <h3 className="text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant mb-2">
            Especificaciones técnicas
          </h3>

          <dl className="rounded-2xl border border-outline/70 bg-surface-container-high overflow-hidden">
            {specs.map((spec, index) => (
              <div
                key={spec.label}
                className={`flex items-baseline justify-between gap-4 px-4 py-3 ${index > 0 ? 'border-t border-outline/50' : ''}`}
              >
                <dt className="shrink-0 text-[11px] uppercase font-semibold tracking-wider text-on-surface-variant">
                  {spec.label}
                </dt>
                <dd className="text-sm font-semibold tabular-nums text-on-surface text-right">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
