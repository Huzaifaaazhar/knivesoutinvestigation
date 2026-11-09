/**
 * Procedurally painted textures. Everything is drawn into canvases once and
 * cached, so the estate needs no external image downloads.
 * Textures are authored so that one texture repeat equals `tile` metres;
 * geometry produced by `worldBox`/`worldPlane` carries UVs in metres.
 */
import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

type Painter = (g: CanvasRenderingContext2D, s: number, rnd: () => number) => void;

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export let TEXTURE_SIZE = 512;
export function setTextureQuality(q: 'high' | 'low') {
  TEXTURE_SIZE = q === 'high' ? 512 : 256;
}

function make(key: string, tile: number, paint: Painter, opts: { color?: boolean; size?: number } = {}): THREE.Texture {
  const k = `${key}@${tile}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const s = opts.size ?? TEXTURE_SIZE;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  paint(g, s, mulberry(key.length * 9973 + key.charCodeAt(0)));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tile, 1 / tile);
  t.anisotropy = 4;
  if (opts.color !== false) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(k, t);
  return t;
}

function noise(g: CanvasRenderingContext2D, s: number, rnd: () => number, alpha: number, n = 4000, size = 2) {
  for (let i = 0; i < n; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`;
    g.fillRect(rnd() * s, rnd() * s, size, size);
  }
}

function grainLines(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rnd: () => number, base: string, vertical = false) {
  g.fillStyle = base;
  g.fillRect(x, y, w, h);
  const lines = Math.floor((vertical ? w : h) / 3);
  for (let i = 0; i < lines; i++) {
    const a = 0.04 + rnd() * 0.1;
    g.strokeStyle = rnd() > 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,220,180,${a * 0.5})`;
    g.lineWidth = 0.6 + rnd() * 1.4;
    g.beginPath();
    if (vertical) {
      const px = x + rnd() * w;
      g.moveTo(px, y);
      for (let k = 0; k <= 8; k++) g.lineTo(px + Math.sin(k * 0.9 + rnd()) * 2, y + (h * k) / 8);
    } else {
      const py = y + rnd() * h;
      g.moveTo(x, py);
      for (let k = 0; k <= 8; k++) g.lineTo(x + (w * k) / 8, py + Math.sin(k * 0.9 + rnd()) * 2);
    }
    g.stroke();
  }
}

const shade = (hex: string, f: number) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(f);
  return `#${c.getHexString()}`;
};

