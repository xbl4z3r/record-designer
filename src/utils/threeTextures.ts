import * as THREE from 'three';
import { ProjectData, SlipmatStyle } from '../types';

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
 * Organic Procedural Splatter Generator for Real Vinyl Pressing Effect
 */
export function drawOrganicSplatter(
  ctx: CanvasRenderingContext2D,
  radius: number,
  vinyl: any
) {
  const toneCount = vinyl.splatterToneCount || 1;
  const c1 = vinyl.splatterColor1 || vinyl.splatterColor || '#ec4899';
  const c2 = vinyl.splatterColor2 || vinyl.secondaryColor || '#6366f1';
  const c3 = vinyl.splatterColor3 || '#38bdf8';
  const colors = toneCount === 3 ? [c1, c2, c3] : toneCount === 2 ? [c1, c2] : [c1];

  const density = Math.min(100, Math.max(10, vinyl.splatterDensity || 42));
  const spread = Math.min(2.5, Math.max(0.4, vinyl.splatterSpread || 1.1));

  ctx.save();
  ctx.clip(); // Constrain within disc bounds

  const burstCount = Math.floor(density * 0.45) + 6;

  for (let b = 0; b < burstCount; b++) {
    const color = colors[b % colors.length];
    const angle = b * 2.39996 + 0.35;
    const distance = radius * 0.36 + ((b * 37) % 100) * (radius * 0.54 / 100);

    const bx = Math.cos(angle) * distance;
    const by = Math.sin(angle) * distance;
    const burstSize = (4.5 + ((b * 19) % 11)) * spread;

    // 1. Central squashed dendritic core blob
    ctx.fillStyle = color;
    ctx.beginPath();
    const corePoints = 8;
    for (let p = 0; p <= corePoints; p++) {
      const pAngle = (p / corePoints) * Math.PI * 2;
      const rVar = burstSize * (0.65 + 0.35 * Math.sin(p * 3.7 + b * 1.3));
      const px = bx + Math.cos(pAngle) * rVar;
      const py = by + Math.sin(pAngle) * rVar;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 2. Dendritic branching tendrils shooting radially outwards
    const tendrilCount = 4 + (b % 4);
    for (let t = 0; t < tendrilCount; t++) {
      const baseOutAngle = Math.atan2(by, bx);
      const tendrilAngle = baseOutAngle + ((t - tendrilCount / 2) * 0.38) + ((b * 13) % 20 - 10) * 0.02;
      const tendrilLen = burstSize * (2.2 + ((t * 17 + b * 7) % 15) * 0.28) * spread;

      const tx = bx + Math.cos(tendrilAngle) * tendrilLen;
      const ty = by + Math.sin(tendrilAngle) * tendrilLen;
      const midX = bx + Math.cos(tendrilAngle + 0.12) * (tendrilLen * 0.5);
      const midY = by + Math.sin(tendrilAngle + 0.12) * (tendrilLen * 0.5);

      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(midX, midY, tx, ty);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.2, burstSize * 0.2);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Satellite droplet at the tendril tip
      const tipDist = tendrilLen + 5 + (t * 4);
      const tipX = bx + Math.cos(tendrilAngle) * tipDist;
      const tipY = by + Math.sin(tendrilAngle) * tipDist;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 1.2 + (t % 3) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Ambient micro-flecks sprayed along the groove direction
    const fleckCount = 7 + (b % 6);
    for (let f = 0; f < fleckCount; f++) {
      const fAngle = angle + ((f * 0.9) - 2.8);
      const fDist = distance + (((f * 29) % 44) - 22) * spread;
      const fx = Math.cos(fAngle) * fDist;
      const fy = Math.sin(fAngle) * fDist;
      ctx.beginPath();
      ctx.arc(fx, fy, 0.75 + ((f * 7) % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Generates high-res canvas texture for vinyl face (Side A or Side B)
 */
export function createVinylFaceTexture(
  project: ProjectData,
  side: 'A' | 'B',
  onTextureUpdated?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;

  if (!ctx) return texture;

  const center = 512;
  const radius = 500;
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

  // 2. FINISH / PATTERN EFFECT LAYER (Applied on top of base)
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
    // Call organic dynamic multi-tone splatter
    drawOrganicSplatter(ctx, radius, vinyl);
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
    for (let i = 0; i < 200; i++) {
      const angle = (i * 123.7 * Math.PI) / 180;
      const dist = radius * 0.34 + (radius * 0.6 * ((i * 47) % 100)) / 100;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(253,224,71,0.75)';
      ctx.fillRect(x, y, 2.5, 2.5);
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
      ctx.lineWidth = 4;
      for (let r = radius * 0.38; r < radius * 0.9; r += radius * 0.1) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Polished outer rim bevel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // 2. Concentric Audio Grooves & Bands
  const labelRadius = radius * 0.335;
  const deadWaxRadius = radius * 0.46;
  const musicOuterRadius = radius * 0.94;
  const bands = Math.max(1, vinyl.trackBandsCount || 4);
  const totalMusicWidth = musicOuterRadius - deadWaxRadius;
  const bandWidth = totalMusicWidth / bands;

  ctx.lineWidth = 0.75;
  for (let b = 0; b < bands; b++) {
    const bandStart = deadWaxRadius + b * bandWidth;
    const bandEnd = bandStart + bandWidth;

    for (let i = 1; i < 22; i++) {
      const r = bandStart + (bandWidth * i) / 22;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.28)';
      ctx.stroke();
    }

    if (b < bands - 1) {
      ctx.beginPath();
      ctx.arc(0, 0, bandEnd, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.lineWidth = 0.75;
    }
  }

  // 3. Dead wax & Matrix Stamped Text
  const matrixText = side === 'A' ? (vinyl.matrixTextSideA || 'SIDE A') : (vinyl.matrixTextSideB || 'SIDE B');
  const textRadius = (labelRadius + deadWaxRadius) / 2 + 8;
  ctx.font = '500 11px "Geist Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
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

  // 4. Center Label Paper Disc
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

  ctx.lineWidth = 2;
  ctx.strokeStyle = labelAccent || 'rgba(0,0,0,0.15)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, labelRadius * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = labelAccent ? `${labelAccent}33` : 'rgba(0,0,0,0.08)';
  ctx.stroke();

  // Label Typography
  ctx.fillStyle = labelText;
  ctx.textAlign = 'center';

  ctx.font = '600 10px "Geist Mono", monospace';
  ctx.fillText(`${label?.catalogNumber || 'CAT-01'}  •  ${label?.sideIndicator || 'SIDE A'}`, 0, -labelRadius * 0.65);

  ctx.font = '500 8.5px "Geist Mono", monospace';
  ctx.fillStyle = labelAccent;
  ctx.fillText(label?.rpmBadge || '33 ⅓ RPM', 0, -labelRadius * 0.52);

  ctx.fillStyle = labelText;
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  const cleanTitle = (label?.title || project?.jacket?.albumTitle || 'UNTITLED').toUpperCase();
  ctx.fillText(cleanTitle.length > 22 ? cleanTitle.slice(0, 20) + '...' : cleanTitle, 0, -labelRadius * 0.28);

  ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(label?.artist || project?.jacket?.artistName || 'UNKNOWN ARTIST', 0, -labelRadius * 0.16);

  const tracksToDisplay = (label?.tracks || []).slice(0, 4);
  const startY = labelRadius * 0.26;
  ctx.font = '400 9px "Plus Jakarta Sans", sans-serif';

  tracksToDisplay.forEach((track, idx) => {
    const y = startY + idx * 13;
    const line = `${track.number || idx + 1}. ${track.title} [${track.duration || '3:00'}]`;
    ctx.fillText(line.length > 28 ? line.slice(0, 26) + '...' : line, 0, y);
  });

  ctx.font = '400 7px "Geist Mono", monospace';
  ctx.fillStyle = 'rgba(120, 120, 120, 0.85)';
  const copyright = label?.copyrightNotice || 'ALL RIGHTS RESERVED';
  ctx.fillText(copyright.length > 38 ? copyright.slice(0, 36) + '...' : copyright, 0, labelRadius * 0.8);

  // 5. Spindle Hole Cutout
  const isDinked = vinyl.holeType === 'dinked_large' && vinyl.size === '7inch';
  const holeRadius = isDinked ? radius * 0.12 : radius * 0.035;

  ctx.beginPath();
  ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#050507';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
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
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  if (!ctx) return texture;

  const center = 256;
  const radius = 250;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  ctx.save();
  ctx.translate(center, center);

  const deadWax = radius * 0.46;
  const musicOuter = radius * 0.94;

  ctx.lineWidth = 1;
  for (let r = deadWax; r < musicOuter; r += 2.5) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = r % 5 === 0 ? '#a0a0a0' : '#606060';
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.335, 0, Math.PI * 2);
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates high-res canvas texture for Outer Jacket Front
 */
export function createJacketFrontTexture(
  project: ProjectData,
  onTextureUpdated?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const w = 1024;
  const h = 1024;
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
  const spineFoldGrad = ctx.createLinearGradient(0, 0, 40, 0);
  spineFoldGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  spineFoldGrad.addColorStop(0.3, 'rgba(255,255,255,0.08)');
  spineFoldGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spineFoldGrad;
  ctx.fillRect(0, 0, 40, h);

  // If no custom artwork, render clean typographic design
  if (!jacket.frontArtwork) {
    ctx.fillStyle = accent;
    ctx.fillRect(70, 70, 14, 110);

    ctx.font = '700 38px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText((jacket.artistName || 'ARTIST NAME').toUpperCase(), 105, 110);

    ctx.font = '300 64px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText((jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 105, 175);

    if (jacket.centerCutoutHole) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 170, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 170, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = `${accent}35`;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(w * 0.15, h * 0.28, w * 0.7, h * 0.44);

      ctx.fillStyle = `${accent}10`;
      ctx.fillRect(w * 0.15, h * 0.28, w * 0.7, h * 0.44);

      ctx.font = '600 24px "Geist Mono", monospace';
      ctx.fillStyle = accent;
      ctx.textAlign = 'center';
      ctx.fillText(`${(project?.vinyl?.size || '12inch').toUpperCase()} AUDIOPHILE PRESSING`, w / 2, h / 2 - 15);

      ctx.font = '400 20px "Geist Mono", monospace';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(`${project?.vinyl?.weight || '180g'} • ${(project?.vinyl?.rpm || '33rpm').toUpperCase()} • STEREO MASTER`, w / 2, h / 2 + 25);
    }

    ctx.font = '500 24px "Geist Mono", monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.textAlign = 'left';
    ctx.fillText(jacket.catalogNumber || 'CAT-001', 70, h - 70);
  }

  // Obi Strip wrap if enabled
  if (project?.obi?.enabled) {
    const obiW = 180;
    const obiX = project.obi.position === 'left' ? 70 : w - obiW - 70;

    ctx.fillStyle = project.obi.backgroundColor || '#f43f5e';
    ctx.fillRect(obiX, 0, obiW, h);

    ctx.fillStyle = project.obi.textColor || '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '700 32px sans-serif';
    ctx.fillText(project.obi.japaneseTitle || '邦題タイトル', obiX + obiW / 2, 220);

    ctx.font = '500 24px sans-serif';
    ctx.fillText(project.obi.katakanaArtist || 'アーティスト', obiX + obiW / 2, 280);

    ctx.font = '700 28px "Geist Mono", monospace';
    ctx.fillText(project.obi.priceJpy || '¥4,180', obiX + obiW / 2, h - 120);

    ctx.font = '400 18px "Geist Mono", monospace';
    ctx.fillText(project.obi.releaseCode || 'JPC-01', obiX + obiW / 2, h - 70);
  }

  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates high-res canvas texture for Outer Jacket Back
 */
export function createJacketBackTexture(
  project: ProjectData,
  onTextureUpdated?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const w = 1024;
  const h = 1024;
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
    ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText((jacket.artistName || 'ARTIST NAME').toUpperCase(), 70, 95);

    ctx.font = '400 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = jacket.accentColor || '#f43f5e';
    ctx.fillText((jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 70, 150);

    const colY = 250;
    const col1X = 70;
    const col2X = w / 2 + 30;

    // Side A
    ctx.font = '700 24px "Geist Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SIDE A  [ 33 ⅓ RPM ]', col1X, colY);

    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    (project?.vinyl?.sideALabel?.tracks || []).forEach((track, i) => {
      const y = colY + 45 + i * 40;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(track.number, col1X, y);
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(track.title, col1X + 45, y);
      ctx.fillStyle = '#71717a';
      ctx.fillText(track.duration, col1X + 330, y);
    });

    // Side B
    ctx.font = '700 24px "Geist Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('SIDE B  [ 33 ⅓ RPM ]', col2X, colY);

    (project?.vinyl?.sideBLabel?.tracks || []).forEach((track, i) => {
      const y = colY + 45 + i * 40;
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(track.number, col2X, y);
      ctx.fillStyle = '#f4f4f5';
      ctx.fillText(track.title, col2X + 45, y);
      ctx.fillStyle = '#71717a';
      ctx.fillText(track.duration, col2X + 330, y);
    });

    // Footer barcode
    const code = jacket.barcode || '7 93573 19482 0';
    const barW = 160;
    const barH = 80;
    const barX = w - barW - 70;
    const barY = h - barH - 70;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 28; i++) {
      if ((i * 7 + 3) % 4 !== 0) {
        ctx.fillRect(barX + 10 + i * 5, barY + 8, 3, barH - 26);
      }
    }
    ctx.font = '500 12px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(code, barX + barW / 2, barY + barH - 6);

    ctx.font = '400 15px "Geist Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'left';
    ctx.fillText(project?.vinyl?.sideALabel?.copyrightNotice || '℗ & © 2026. ALL RIGHTS RESERVED.', 70, h - 80);
  }

  if (jacket.centerCutoutHole) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 170, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 170, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
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
  canvas.width = 64;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const jacket = project?.jacket || ({} as any);
  ctx.fillStyle = jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, 64, 1024);

  ctx.save();
  ctx.translate(32, 512);
  ctx.rotate(-Math.PI / 2);

  ctx.font = '600 18px "Geist Mono", monospace';
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
 * Creates slipmat texture for Turntable platter
 */
export function createSlipmatTexture(mat: SlipmatStyle): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const center = 256;
  const radius = 245;

  if (mat === 'cork') {
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    for (let i = 0; i < 400; i++) {
      const a = (i * 137.5 * Math.PI) / 180;
      const d = ((i * 29) % radius);
      ctx.fillRect(center + Math.cos(a) * d, center + Math.sin(a) * d, 2.5, 2.5);
    }
  } else if (mat === 'geometric') {
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    for (let r = 20; r < radius; r += 18) {
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
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }

  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates high-res canvas texture for Anti-Static Archival Inner Sleeve (Front or Back)
 */
export function createInnerSleeveTexture(
  project: ProjectData,
  side: 'front' | 'back',
  onTextureUpdated?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (!ctx) return texture;

  const w = 1024;
  const h = 1024;
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
    ctx.lineWidth = 1;
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
    ctx.fillRect(0, 0, w, 60);

    ctx.font = '600 16px "Geist Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(
      inner.archivalPrintText || 'ARCHIVAL MASTER SLEEVE • ANTI-STATIC HDPE • ACID FREE',
      w / 2,
      36
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
    // Kraft texture flecks
    ctx.fillStyle = '#92400e';
    for (let i = 0; i < 300; i++) {
      ctx.fillRect((i * 97) % w, (i * 131) % h, 2, 2);
    }
  } else if (type === 'japanese_u_bottom') {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h);

    // Japanese technical marking
    ctx.font = '500 14px "Geist Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('NAGAOKA STYLE ANTI-STATIC ROUND SLEEVE 0.028mm', w / 2, 40);
  } else {
    ctx.fillStyle = inner.backgroundColor || '#1e1b4b';
    ctx.fillRect(0, 0, w, h);
  }

  // Die-cut center aperture hole
  if (inner.hasDieCutHole !== false) {
    const holeRadius = inner.dieCutDiameterMm === 85 ? 140 : 170;
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
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  texture.needsUpdate = true;
  return texture;
}
