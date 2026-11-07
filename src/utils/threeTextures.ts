import * as THREE from 'three';
import { ProjectData, SlipmatStyle } from '../types';
import { renderPhotorealisticSplatter } from './splatterGenerator';

export { renderPhotorealisticSplatter, renderPhotorealisticSplatter as drawOrganicSplatter };

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
  } else if (img.complete && onLoaded) {
    setTimeout(onLoaded, 0);
  }
  return img;
}

/**
 * Generates ultra high-res (2048x2048) canvas texture for vinyl face (Side A or Side B)
 */
export function createVinylFaceTexture(
  project: ProjectData,
  side: 'A' | 'B',
  onTextureUpdated?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;

  if (!ctx) return texture;

  const center = 1024;
  const radius = 1000;
  const vinyl = project?.vinyl || ({} as any);

  ctx.save();
  ctx.translate(center, center);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();

  // 1. BASE MATERIAL & FOUNDATION COLOR
  const baseColor: string = vinyl.baseColor || vinyl.primaryColor || '#121214';
  const finish: string = (vinyl.finishEffect || vinyl.colorStyle || 'none') as string;
  const secondaryColor: string = vinyl.secondaryColor || '#27272a';
  const tertiaryColor: string = vinyl.tertiaryColor || vinyl.splatterColor1 || '#38bdf8';

  if (baseColor.toLowerCase() === '#121214' || vinyl.colorStyle === 'standard_black') {
    const grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, '#101114');
    grad.addColorStop(0.7, '#16171c');
    grad.addColorStop(1, '#0c0d0f');
    ctx.fillStyle = grad;
    ctx.fill();
  } else {
    ctx.fillStyle = baseColor;
    ctx.fill();
  }

  // 2. FINISH / PATTERN EFFECT LAYER (Applied over foundation base)
  if (finish === 'two_tone' || vinyl.colorStyle === 'half_and_half') {
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fillStyle = secondaryColor;
    ctx.fill();
  } else if (finish === 'three_tone' || vinyl.colorStyle === 'tri_color_split') {
    const colors = [baseColor, secondaryColor, tertiaryColor];
    for (let i = 0; i < 3; i++) {
      const start = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const end = start + (2 * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = colors[i];
      ctx.fill();
    }
  } else if (finish === 'color_in_color' || vinyl.colorStyle === 'color_in_color') {
    const innerRadius = radius * 0.65;
    const centerGrad = ctx.createRadialGradient(0, 0, innerRadius * 0.3, 0, 0, innerRadius);
    centerGrad.addColorStop(0, secondaryColor);
    centerGrad.addColorStop(0.85, secondaryColor);
    centerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fill();
  } else if (finish === 'galaxy_swirl' || finish === 'marble' || vinyl.colorStyle === 'marble') {
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = radius * 0.08;
    ctx.globalAlpha = 0.55;

    for (let i = 0; i < 11; i++) {
      ctx.beginPath();
      const a = (i * Math.PI) / 5.5;
      const x1 = Math.cos(a) * radius * 0.3;
      const y1 = Math.sin(a) * radius * 0.3;
      const x2 = Math.cos(a + 1.25) * radius * 0.9;
      const y2 = Math.sin(a + 1.25) * radius * 0.9;
      ctx.bezierCurveTo(x1, y1, -y1, x1, x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (finish === 'splatter' || vinyl.colorStyle === 'splatter') {
    // Photorealistic pressing-plant splatter
    renderPhotorealisticSplatter(ctx, radius, vinyl);
  } else if (finish === 'glow_in_the_dark' || vinyl.colorStyle === 'glow_in_the_dark') {
    const glowColor = vinyl.glowColor || '#22c55e';
    const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    glowGrad.addColorStop(0, '#f0fdf4');
    glowGrad.addColorStop(0.5, glowColor);
    glowGrad.addColorStop(0.9, '#15803d');
    glowGrad.addColorStop(1, '#052e16');
    ctx.fillStyle = glowGrad;
    ctx.fill();
  } else if (finish === 'liquid_glitter' || vinyl.colorStyle === 'liquid_glitter') {
    ctx.save();
    ctx.clip();
    for (let i = 0; i < 280; i++) {
      const angle = (i * 123.7 * Math.PI) / 180;
      const dist = radius * 0.34 + (radius * 0.6 * ((i * 47) % 100)) / 100;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(253,224,71,0.75)';
      ctx.fillRect(x, y, 3.5, 3.5);
    }
    ctx.restore();
  } else if (finish === 'picture_disc' || vinyl.colorStyle === 'picture_disc') {
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.save();
    ctx.clip();
    const picImage = side === 'A' ? vinyl.pictureDiscImage : (vinyl.pictureDiscBackImage || vinyl.pictureDiscImage);
    if (picImage) {
      const img = getOrLoadImage(picImage, () => {
        texture.needsUpdate = true;
        if (onTextureUpdated) onTextureUpdated();
      });
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
      }
    } else {
      const picGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
      picGrad.addColorStop(0, baseColor);
      picGrad.addColorStop(0.5, secondaryColor);
      picGrad.addColorStop(1, tertiaryColor);
      ctx.fillStyle = picGrad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 6;
      for (let r = radius * 0.38; r < radius * 0.9; r += radius * 0.1) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Polished outer rim bevel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 5;
  ctx.stroke();

  // 3. Concentric Micro-Grooves & Inter-Track Gaps (High resolution)
  const labelRadius = radius * 0.335;
  const deadWaxRadius = radius * 0.46;
  const musicOuterRadius = radius * 0.94;
  const bands = Math.max(1, vinyl.trackBandsCount || 4);
  const totalMusicWidth = musicOuterRadius - deadWaxRadius;
  const bandWidth = totalMusicWidth / bands;

  ctx.lineWidth = 1.0;
  for (let b = 0; b < bands; b++) {
    const bandStart = deadWaxRadius + b * bandWidth;
    const bandEnd = bandStart + bandWidth;

    for (let i = 1; i < 32; i++) {
      const r = bandStart + (bandWidth * i) / 32;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.28)';
      ctx.stroke();
    }

    if (b < bands - 1) {
      ctx.beginPath();
      ctx.arc(0, 0, bandEnd, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.lineWidth = 4.5;
      ctx.stroke();
      ctx.lineWidth = 1.0;
    }
  }

  // 4. Dead wax & Matrix Stamped Text
  const matrixText = side === 'A' ? (vinyl.matrixTextSideA || 'SIDE A') : (vinyl.matrixTextSideB || 'SIDE B');
  const textRadius = (labelRadius + deadWaxRadius) / 2 + 14;
  ctx.font = '500 20px "Geist Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const anglePerChar = 0.038;
  const totalAngle = matrixText.length * anglePerChar;
  const startAngle = -Math.PI / 2 - totalAngle / 2;

  for (let i = 0; i < matrixText.length; i++) {
    const char = matrixText[i];
    const charAngle = startAngle + i * anglePerChar;
    ctx.save();
    ctx.rotate(charAngle);
    ctx.translate(0, -textRadius);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  // 5. Center Label Paper Disc
  const label = side === 'A' ? vinyl.sideALabel : vinyl.sideBLabel;
  const labelBg = label?.backgroundColor || '#ffffff';
  const labelText = label?.textColor || '#000000';
  const labelAccent = label?.accentColor || '#e11d48';

  ctx.beginPath();
  ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = labelBg;
  ctx.fill();

  if (label?.artworkImage) {
    const img = getOrLoadImage(label.artworkImage, () => {
      texture.needsUpdate = true;
      if (onTextureUpdated) onTextureUpdated();
    });
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, -labelRadius, -labelRadius, labelRadius * 2, labelRadius * 2);
      ctx.restore();
    }
  }

  ctx.lineWidth = 3.5;
  ctx.strokeStyle = labelAccent || 'rgba(0,0,0,0.15)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, labelRadius * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = labelAccent ? `${labelAccent}33` : 'rgba(0,0,0,0.08)';
  ctx.stroke();

  // Label Typography (scaled for 2K resolution)
  ctx.fillStyle = labelText;
  ctx.textAlign = 'center';

  ctx.font = '600 20px "Geist Mono", monospace';
  ctx.fillText(`${label?.catalogNumber || 'CAT-01'}  •  ${label?.sideIndicator || 'SIDE A'}`, 0, -labelRadius * 0.65);

  ctx.font = '500 17px "Geist Mono", monospace';
  ctx.fillStyle = labelAccent;
  ctx.fillText(label?.rpmBadge || '33 ⅓ RPM', 0, -labelRadius * 0.52);

  ctx.fillStyle = labelText;
  ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
  const cleanTitle = (label?.title || project?.jacket?.albumTitle || 'UNTITLED').toUpperCase();
  ctx.fillText(cleanTitle.length > 22 ? cleanTitle.slice(0, 20) + '...' : cleanTitle, 0, -labelRadius * 0.28);

  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(label?.artist || project?.jacket?.artistName || 'UNKNOWN ARTIST', 0, -labelRadius * 0.16);

  const tracksToDisplay = (label?.tracks || []).slice(0, 4);
  const startY = labelRadius * 0.26;
  ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';

  tracksToDisplay.forEach((track, idx) => {
    const y = startY + idx * 26;
    const line = `${track.number || idx + 1}. ${track.title} [${track.duration || '3:00'}]`;
    ctx.fillText(line.length > 28 ? line.slice(0, 26) + '...' : line, 0, y);
  });

  ctx.font = '400 13px "Geist Mono", monospace';
  ctx.fillStyle = 'rgba(120, 120, 120, 0.85)';
  const copyright = label?.copyrightNotice || 'ALL RIGHTS RESERVED';
  ctx.fillText(copyright.length > 38 ? copyright.slice(0, 36) + '...' : copyright, 0, labelRadius * 0.8);

  // 6. Spindle Center Hole
  const isDinked = vinyl.holeType === 'dinked_large' && vinyl.size === '7inch';
  const holeRadius = isDinked ? radius * 0.12 : radius * 0.035;

  ctx.beginPath();
  ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#050507';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.stroke();

  ctx.restore();

  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates normal/bump map for Three.js PBR physical material
 */
export function createVinylBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  if (!ctx) return texture;

  const center = 512;
  const radius = 500;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.save();
  ctx.translate(center, center);

  const deadWax = radius * 0.46;
  const musicOuter = radius * 0.94;

  ctx.lineWidth = 1.5;
  for (let r = deadWax; r < musicOuter; r += 3.5) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = r % 5 === 0 ? '#b0b0b0' : '#555555';
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.335, 0, Math.PI * 2);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.restore();

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates ultra high-res (2048x2048) canvas texture for Outer Jacket Front
 */
export function createJacketFrontTexture(
  project: ProjectData,
  onTextureUpdated?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const w = 2048;
  const h = 2048;
  const jacket = project?.jacket || ({} as any);

  ctx.fillStyle = jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, w, h);

  if (jacket.frontArtwork) {
    const img = getOrLoadImage(jacket.frontArtwork, () => {
      texture.needsUpdate = true;
      if (onTextureUpdated) onTextureUpdated();
    });
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }

  const accent = jacket.accentColor || '#f43f5e';

  // Left spine fold shadow
  const spineFoldGrad = ctx.createLinearGradient(0, 0, 70, 0);
  spineFoldGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  spineFoldGrad.addColorStop(0.3, 'rgba(255,255,255,0.08)');
  spineFoldGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spineFoldGrad;
  ctx.fillRect(0, 0, 70, h);

  // If no custom artwork, render clean typographic design
  if (!jacket.frontArtwork) {
    ctx.fillStyle = accent;
    ctx.fillRect(140, 140, 24, 220);

    ctx.font = '700 76px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText((jacket.artistName || 'ARTIST NAME').toUpperCase(), 200, 215);

    ctx.font = '300 120px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText((jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 200, 340);

    if (jacket.centerCutoutHole) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 340, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 340, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = `${accent}35`;
      ctx.lineWidth = 4;
      ctx.strokeRect(w * 0.15, h * 0.28, w * 0.7, h * 0.44);

      ctx.fillStyle = `${accent}10`;
      ctx.fillRect(w * 0.15, h * 0.28, w * 0.7, h * 0.44);

      ctx.font = '600 44px "Geist Mono", monospace';
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.fillText(`${(project?.vinyl?.size || '12inch').toUpperCase()} AUDIOPHILE PRESSING`, w / 2, h / 2 - 25);

      ctx.font = '400 36px "Geist Mono", monospace';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(`${project?.vinyl?.weight || '180g'} • ${(project?.vinyl?.rpm || '33rpm').toUpperCase()} • STEREO MASTER`, w / 2, h / 2 + 45);
    }

    ctx.font = '500 44px "Geist Mono", monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.textAlign = 'left';
    ctx.fillText(jacket.catalogNumber || 'CAT-001', 140, h - 140);
  }

  // Obi Strip wrap if enabled
  if (project?.obi?.enabled) {
    const obiW = 340;
    const obiX = project.obi.position === 'left' ? 140 : w - obiW - 140;

    ctx.fillStyle = project.obi.backgroundColor || '#f43f5e';
    ctx.fillRect(obiX, 0, obiW, h);

    ctx.fillStyle = project.obi.textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '700 58px sans-serif';
    ctx.fillText(project.obi.japaneseTitle || '邦題タイトル', obiX + obiW / 2, 400);

    ctx.font = '500 42px sans-serif';
    ctx.fillText(project.obi.katakanaArtist || 'アーティスト', obiX + obiW / 2, 500);

    ctx.font = '700 50px "Geist Mono", monospace';
    ctx.fillText(project.obi.priceJpy || '¥4,180', obiX + obiW / 2, h - 220);

    ctx.font = '400 32px "Geist Mono", monospace';
    ctx.fillText(project.obi.releaseCode || 'JPC-01', obiX + obiW / 2, h - 140);
  }

  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates ultra high-res (2048x2048) canvas texture for Outer Jacket Back
 */
export function createJacketBackTexture(
  project: ProjectData,
  onTextureUpdated?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const w = 2048;
  const h = 2048;
  const jacket = project?.jacket || ({} as any);

  ctx.fillStyle = jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, w, h);

  if (jacket.backArtwork) {
    const img = getOrLoadImage(jacket.backArtwork, () => {
      texture.needsUpdate = true;
      if (onTextureUpdated) onTextureUpdated();
    });
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }

  if (!jacket.backArtwork) {
    ctx.font = '700 64px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText((jacket.artistName || 'ARTIST NAME').toUpperCase(), 140, 180);

    ctx.font = '400 90px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = jacket.accentColor || '#f43f5e';
    ctx.fillText((jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 140, 280);

    const colY = 480;
    const col1X = 140;
    const col2X = w / 2 + 60;

    // Side A
    ctx.font = '700 44px "Geist Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SIDE A  [ 33 ⅓ RPM ]', col1X, colY);

    ctx.font = '400 36px "Plus Jakarta Sans", sans-serif';
    (project?.vinyl?.sideALabel?.tracks || []).forEach((track, i) => {
      const y = colY + 80 + i * 75;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(track.number, col1X, y);
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(track.title, col1X + 80, y);
      ctx.fillStyle = '#71717a';
      ctx.fillText(track.duration, col1X + 620, y);
    });

    // Side B
    ctx.font = '700 44px "Geist Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SIDE B  [ 33 ⅓ RPM ]', col2X, colY);

    (project?.vinyl?.sideBLabel?.tracks || []).forEach((track, i) => {
      const y = colY + 80 + i * 75;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(track.number, col2X, y);
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(track.title, col2X + 80, y);
      ctx.fillStyle = '#71717a';
      ctx.fillText(track.duration, col2X + 620, y);
    });

    // Footer barcode
    const code = jacket.barcode || '7 93573 19482 0';
    const barW = 300;
    const barH = 150;
    const barX = w - barW - 140;
    const barY = h - barH - 140;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 28; i++) {
      if ((i * 7 + 3) % 4 !== 0) {
        ctx.fillRect(barX + 18 + i * 9.5, barY + 16, 6, barH - 50);
      }
    }
    ctx.font = '500 22px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, barX + barW / 2, barY + barH - 12);

    ctx.font = '400 28px "Geist Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'left';
    ctx.fillText(project?.vinyl?.sideALabel?.copyrightNotice || '℗ & © 2026. ALL RIGHTS RESERVED.', 140, h - 150);
  }

  if (jacket.centerCutoutHole) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 340, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 340, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  }

  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates texture for Jacket Spine
 */