export const tex = {
  parquet: () =>
    make('parquet', 1.6, (g, s, rnd) => {
      // herringbone-ish staggered planks
      const rows = 8;
      const h = s / rows;
      for (let r = 0; r < rows; r++) {
        let x = -rnd() * s * 0.5;
        while (x < s) {
          const w = s * (0.35 + rnd() * 0.3);
          grainLines(g, x, r * h, w, h, rnd, shade('#5a3a26', 0.75 + rnd() * 0.45));
          g.fillStyle = 'rgba(0,0,0,0.45)';
          g.fillRect(x, r * h, 2, h);
          x += w;
        }
        g.fillStyle = 'rgba(0,0,0,0.5)';
        g.fillRect(0, r * h, s, 2);
      }
    }),
  walnut: () =>
    make('walnut', 1.2, (g, s, rnd) => {
      grainLines(g, 0, 0, s, s, rnd, '#3d281d', true);
      noise(g, s, rnd, 0.05);
    }),
  darkwood: () =>
    make('darkwood', 0.8, (g, s, rnd) => {
      grainLines(g, 0, 0, s, s, rnd, '#2a1a14');
    }),
  lightwood: () =>
    make('lightwood', 0.8, (g, s, rnd) => {
      grainLines(g, 0, 0, s, s, rnd, '#7a5a3c');
    }),
  damask: (bg: string, fg: string) =>
    make(`damask-${bg}-${fg}`, 0.7, (g, s, rnd) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, s, s);
      noise(g, s, rnd, 0.04, 6000, 1);
      g.fillStyle = fg;
      g.strokeStyle = fg;
      const motif = (cx: number, cy: number, sc: number) => {
        g.save();
        g.translate(cx, cy);
        g.scale(sc, sc);
        g.beginPath();
        // central medallion
        g.moveTo(0, -60);
        g.bezierCurveTo(30, -40, 34, -10, 0, 0);
        g.bezierCurveTo(-34, -10, -30, -40, 0, -60);
        g.moveTo(0, 0);
        g.bezierCurveTo(40, 10, 40, 50, 0, 70);
        g.bezierCurveTo(-40, 50, -40, 10, 0, 0);
        g.fill();
        g.lineWidth = 3;
        for (const sx of [-1, 1]) {
          g.beginPath();
          g.moveTo(0, 10);
          g.bezierCurveTo(sx * 50, -20, sx * 70, 30, sx * 40, 45);
          g.stroke();
          g.beginPath();
          g.arc(sx * 40, 45, 6, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
      };
      motif(s * 0.25, s * 0.28, s / 400);
      motif(s * 0.75, s * 0.78, s / 400);
      motif(s * 0.75, s * -0.22, s / 400);
      motif(s * 0.25, s * 1.28, s / 400);
      motif(s * -0.25, s * 0.78, s / 400);
      motif(s * 1.25, s * 0.28, s / 400);
    }),
  plaster: () =>
    make('plaster', 2, (g, s, rnd) => {
      g.fillStyle = '#b9ab90';
      g.fillRect(0, 0, s, s);
      noise(g, s, rnd, 0.06, 9000, 3);
    }),
  brick: (base = '#6b3a2c') =>
    make(`brick-${base}`, 1.0, (g, s, rnd) => {
      g.fillStyle = '#3a3029';
      g.fillRect(0, 0, s, s);
      const rows = 14;
      const h = s / rows;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? s / 8 : 0;
        for (let c = -1; c < 4; c++) {
          const w = s / 4;
          g.fillStyle = shade(base, 0.7 + rnd() * 0.5);
          g.fillRect(off + c * w + 2, r * h + 2, w - 4, h - 4);
        }
      }
      noise(g, s, rnd, 0.08, 6000, 2);
    }),
  stone: () =>
    make('stone', 2.4, (g, s, rnd) => {
      g.fillStyle = '#4a4740';
      g.fillRect(0, 0, s, s);
      const n = 4;
      const cs = s / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const w = cs * (rnd() > 0.7 ? 2 : 1);
          g.fillStyle = shade('#7d776a', 0.75 + rnd() * 0.4);
          g.fillRect(i * cs + 3, j * cs + 3, Math.min(w, s - i * cs) - 6, cs - 6);
        }
      noise(g, s, rnd, 0.1, 9000, 2);
    }),
  marbleChecker: () =>
    make('checker', 1.6, (g, s, rnd) => {
      const n = 4;
      const cs = s / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const dark = (i + j) % 2 === 0;
          g.fillStyle = dark ? '#16110f' : '#d9cfbc';
          g.fillRect(i * cs, j * cs, cs, cs);
          g.strokeStyle = dark ? 'rgba(255,255,255,0.07)' : 'rgba(80,60,40,0.18)';
          for (let v = 0; v < 3; v++) {
            g.lineWidth = 0.5 + rnd();
            g.beginPath();
            let x = i * cs + rnd() * cs;
            let y = j * cs;
            g.moveTo(x, y);
            for (let k = 0; k < 6; k++) {
              x += (rnd() - 0.5) * 20;
              y += cs / 6;
              g.lineTo(x, y);
            }
            g.stroke();
          }
        }
    }),
  carpet: (base = '#5a1c26') =>
    make(`carpet-${base}`, 1.2, (g, s, rnd) => {
      g.fillStyle = base;
      g.fillRect(0, 0, s, s);
      noise(g, s, rnd, 0.08, 20000, 1);
      g.strokeStyle = 'rgba(182,154,101,0.18)';
      g.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(s / 2, s / 2, s * (0.1 + i * 0.1), 0, Math.PI * 2);
        g.stroke();
      }
    }),
  rug: (base: string, border: string) =>
    make(`rug-${base}-${border}`, 1, (g, s, rnd) => {
      g.fillStyle = border;
      g.fillRect(0, 0, s, s);
      g.fillStyle = base;
      g.fillRect(s * 0.08, s * 0.08, s * 0.84, s * 0.84);
      g.strokeStyle = border;
      g.lineWidth = s * 0.01;
      g.strokeRect(s * 0.14, s * 0.14, s * 0.72, s * 0.72);
      g.fillStyle = border;
      g.globalAlpha = 0.45;
      g.save();
      g.translate(s / 2, s / 2);
      for (let i = 0; i < 8; i++) {
        g.rotate(Math.PI / 4);
        g.beginPath();
        g.ellipse(0, s * 0.16, s * 0.03, s * 0.1, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.beginPath();
      g.arc(0, 0, s * 0.06, 0, Math.PI * 2);
      g.fill();
      g.restore();
      g.globalAlpha = 1;
      noise(g, s, rnd, 0.1, 30000, 1);
    }, { size: 512 }),
  tile: () =>
    make('tile', 0.6, (g, s, rnd) => {
      g.fillStyle = '#8a8478';
      g.fillRect(0, 0, s, s);
      const rows = 6;
      const h = s / rows;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? s / 6 : 0;
        for (let c = -1; c < 4; c++) {
          g.fillStyle = shade('#d6cdb8', 0.92 + rnd() * 0.1);
          g.fillRect(off + (c * s) / 3 + 2, r * h + 2, s / 3 - 4, h - 4);
        }
      }
    }),
  floorTile: () =>
    make('floortile', 0.8, (g, s, rnd) => {
      const n = 4;
      const cs = s / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          g.fillStyle = (i + j) % 2 ? shade('#7b2a2a', 0.9 + rnd() * 0.2) : shade('#c8b99b', 0.9 + rnd() * 0.15);
          g.fillRect(i * cs + 1, j * cs + 1, cs - 2, cs - 2);
        }
    }),
  concrete: () =>
    make('concrete', 3, (g, s, rnd) => {
      g.fillStyle = '#5c5a55';
      g.fillRect(0, 0, s, s);
      noise(g, s, rnd, 0.1, 16000, 3);
      g.fillStyle = 'rgba(20,15,10,0.25)';
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.ellipse(rnd() * s, rnd() * s, 20 + rnd() * 60, 10 + rnd() * 40, rnd() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }),
  gravel: () =>
    make('gravel', 1.5, (g, s, rnd) => {
      g.fillStyle = '#4c463d';
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 5000; i++) {
        g.fillStyle = shade('#8c8270', 0.5 + rnd() * 0.7);
        g.beginPath();
        g.ellipse(rnd() * s, rnd() * s, 1 + rnd() * 3, 1 + rnd() * 2, rnd() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }),
  grass: () =>
    make('grass', 3, (g, s, rnd) => {
      g.fillStyle = '#2a3020';
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 14000; i++) {
        const c = rnd();
        g.strokeStyle = c > 0.92 ? `rgba(150,90,40,0.6)` : `rgba(${60 + c * 50},${70 + c * 50},${40 + c * 20},0.5)`;
        const x = rnd() * s;
        const y = rnd() * s;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + (rnd() - 0.5) * 4, y - 3 - rnd() * 5);
        g.stroke();
      }
    }),
  leaves: () =>
    make('leaves', 2, (g, s, rnd) => {
      g.clearRect(0, 0, s, s);
      g.fillStyle = 'rgba(0,0,0,0)';
      const cols = ['#8a3a1c', '#a8541f', '#6b2a1a', '#b8862f', '#5d3b1a', '#7a6a2a'];
      for (let i = 0; i < 600; i++) {
        g.fillStyle = cols[Math.floor(rnd() * cols.length)];
        g.globalAlpha = 0.5 + rnd() * 0.5;
        g.beginPath();
        g.ellipse(rnd() * s, rnd() * s, 3 + rnd() * 5, 2 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }),
  roofSlate: () =>
    make('slate', 1.2, (g, s, rnd) => {
      g.fillStyle = '#1b1d22';
      g.fillRect(0, 0, s, s);
      const rows = 10;
      const h = s / rows;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? s / 12 : 0;
        for (let c = -1; c < 7; c++) {
          g.fillStyle = shade('#3a3d45', 0.7 + rnd() * 0.5);
          g.fillRect(off + (c * s) / 6 + 1, r * h + 1, s / 6 - 2, h - 3);
        }
      }
    }),
  paper: () =>
    make('paper', 1, (g, s, rnd) => {
      g.fillStyle = '#e4d6b8';
      g.fillRect(0, 0, s, s);
      noise(g, s, rnd, 0.05, 8000, 2);
    }),
  leather: (base = '#4a2a1c') =>
    make(`leather-${base}`, 0.5, (g, s, rnd) => {
      g.fillStyle = base;
      g.fillRect(0, 0, s, s);
      noise(g, s, rnd, 0.12, 20000, 2);
    }),
  fabric: (base: string) =>
    make(`fabric-${base}`, 0.4, (g, s, rnd) => {
      g.fillStyle = base;
      g.fillRect(0, 0, s, s);
      g.strokeStyle = 'rgba(0,0,0,0.12)';
      for (let i = 0; i < s; i += 4) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, s);
        g.stroke();
      }
      noise(g, s, rnd, 0.06, 8000, 1);
    }),
  mud: () =>
    make('mud', 1.2, (g, s, rnd) => {
      g.fillStyle = '#2d241b';
      g.fillRect(0, 0, s, s);
      noise(g, s, rnd, 0.15, 12000, 3);
    }),
};

