import { CHARACTER_BY_ID } from '../data/case';
import { portraitTexture } from '../world/textures';

const urls = new Map<string, string>();

/** Data URL of a character's painted portrait (shared with the 3D portraits). */
export function portraitDataUrl(id: string): string {
  const hit = urls.get(id);
  if (hit) return hit;
  const ch = CHARACTER_BY_ID[id];
  const t = portraitTexture(id, ch.palette);
  const url = (t.image as HTMLCanvasElement).toDataURL('image/jpeg', 0.85);
  urls.set(id, url);
  return url;
}
