"use client";
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { BookOpen, Search, SearchX, X } from 'lucide-react';
import { searchEndoFiles } from '../../constants/endofile-dataset';
import CatalogFileRow from './catalog-file-row';

interface FileCatalogViewProps {
  query: string;
  onQueryChange: (value: string) => void;
  /** Scroll offset shared with the shell, so returning from a detail lands where the user left. */
  scrollTopRef: React.RefObject<number>;
  onSelectFile: (classId: string) => void;
}

export default function FileCatalogView({
  query,
  onQueryChange,
  scrollTopRef,
  onSelectFile,
}: FileCatalogViewProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => searchEndoFiles(query), [query]);
  const totalFiles = useMemo(
    () => groups.reduce((sum, group) => sum + group.limas.length, 0),
    [groups]
  );

  // Restore before paint to avoid a visible jump back to the top of the list
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollTopRef.current;
    }
  }, [scrollTopRef]);

  return (
    <div className="flex-1 flex flex-col min-h-0 text-on-surface">
      {/* Header: counters + search */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-baseline justify-between gap-3 mb-2.5 px-1">
            <h3 className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">
              Catálogo de Limas
            </h3>
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-on-surface-variant/80">
              {totalFiles} {totalFiles === 1 ? 'lima' : 'limas'} · {groups.length}{' '}
              {groups.length === 1 ? 'sistema' : 'sistemas'}
            </span>
          </div>

          <label className="relative block">
            <span className="sr-only">Buscar lima, sistema o calibre</span>
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar lima, sistema o calibre…"
              className="w-full h-11 pl-9 pr-11 rounded-2xl bg-surface-container-high border border-outline text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary/60 transition-colors"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* Grouped, scrollable list */}
      <div
        ref={scrollRef}
        onScroll={(e) => { scrollTopRef.current = e.currentTarget.scrollTop; }}
        className="flex-1 overflow-y-auto px-4 pb-4"
      >
        <div className="max-w-4xl mx-auto">
          {groups.length > 0 ? (
            groups.map((group) => (
              <section key={group.sistema} className="mb-4 last:mb-0">
                <h4 className="sticky top-0 z-10 flex items-baseline justify-between gap-2 py-2 bg-surface-container-lowest text-[11px] uppercase font-bold tracking-wider text-on-surface-variant">
                  <span className="truncate">{group.sistema}</span>
                  <span className="shrink-0 text-[11px] font-medium normal-case tracking-normal tabular-nums text-on-surface-variant/80">
                    {group.limas.length} {group.limas.length === 1 ? 'lima' : 'limas'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.limas.map((entry) => (
                    <CatalogFileRow
                      key={entry.classId}
                      entry={entry}
                      onClick={() => onSelectFile(entry.classId)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : query.trim().length > 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SearchX size={44} className="mb-3 opacity-60 text-on-primary-container" />
              <p className="text-base font-semibold text-on-surface">
                Sin resultados para «{query.trim()}»
              </p>
              <span className="text-xs text-on-surface-variant/80 mt-1 max-w-sm">
                Pruebe con el nombre de la lima, el sistema o el calibre ISO.
              </span>
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="mt-4 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline text-xs font-semibold text-on-surface transition-colors cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen size={44} className="mb-3 opacity-60 text-on-primary-container" />
              <p className="text-base font-semibold text-on-surface">El catálogo está vacío.</p>
              <span className="text-xs text-on-surface-variant/80 mt-1 max-w-sm">
                No hay ninguna lima registrada en el dataset.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
