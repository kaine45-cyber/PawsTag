/** Generate a stable pseudo-random QR cell pattern from a tag code seed */
export function generateQRCells(seed: string): boolean[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return Array.from({ length: 49 }, (_, i) => (((hash ^ (i * 2654435761)) >>> 0) % 100) > 38);
}