export function createJacketSpineTexture(project: ProjectData): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const jacket = project?.jacket || ({} as any);
  ctx.fillStyle = jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, 128, 2048);

  ctx.save();
  ctx.translate(64, 1024);
  ctx.rotate(-Math.PI / 2);

  ctx.font = '600 36px "Geist Mono", monospace';
  ctx.fillStyle = '#f4f4f5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = jacket.spineText || `${jacket.artistName || 'ARTIST'} — ${jacket.albumTitle || 'ALBUM'} — ${jacket.catalogNumber || 'CAT'}`;
  ctx.fillText(text.toUpperCase(), 0, 0);

  ctx.restore();

  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates ultra high-res (2048x2048) texture for Anti-Static Archival Inner Sleeve
 */
export function createInnerSleeveTexture(
  project: ProjectData,
  side: 'front' | 'back',
  onTextureUpdated?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const w = 2048;
  const h = 2048;
  const inner = project?.innerSleeve || ({} as any);
  const type = inner.type || 'anti_static_rice_paper';
  const customArt = side === 'front' ? inner.frontArtwork : (inner.backArtwork || inner.frontArtwork);

  // Base background fill according to inner sleeve type
  if (customArt) {
    const img = getOrLoadImage(customArt, () => {
      texture.needsUpdate = true;
      if (onTextureUpdated) onTextureUpdated();
    });
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    }
  } else if (type === 'anti_static_rice_paper') {
    // Semi-translucent MoFi-style archival rice paper with frosted fibrous look
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Subtle paper grid pattern
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 2;
    for (let x = 120; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 120; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Top archival banner strip
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, 110);

    ctx.font = '600 32px "Geist Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(
      inner.archivalPrintText || 'ARCHIVAL MASTER SLEEVE • ANTI-STATIC HDPE • ACID FREE',
      w / 2,
      68
    );
  } else if (type === 'poly_lined_paper') {
    ctx.fillStyle = inner.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, w, h);
  } else if (type === 'poly_lined_black') {
    ctx.fillStyle = inner.backgroundColor || '#18181b';
    ctx.fillRect(0, 0, w, h);
  } else if (type === 'heavyweight_kraft') {
    ctx.fillStyle = inner.backgroundColor || '#78350f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#92400e';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect((i * 97) % w, (i * 131) % h, 4, 4);
    }
  } else if (type === 'japanese_u_bottom') {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h);

    ctx.font = '500 28px "Geist Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('NAGAOKA STYLE ANTI-STATIC ROUND SLEEVE 0.028mm', w / 2, 75);
  } else {
    ctx.fillStyle = inner.backgroundColor || '#1e1b4b';
    ctx.fillRect(0, 0, w, h);
  }

  // Die-cut center aperture hole
  if (inner.hasDieCutHole !== false) {
    const holeRadius = inner.dieCutDiameterMm === 85 ? 280 : 340;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, holeRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
  }

  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates slipmat texture for Turntable platter
 */
export function createSlipmatTexture(mat: SlipmatStyle): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const center = 512;
  const radius = 490;

  if (mat === 'cork') {
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    for (let i = 0; i < 600; i++) {
      const a = (i * 137.5 * Math.PI) / 180;
      const d = ((i * 39) % radius);
      ctx.fillRect(center + Math.cos(a) * d, center + Math.sin(a) * d, 4, 4);
    }
  } else if (mat === 'geometric') {
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    for (let r = 40; r < radius; r += 34) {
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    // Felt black
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }

  texture.needsUpdate = true;
  return texture;
}
