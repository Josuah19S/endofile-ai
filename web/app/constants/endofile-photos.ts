// GENERATED FILE — do not edit by hand.
// Source: public/file_photos · Regenerate with `pnpm photos:manifest`.

/** A reference photograph of a file, with its intrinsic size so layout never shifts. */
export interface FilePhoto {
  src: string;
  width: number;
  height: number;
}

/** Keyed by class id. Only the files that actually have a photograph appear here. */
export const FILE_PHOTOS: Readonly<Record<string, FilePhoto>> = {
  're-treaty_1-bully': { src: '/file_photos/re-treaty_1-bully.png', width: 420, height: 125 },
  're-treaty_2-skinny': { src: '/file_photos/re-treaty_2-skinny.png', width: 420, height: 125 },
  're-treaty_3-shapy1': { src: '/file_photos/re-treaty_3-shapy1.png', width: 420, height: 125 },
  're-treaty_4-shapy2': { src: '/file_photos/re-treaty_4-shapy2.png', width: 420, height: 125 },
  're-treaty_5-shapy3': { src: '/file_photos/re-treaty_5-shapy3.png', width: 420, height: 125 },
  'mg3-blue_1-sv': { src: '/file_photos/mg3-blue_1-sv.png', width: 420, height: 125 },
  'mg3-blue_2-px': { src: '/file_photos/mg3-blue_2-px.png', width: 420, height: 125 },
  'mg3-blue_3-g1': { src: '/file_photos/mg3-blue_3-g1.png', width: 420, height: 125 },
  'mg3-blue_4-g2x': { src: '/file_photos/mg3-blue_4-g2x.png', width: 420, height: 125 },
  'mg3-blue_5-g2': { src: '/file_photos/mg3-blue_5-g2.png', width: 420, height: 125 },
  's-blue_1-b0': { src: '/file_photos/s-blue_1-b0.png', width: 420, height: 125 },
  's-blue_2-b1': { src: '/file_photos/s-blue_2-b1.png', width: 420, height: 125 },
  's-blue_3-b2': { src: '/file_photos/s-blue_3-b2.png', width: 420, height: 125 },
  's-blue_4-b3': { src: '/file_photos/s-blue_4-b3.png', width: 420, height: 125 },
  'rc-blue_1-r25': { src: '/file_photos/rc-blue_1-r25.png', width: 420, height: 125 },
  'rc-blue_2-r40': { src: '/file_photos/rc-blue_2-r40.png', width: 420, height: 125 },
  'rc-blue_3-r50': { src: '/file_photos/rc-blue_3-r50.png', width: 420, height: 125 },
};

/** `null` when the file has no reference photo, so callers can skip the frame entirely. */
export function getFilePhoto(classId: string | null | undefined): FilePhoto | null {
  if (!classId) return null;
  return FILE_PHOTOS[classId] ?? null;
}
