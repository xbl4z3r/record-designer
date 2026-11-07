import { InnerSleeveConfig } from '../types';

const imageCache = new Map<string, HTMLImageElement>();

function getOrLoadImage(src: string, onLoaded?: () => void): HTMLImageElement {
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    imageCache.set(src, img);
    if (onLoaded) {
      img.onload = () => onLoaded();
    }
  }
  return img;
}

export interface RenderInnerSleeveOptions {
  canvas: HTMLCanvasElement;
  innerSleeve: InnerSleeveConfig;
  side: 'front' | 'back';
}

export function drawInnerSleeve({
  canvas,
  innerSleeve,
  side,
}: RenderInnerSleeveOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const type = innerSleeve.type || 'anti_static_rice_paper';
  const customArt = side === 'front' ? innerSleeve.frontArtwork : (innerSleeve.backArtwork || innerSleeve.frontArtwork);

  // 1. Draw Base Material / Artwork
  if (customArt) {
    const img = getOrLoadImage(customArt, () => {
      drawInnerSleeve({ canvas, innerSleeve, side });
    });
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.fillStyle = innerSleeve.backgroundColor || '#1e1b4b';
      ctx.fillRect(0, 0, w, h);
    }
  } else if (type === 'anti_static_rice_paper') {
    // Semi-translucent MoFi-style archival rice paper with frosted fibrous look
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Subtle paper grid pattern
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 1.5;
    for (let x = 60; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 60; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top archival banner strip
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, 55);

    ctx.font = '600 16px "Geist Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(
      innerSleeve.archivalPrintText || 'ARCHIVAL MASTER SLEEVE • ANTI-STATIC HDPE • ACID FREE',
      w / 2,
      34
    );
  } else if (type === 'poly_lined_paper') {
    ctx.fillStyle = innerSleeve.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, w, h);
  } else if (type === 'poly_lined_black') {
    ctx.fillStyle = innerSleeve.backgroundColor || '#18181b';
    ctx.fillRect(0, 0, w, h);
  } else if (type === 'heavyweight_kraft') {
    ctx.fillStyle = innerSleeve.backgroundColor || '#78350f';
    ctx.fillRect(0, 0, w, h);
    // Kraft texture flecks
    ctx.fillStyle = '#92400e';
    for (let i = 0; i < 300; i++) {
      ctx.fillRect((i * 97) % w, (i * 131) % h, 2, 2);
    }
  } else if (type === 'japanese_u_bottom') {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h);

    // Nagaoka technical marking
    ctx.font = '500 14px "Geist Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('NAGAOKA STYLE ANTI-STATIC ROUND SLEEVE 0.028mm', w / 2, 36);
  } else {
    ctx.fillStyle = innerSleeve.backgroundColor || '#1e1b4b';
    ctx.fillRect(0, 0, w, h);
  }

  // 2. Die-Cut Center Aperture Window
  if (innerSleeve.hasDieCutHole !== false) {
    const holeRadius = (innerSleeve.dieCutDiameterMm === 85 ? w * 0.14 : w * 0.17);

    // Cutout hole
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circular bevel border around aperture
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, holeRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // 3. Corner Style Outline Guide
  if (innerSleeve.cornerStyle === 'rounded') {
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(60, h - 60, 60, Math.PI / 2, Math.PI);
    ctx.arc(w - 60, h - 60, 60, 0, Math.PI / 2);
    ctx.stroke();
  }
}
