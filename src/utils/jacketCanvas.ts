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
  const spineFoldGrad = ctx.createLinearGradient(0, 0, w * 0.04, 0);
  spineFoldGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
  spineFoldGrad.addColorStop(0.3, 'rgba(255,255,255,0.06)');
  spineFoldGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spineFoldGrad;
  ctx.fillRect(0, 0, w * 0.04, h);

  if (!jacket.frontArtwork) {
    const pad = w * 0.07;
    const barW = w * 0.014;
    const barH = w * 0.11;

    ctx.fillStyle = accent;
    ctx.fillRect(pad, pad, barW, barH);

    const artistSize = Math.round(w * 0.038);
    const titleSize = Math.round(w * 0.064);

    ctx.font = `700 ${artistSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText((jacket.artistName || 'ARTIST NAME').toUpperCase(), pad + barW + 16, pad + artistSize);

    ctx.font = `300 ${titleSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText((jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), pad + barW + 16, pad + artistSize + titleSize + 8);

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
      ctx.lineWidth = Math.max(2, w * 0.004);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = `${accent}35`;
      ctx.lineWidth = Math.max(1.5, w * 0.0025);
      ctx.strokeRect(w * 0.15, h * 0.3, w * 0.7, h * 0.42);

      ctx.fillStyle = `${accent}10`;
      ctx.fillRect(w * 0.15, h * 0.3, w * 0.7, h * 0.42);

      const frameH1 = Math.round(w * 0.024);
      const frameH2 = Math.round(w * 0.019);
      ctx.font = `600 ${frameH1}px "Geist Mono", monospace`;
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.fillText(`${(vinyl?.size || '12inch').toUpperCase()} AUDIOPHILE PRESSING`, w / 2, h / 2 - 12);

      ctx.font = `400 ${frameH2}px "Geist Mono", monospace`;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(`${vinyl?.weight || '180g'} • ${(vinyl?.rpm || '33rpm').toUpperCase()}`, w / 2, h / 2 + 24);
    }

    const catSize = Math.round(w * 0.024);
    ctx.font = `500 ${catSize}px "Geist Mono", monospace`;
    ctx.fillStyle = '#a1a1aa';
    ctx.textAlign = 'left';
    ctx.fillText(jacket.catalogNumber || 'CAT-001', pad, h - pad);
  }

  // Obi Strip wrap if enabled
  if (obi?.enabled) {
    const obiW = w * 0.17;
    const obiX = obi.position === 'left' ? w * 0.05 : w - obiW - w * 0.05;

    ctx.fillStyle = obi.backgroundColor || '#f43f5e';
    ctx.fillRect(obiX, 0, obiW, h);

    ctx.fillStyle = obi.textColor || '#ffffff';
    ctx.textAlign = 'center';
    const obiTitle = Math.round(w * 0.032);
    ctx.font = `700 ${obiTitle}px sans-serif`;
    ctx.fillText(obi.japaneseTitle || '邦題タイトル', obiX + obiW / 2, h * 0.22);

    const obiArtist = Math.round(w * 0.024);
    ctx.font = `500 ${obiArtist}px sans-serif`;
    ctx.fillText(obi.katakanaArtist || 'アーティスト', obiX + obiW / 2, h * 0.28);

    const obiPrice = Math.round(w * 0.026);
    ctx.font = `700 ${obiPrice}px "Geist Mono", monospace`;
    ctx.fillText(obi.priceJpy || '¥4,180', obiX + obiW / 2, h - w * 0.1);

    const obiCode = Math.round(w * 0.018);
    ctx.font = `400 ${obiCode}px "Geist Mono", monospace`;
    ctx.fillText(obi.releaseCode || 'JPC-01', obiX + obiW / 2, h - w * 0.06);
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
    const pad = w * 0.07;
    const artistSize = Math.round(w * 0.035);
    const titleSize = Math.round(w * 0.052);

    ctx.font = `700 ${artistSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText((jacket.artistName || 'ARTIST NAME').toUpperCase(), pad, pad + artistSize);

    ctx.font = `400 ${titleSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = jacket.accentColor || '#f43f5e';
    ctx.fillText((jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), pad, pad + artistSize + titleSize + 10);

    const colY = pad + artistSize + titleSize + w * 0.08;
    const col1X = pad;
    const col2X = w / 2 + w * 0.04;

    const colHeaderSize = Math.round(w * 0.024);
    const trackSize = Math.round(w * 0.02);
    const rowHeight = Math.round(w * 0.044);

    // Side A
    ctx.font = `700 ${colHeaderSize}px "Geist Mono", monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SIDE A  [ 33 ⅓ RPM ]', col1X, colY);

    ctx.font = `400 ${trackSize}px "Plus Jakarta Sans", sans-serif`;
    (vinyl?.sideALabel?.tracks || []).forEach((track, i) => {
      const y = colY + colHeaderSize + 14 + i * rowHeight;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(track.number, col1X, y);
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(track.title, col1X + w * 0.05, y);
      ctx.fillStyle = '#71717a';
      ctx.fillText(track.duration, col1X + w * 0.35, y);
    });

    // Side B
    ctx.font = `700 ${colHeaderSize}px "Geist Mono", monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SIDE B  [ 33 ⅓ RPM ]', col2X, colY);

    (vinyl?.sideBLabel?.tracks || []).forEach((track, i) => {
      const y = colY + colHeaderSize + 14 + i * rowHeight;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(track.number, col2X, y);
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(track.title, col2X + w * 0.05, y);
      ctx.fillStyle = '#71717a';
      ctx.fillText(track.duration, col2X + w * 0.35, y);
    });

    // Footer barcode
    const code = jacket.barcode || '7 93573 19482 0';
    const barW = Math.round(w * 0.24);
    const barH = Math.round(w * 0.11);
    const barX = w - barW - pad;
    const barY = h - barH - pad;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 28; i++) {
      if ((i * 7 + 3) % 4 !== 0) {
        ctx.fillRect(barX + 12 + i * (barW * 0.03), barY + 10, barW * 0.02, barH - 32);
      }
    }
    const barFontSize = Math.max(8, Math.round(w * 0.015));
    ctx.font = `500 ${barFontSize}px "Geist Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(code, barX + barW / 2, barY + barH - 8);

    const copySize = Math.max(8, Math.round(w * 0.016));
    ctx.font = `400 ${copySize}px "Geist Mono", monospace`;
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'left';
    ctx.fillText(vinyl?.sideALabel?.copyrightNotice || '℗ & © 2026. ALL RIGHTS RESERVED.', pad, h - pad);
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
