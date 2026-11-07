import * as THREE from 'three';
import { ProjectData, SlipmatStyle } from '../types';

/**
 * Generates high-res canvas texture for vinyl face (Side A or Side B)
 */
export function createVinylFaceTexture(project: ProjectData, side: 'A' | 'B'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const center = 512;
  const radius = 500;
  const vinyl = project.vinyl;

  // 1. Vinyl Base Color & Effect
  ctx.save();
  ctx.translate(center, center);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();

  if (vinyl.colorStyle === 'standard_black') {
    const grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, '#101114');
    grad.addColorStop(0.7, '#16171c');
    grad.addColorStop(1, '#0c0d0f');
    ctx.fillStyle = grad;
    ctx.fill();
  } else if (vinyl.colorStyle === 'solid') {
    ctx.fillStyle = vinyl.primaryColor;
    ctx.fill();
  } else if (vinyl.colorStyle === 'transparent') {
    ctx.fillStyle = vinyl.primaryColor;
    ctx.fill();
  } else if (vinyl.colorStyle === 'half_and_half') {
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = vinyl.primaryColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fillStyle = vinyl.secondaryColor;
    ctx.fill();
  } else if (vinyl.colorStyle === 'color_in_color') {
    ctx.fillStyle = vinyl.primaryColor;
    ctx.fill();

    const innerRadius = radius * 0.65;
    const centerGrad = ctx.createRadialGradient(0, 0, innerRadius * 0.3, 0, 0, innerRadius);
    centerGrad.addColorStop(0, vinyl.secondaryColor);
    centerGrad.addColorStop(0.85, vinyl.secondaryColor);
    centerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fill();
  } else if (vinyl.colorStyle === 'marble') {
    ctx.fillStyle = vinyl.primaryColor;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.strokeStyle = vinyl.secondaryColor;
    ctx.lineWidth = radius * 0.08;
    ctx.globalAlpha = 0.55;

    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      const a = (i * Math.PI) / 4.5;
      const x1 = Math.cos(a) * radius * 0.3;
      const y1 = Math.sin(a) * radius * 0.3;
      const x2 = Math.cos(a + 1.2) * radius * 0.9;
      const y2 = Math.sin(a + 1.2) * radius * 0.9;
      ctx.bezierCurveTo(x1, y1, -y1, x1, x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (vinyl.colorStyle === 'splatter') {
    ctx.fillStyle = vinyl.primaryColor;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = vinyl.splatterColor;
    for (let i = 0; i < 64; i++) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const dist = radius * 0.35 + (radius * 0.6 * ((i * 37) % 100)) / 100;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const dropRadius = 3 + ((i * 17) % 8);

      ctx.beginPath();
      ctx.arc(x, y, dropRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = vinyl.splatterColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * dropRadius * 2.8, y + Math.sin(angle) * dropRadius * 2.8);
      ctx.stroke();
    }
    ctx.restore();
  } else if (vinyl.colorStyle === 'picture_disc') {
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.save();
    ctx.clip();
    const picGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    picGrad.addColorStop(0, vinyl.primaryColor);
    picGrad.addColorStop(0.5, vinyl.secondaryColor);
    picGrad.addColorStop(1, vinyl.splatterColor);
    ctx.fillStyle = picGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 4;
    for (let r = radius * 0.38; r < radius * 0.9; r += radius * 0.1) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Polished outer rim bevel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
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

    for (let i = 1; i < 24; i++) {
      const r = bandStart + (bandWidth * i) / 24;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.28)';
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
  ctx.beginPath();
  ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = label.backgroundColor || '#ffffff';
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = label.accentColor || 'rgba(0,0,0,0.15)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, labelRadius * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = label.accentColor ? `${label.accentColor}33` : 'rgba(0,0,0,0.08)';
  ctx.stroke();

  // Label Typography
  ctx.fillStyle = label.textColor || '#000000';
  ctx.textAlign = 'center';

  ctx.font = '600 10px "Geist Mono", monospace';
  ctx.fillText(`${label.catalogNumber || 'CAT-01'}  •  ${label.sideIndicator || 'SIDE A'}`, 0, -labelRadius * 0.65);

  ctx.font = '500 8.5px "Geist Mono", monospace';
  ctx.fillStyle = label.accentColor || label.textColor;
  ctx.fillText(label.rpmBadge || '33 ⅓ RPM', 0, -labelRadius * 0.52);

  ctx.fillStyle = label.textColor || '#000000';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  const cleanTitle = (label.title || 'UNTITLED').toUpperCase();
  ctx.fillText(cleanTitle.length > 22 ? cleanTitle.slice(0, 20) + '...' : cleanTitle, 0, -labelRadius * 0.28);

  ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(label.artist || 'UNKNOWN ARTIST', 0, -labelRadius * 0.16);

  const tracksToDisplay = (label.tracks || []).slice(0, 4);
  const startY = labelRadius * 0.26;
  ctx.font = '400 9px "Plus Jakarta Sans", sans-serif';

  tracksToDisplay.forEach((track, idx) => {
    const y = startY + idx * 13;
    const line = `${track.number || idx + 1}. ${track.title} [${track.duration || '3:00'}]`;
    ctx.fillText(line.length > 28 ? line.slice(0, 26) + '...' : line, 0, y);
  });

  ctx.font = '400 7px "Geist Mono", monospace';
  ctx.fillStyle = 'rgba(120, 120, 120, 0.85)';
  const copyright = label.copyrightNotice || 'ALL RIGHTS RESERVED';
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

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
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
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const center = 256;
  const radius = 250;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  ctx.save();
  ctx.translate(center, center);

  // Grooves bump rings
  const deadWax = radius * 0.46;
  const musicOuter = radius * 0.94;

  ctx.lineWidth = 1;
  for (let r = deadWax; r < musicOuter; r += 2.5) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = (r % 5 === 0) ? '#a0a0a0' : '#606060';
    ctx.stroke();
  }

  // Label indentation ring
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.335, 0, Math.PI * 2);
  ctx.strokeStyle = '#404040';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Creates high-res canvas texture for Outer Jacket Front
 */
