// Regenerates app/constants/endofile-photos.ts from the contents of public/file_photos.
//
// Run it after adding, renaming or deleting a reference photo:
//
//   pnpm photos:manifest
//
// The manifest exists so the UI knows which files have a photo without probing the network
// and getting a 404 for the ones that do not.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PHOTO_DIR = join(WEB_ROOT, 'public', 'file_photos');
const DATASET_FILE = join(WEB_ROOT, 'app', 'constants', 'endofile-dataset.ts');
const OUT_FILE = join(WEB_ROOT, 'app', 'constants', 'endofile-photos.ts');
const PUBLIC_PATH = '/file_photos';

/**
 * Width, height and a content hash straight out of the PNG bytes, so the manifest never
 * guesses. The hash becomes the `?v=` cache-buster: replacing a photo under the same
 * filename changes the hash, which changes the `src` URL, which busts the browser's and
 * Next's image-optimizer caches without anyone having to rename a file.
 */
function readPngInfo(path) {
  const buf = readFileSync(path);
  const isPng = buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47;
  if (!isPng || buf.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error(`${basename(path)} no es un PNG válido.`);
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    hash: createHash('sha256').update(buf).digest('hex').slice(0, 8),
  };
}

/** Catalog ids, read from the source of truth so a typo in a filename is caught here. */
function readCatalogIds() {
  const src = readFileSync(DATASET_FILE, 'utf8');
  const block = src.match(/export const CATALOG_FILE_IDS = \[([\s\S]*?)\] as const;/);
  if (!block) throw new Error('No se encontró CATALOG_FILE_IDS en endofile-dataset.ts');
  return [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
}

const catalogIds = readCatalogIds();
const catalogOrder = new Map(catalogIds.map((id, index) => [id, index]));

const photos = readdirSync(PHOTO_DIR)
  .filter(name => !name.startsWith('.'))
  .map(name => {
    const ext = extname(name);
    if (ext.toLowerCase() !== '.png') {
      throw new Error(
        `${name}: solo se admite PNG. Conviértelo o amplía readPngSize() en este script.`
      );
    }
    return { id: basename(name, ext), file: name, ...readPngInfo(join(PHOTO_DIR, name)) };
  })
  .sort((a, b) => (catalogOrder.get(a.id) ?? Infinity) - (catalogOrder.get(b.id) ?? Infinity)
    || a.id.localeCompare(b.id));

const orphans = photos.filter(photo => !catalogOrder.has(photo.id));
for (const orphan of orphans) {
  console.warn(
    `[fotos] "${orphan.file}" no corresponde a ninguna lima de CATALOG_FILE_IDS y no se mostrará.`
  );
}

const entries = photos
  .map(p => `  '${p.id}': { src: '${PUBLIC_PATH}/${p.file}?v=${p.hash}', width: ${p.width}, height: ${p.height} },`)
  .join('\n');

writeFileSync(OUT_FILE, `// GENERATED FILE — do not edit by hand.
// Source: public/file_photos · Regenerate with \`pnpm photos:manifest\`.

/** A reference photograph of a file, with its intrinsic size so layout never shifts. */
export interface FilePhoto {
  src: string;
  width: number;
  height: number;
}

/** Keyed by class id. Only the files that actually have a photograph appear here. */
export const FILE_PHOTOS: Readonly<Record<string, FilePhoto>> = {
${entries}
};

/** \`null\` when the file has no reference photo, so callers can skip the frame entirely. */
export function getFilePhoto(classId: string | null | undefined): FilePhoto | null {
  if (!classId) return null;
  return FILE_PHOTOS[classId] ?? null;
}
`);

console.log(
  `[fotos] ${photos.length - orphans.length}/${catalogIds.length} limas con fotografía` +
  `${orphans.length ? ` (${orphans.length} archivo(s) huérfano(s))` : ''}.`
);
