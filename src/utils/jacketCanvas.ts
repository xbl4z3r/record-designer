import { JacketConfig, VinylConfig, ObiStripConfig } from '../types';

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

export interface RenderJacketOptions {
  canvas: HTMLCanvasElement;
  jacket: JacketConfig;
  vinyl: VinylConfig;
  obi: ObiStripConfig;
  side: 'front' | 'back' | 'spine';
}

export function drawJacketCover({
  canvas,
  jacket,
  vinyl,
  obi,
  side,
}: RenderJacketOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  if (side === 'front') {
    renderFront(ctx, w, h, jacket, vinyl, obi, () => drawJacketCover({ canvas, jacket, vinyl, obi, side }));
  } else if (side === 'back') {
    renderBack(ctx, w, h, jacket, vinyl, () => drawJacketCover({ canvas, jacket, vinyl, obi, side }));
  }
}

function renderFront(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  jacket: JacketConfig,
  vinyl: VinylConfig,
  obi: ObiStripConfig,
  onImageLoaded: () => void
) {
  ctx.fillStyle = jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, w, h);

  if (jacket.frontArtwork) {
    const img = getOrLoadImage(jacket.frontArtwork, onImageLoaded);
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }

  const accent = jacket.accentColor || '#f43f5e';

  // Left spine fold highlight
  const spineFoldGrad = ctx.createLinearGradient(0, 0, 30, 0);
  spineFoldGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
  spineFoldGrad.addColorStop(0.3, 'rgba(255,255,255,0.06)');
  spineFoldGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spineFoldGrad;
  ctx.fillRect(0, 0, 30, h);

  if (!jacket.frontArtwork) {
    ctx.fillStyle = accent;
    ctx.fillRect(40, 40, 8, 80);

    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText((jacket.artistName || 'ARTIST NAME').toUpperCase(), 60, 65);

    ctx.font = '300 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText((jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 60, 110);

    if (jacket.centerCutoutHole) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.17, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = `${accent}35`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w * 0.15, h * 0.3, w * 0.7, h * 0.42);

      ctx.fillStyle = `${accent}10`;
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.42);

      ctx.font = '600 16px "Geist Mono", monospace';
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.fillText(`${(vinyl?.size || '12inch').toUpperCase()} AUDIOPHILE PRESSING`, w / 2, h / 2 - 10);

      ctx.font = '400 13px "Geist Mono", monospace';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(`${vinyl?.weight || '180g'} • ${(vinyl?.rpm || '33rpm').toUpperCase()}`, w / 2, h / 2 + 18);
    }

    ctx.font = '500 15px "Geist Mono", monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.textAlign = 'left';
    ctx.fillText(jacket.catalogNumber || 'CAT-001', 40, h - 40);
  }

  // Obi Strip wrap if enabled
  if (obi?.enabled) {
    const obiW = 110;
    const obiX = obi.position === 'left' ? 30 : w - obiW - 30;

    ctx.fillStyle = obi.backgroundColor || '#f43f5e';
    ctx.fillRect(obiX, 0, obiW, h);

    ctx.fillStyle = obi.textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '700 20px sans-serif';
    ctx.fillText(obi.japaneseTitle || '邦題タイトル', obiX + obiW / 2, 140);

    ctx.font = '500 14px sans-serif';
    ctx.fillText(obi.katakanaArtist || 'アーティスト', obiX + obiW / 2, 180);

    ctx.font = '700 16px "Geist Mono", monospace';
    ctx.fillText(obi.priceJpy || '¥4,180', obiX + obiW / 2, h - 70);

    ctx.font = '400 11px "Geist Mono", monospace';
    ctx.fillText(obi.releaseCode || 'JPC-01', obiX + obiW / 2, h - 45);
  }
}

function renderBack(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  jacket: JacketConfig,
  vinyl: VinylConfig,
  onImageLoaded: () => void
) {
  ctx.fillStyle = jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, w, h);

  if (jacket.backArtwork) {
    const img = getOrLoadImage(jacket.backArtwork, onImageLoaded);
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }

  if (!jacket.backArtwork) {
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText((jacket.artistName || 'ARTIST NAME').toUpperCase(), 40, 60);

    ctx.font = '400 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = jacket.accentColor || '#f43f5e';
    ctx.fillText((jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 40, 100);

    const colY = 160;
    const col1X = 40;
    const col2X = w / 2 + 20;

    // Side A
    ctx.font = '700 14px "Geist Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SIDE A  [ 33 ⅓ RPM ]', col1X, colY);

    ctx.font = '400 12px "Plus Jakarta Sans", sans-serif';
    (vinyl?.sideALabel?.tracks || []).forEach((track, i) => {
      const y = colY + 28 + i * 26;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(track.number, col1X, y);
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(track.title, col1X + 28, y);
      ctx.fillStyle = '#71717a';
      ctx.fillText(track.duration, col1X + 220, y);
    });

    // Side B
    ctx.font = '700 14px "Geist Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SIDE B  [ 33 ⅓ RPM ]', col2X, colY);

    (vinyl?.sideBLabel?.tracks || []).forEach((track, i) => {
      const y = colY + 28 + i * 26;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(track.number, col2X, y);
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(track.title, col2X + 28, y);
      ctx.fillStyle = '#71717a';
      ctx.fillText(track.duration, col2X + 220, y);
    });

    // Footer barcode
    const code = jacket.barcode || '7 93573 19482 0';
    const barW = 100;
    const barH = 50;
    const barX = w - barW - 40;
    const barY = h - barH - 40;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 24; i++) {
      if ((i * 7 + 3) % 4 !== 0) {
        ctx.fillRect(barX + 8 + i * 3.5, barY + 6, 2, barH - 18);
      }
    }
    ctx.font = '500 8px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, barX + barW / 2, barY + barH - 4);

    ctx.font = '400 9px "Geist Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'left';
    ctx.fillText(vinyl?.sideALabel?.copyrightNotice || '℗ & © 2026. ALL RIGHTS RESERVED.', 40, h - 50);
  }

  if (jacket.centerCutoutHole) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.17, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.17, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}