export function createJacketFrontTexture(project: ProjectData): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const w = 1024;
  const h = 1024;

  ctx.fillStyle = project.jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, w, h);

  const accent = project.jacket.accentColor || '#f43f5e';

  // Spine edge fold shadow
  const spineFoldGrad = ctx.createLinearGradient(0, 0, 40, 0);
  spineFoldGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  spineFoldGrad.addColorStop(0.3, 'rgba(255,255,255,0.08)');
  spineFoldGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spineFoldGrad;
  ctx.fillRect(0, 0, 40, h);

  // Graphic accent
  ctx.fillStyle = accent;
  ctx.fillRect(70, 70, 14, 110);

  // Artist & Album
  ctx.font = '700 38px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText((project.jacket.artistName || 'ARTIST NAME').toUpperCase(), 105, 110);

  ctx.font = '300 64px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#f4f4f5';
  ctx.fillText((project.jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 105, 175);

  // Center feature
  if (project.jacket.centerCutoutHole) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 170, 0, Math.PI * 2);
    ctx.fillStyle = '#08080a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3f3f46';
    ctx.stroke();

    ctx.font = '500 20px "Geist Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('DIE-CUT APERTURE', w / 2, h / 2);
  } else {
    ctx.strokeStyle = `${accent}35`;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(w * 0.15, h * 0.28, w * 0.7, h * 0.44);

    ctx.fillStyle = `${accent}10`;
    ctx.fillRect(w * 0.15, h * 0.28, w * 0.7, h * 0.44);

    ctx.font = '600 24px "Geist Mono", monospace';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText(`${project.vinyl.size.toUpperCase()} AUDIOPHILE PRESSING`, w / 2, h / 2 - 15);

    ctx.font = '400 20px "Geist Mono", monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`${project.vinyl.weight} • ${project.vinyl.rpm.toUpperCase()} • STEREO MASTER`, w / 2, h / 2 + 25);
  }

  // Footer metadata
  ctx.font = '500 24px "Geist Mono", monospace';
  ctx.fillStyle = '#a1a1aa';
  ctx.textAlign = 'left';
  ctx.fillText(project.jacket.catalogNumber || 'CAT-001', 70, h - 70);

  // Obi Strip wrap if enabled
  if (project.obi.enabled) {
    const obiW = 180;
    const obiX = project.obi.position === 'left' ? 70 : w - obiW - 70;

    ctx.fillStyle = project.obi.backgroundColor || '#f43f5e';
    ctx.fillRect(obiX, 0, obiW, h);

    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 15;
    ctx.strokeRect(obiX, 0, obiW, h);
    ctx.shadowColor = 'transparent';

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

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates high-res canvas texture for Outer Jacket Back
 */
export function createJacketBackTexture(project: ProjectData): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const w = 1024;
  const h = 1024;

  ctx.fillStyle = project.jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, w, h);

  // Back header
  ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText((project.jacket.artistName || 'ARTIST NAME').toUpperCase(), 70, 95);

  ctx.font = '400 48px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = project.jacket.accentColor || '#f43f5e';
  ctx.fillText((project.jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 70, 150);

  // Tracklists in two columns
  const colY = 250;
  const col1X = 70;
  const col2X = w / 2 + 30;

  // Side A
  ctx.font = '700 24px "Geist Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SIDE A  [ 33 ⅓ RPM ]', col1X, colY);

  ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
  project.vinyl.sideALabel.tracks.forEach((track, i) => {
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

  project.vinyl.sideBLabel.tracks.forEach((track, i) => {
    const y = colY + 45 + i * 40;
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(track.number, col2X, y);
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(track.title, col2X + 45, y);
    ctx.fillStyle = '#71717a';
    ctx.fillText(track.duration, col2X + 330, y);
  });

  // Footer barcode
  const code = project.jacket.barcode || '7 93573 19482 0';
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

  // Copyright
  ctx.font = '400 15px "Geist Mono", monospace';
  ctx.fillStyle = '#71717a';
  ctx.textAlign = 'left';
  ctx.fillText(project.vinyl.sideALabel.copyrightNotice || '℗ & © 2026. ALL RIGHTS RESERVED.', 70, h - 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
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
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = project.jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, 64, 1024);

  ctx.save();
  ctx.translate(32, 512);
  ctx.rotate(-Math.PI / 2);

  ctx.font = '600 18px "Geist Mono", monospace';
  ctx.fillStyle = '#f4f4f5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = project.jacket.spineText || `${project.jacket.artistName} — ${project.jacket.albumTitle} — ${project.jacket.catalogNumber}`;
  ctx.fillText(text.toUpperCase(), 0, 0);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
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
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const center = 256;
  const radius = 245;

  if (mat === 'cork') {
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    // Cork flecks
    ctx.fillStyle = '#d97706';
    for (let i = 0; i < 400; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * radius;
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

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