/** A bump map derived from a grey noise canvas, shared by rough surfaces. */
export function bumpNoise(): THREE.Texture {
  return make('bump', 1, (g, s, rnd) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, s, s);
    noise(g, s, rnd, 0.3, 20000, 2);
  }, { color: false, size: 256 });
}

/** Draws an imagined oil portrait for a character — silhouette, colouring and brushwork. */
export function portraitTexture(id: string, palette: [string, string, string]): THREE.Texture {
  return make(`portrait-${id}`, 1, (g, s, rnd) => {
    const [bg, skin, accent] = palette;
    const grd = g.createRadialGradient(s * 0.5, s * 0.35, s * 0.05, s * 0.5, s * 0.5, s * 0.8);
    grd.addColorStop(0, shade(bg, 2.2));
    grd.addColorStop(1, shade(bg, 0.5));
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    // shoulders / coat
    g.fillStyle = accent;
    g.beginPath();
    g.moveTo(s * 0.12, s);
    g.bezierCurveTo(s * 0.15, s * 0.7, s * 0.32, s * 0.62, s * 0.5, s * 0.62);
    g.bezierCurveTo(s * 0.68, s * 0.62, s * 0.85, s * 0.7, s * 0.88, s);
    g.fill();
    g.fillStyle = shade(accent, 0.6);
    g.beginPath();
    g.moveTo(s * 0.44, s * 0.64);
    g.lineTo(s * 0.5, s * 0.85);
    g.lineTo(s * 0.56, s * 0.64);
    g.fill();
    // neck
    g.fillStyle = shade(skin, 0.8);
    g.fillRect(s * 0.44, s * 0.48, s * 0.12, s * 0.16);
    // head
    const hg = g.createRadialGradient(s * 0.46, s * 0.33, s * 0.02, s * 0.5, s * 0.38, s * 0.17);
    hg.addColorStop(0, shade(skin, 1.15));
    hg.addColorStop(1, shade(skin, 0.6));
    g.fillStyle = hg;
    g.beginPath();
    g.ellipse(s * 0.5, s * 0.37, s * 0.12, s * 0.155, 0, 0, Math.PI * 2);
    g.fill();
    // hair
    g.fillStyle = shade(bg, rnd() > 0.5 ? 0.4 : 2.6);
    g.beginPath();
    g.ellipse(s * 0.5, s * 0.27, s * 0.13, s * 0.07, 0, Math.PI, 0);
    g.fill();
    // eyes & mouth (suggestion only)
    g.fillStyle = 'rgba(20,10,10,0.6)';
    g.fillRect(s * 0.44, s * 0.36, s * 0.035, s * 0.01);
    g.fillRect(s * 0.525, s * 0.36, s * 0.035, s * 0.01);
    g.fillStyle = 'rgba(90,30,30,0.5)';
    g.fillRect(s * 0.47, s * 0.44, s * 0.06, s * 0.008);
    // brushwork & varnish
    for (let i = 0; i < 1400; i++) {
      g.strokeStyle = `rgba(${rnd() > 0.5 ? '255,230,190' : '0,0,0'},${rnd() * 0.06})`;
      g.lineWidth = 1 + rnd() * 3;
      const x = rnd() * s;
      const y = rnd() * s;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rnd() - 0.5) * 18, y + (rnd() - 0.5) * 18);
      g.stroke();
    }
    const v = g.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,5,0,0.6)');
    g.fillStyle = v;
    g.fillRect(0, 0, s, s);
  }, { size: 256 });
}

/** Spines for bookshelves: a strip of coloured spines with gold bands. */
export function booksTexture(): THREE.Texture {
  return make('books', 1, (g, s, rnd) => {
    g.fillStyle = '#120c09';
    g.fillRect(0, 0, s, s);
    let x = 0;
    const cols = ['#4a1a20', '#1d2a3a', '#2d3a24', '#5a3a1a', '#2a1a14', '#6a5a3a', '#3a1a2a', '#1a1a1a', '#7a2a24'];
    while (x < s) {
      const w = 8 + rnd() * 18;
      const h = s * (0.7 + rnd() * 0.3);
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.fillRect(x, s - h, w - 1, h);
      g.fillStyle = 'rgba(182,154,101,0.6)';
      g.fillRect(x + 1, s - h + 8, w - 3, 2);
      g.fillRect(x + 1, s - 12, w - 3, 2);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(x + w - 2, s - h, 1, h);
      x += w;
    }
  }, { size: 256 });
}
