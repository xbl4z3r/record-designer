import { VinylConfig, CenterLabelConfig } from '../types';
import { renderPhotorealisticSplatter } from './splatterGenerator';

const imageCache = new Map<string, HTMLImageElement>();

function getOrLoadImage(src: string, onLoaded?: () => void): HTMLImageElement {
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    imageCache.set(src, img);
    if (onLoaded) {
      img.onload = () => onLoaded();
    }
  }
  return img;
}

export interface RenderVinylOptions {
  canvas: HTMLCanvasElement;
  vinyl: VinylConfig;
  side: 'A' | 'B';
  rotationRad: number;
  lightAngleRad?: number;
  showSheen?: boolean;
}

export function drawVinylRecord({
  canvas,
  vinyl,
  side,
  rotationRad,
  lightAngleRad = Math.PI / 4,
  showSheen = true,
}: RenderVinylOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const center = width / 2;
  const radius = center - 8;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotationRad);

  // 1. Draw Vinyl Base Disc
  drawVinylBaseDisc(ctx, radius, vinyl);

  // 2. Draw Recorded Music Tracks & Grooves
  drawGrooves(ctx, radius, vinyl);

  // 3. Draw Dead Wax / Runout Groove Area & Matrix Etching
  drawDeadWaxAndMatrix(ctx, radius, vinyl, side);

  // 4. Draw Center Label
  const labelConfig = side === 'A' ? vinyl.sideALabel : vinyl.sideBLabel;
  drawCenterLabel(ctx, radius, labelConfig, vinyl);

  // 5. Draw Spindle Center Hole
  drawCenterHole(ctx, radius, vinyl);

  ctx.restore();

  // 6. Draw Anisotropic Specular Light Sheen (fixed to light source direction)
  if (showSheen) {
    drawAnisotropicSheen(ctx, center, radius, lightAngleRad, vinyl);
  }
}

function drawVinylBaseDisc(ctx: CanvasRenderingContext2D, radius: number, vinyl: VinylConfig) {
  ctx.save();

  // Outer drop rim shadow
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();

  const primaryColor = vinyl.baseColor || vinyl.primaryColor || '#121214';
  const secondaryColor = vinyl.secondaryColor || '#27272a';
  const splatterColor = vinyl.splatterColor1 || vinyl.splatterColor || '#ffffff';

  if (vinyl.colorStyle === 'standard_black' || primaryColor === '#121214') {
    const grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, '#101114');
    grad.addColorStop(0.7, '#16171c');
    grad.addColorStop(1, '#0c0d0f');
    ctx.fillStyle = grad;
    ctx.fill();
  } else if (vinyl.colorStyle === 'solid') {
    ctx.fillStyle = primaryColor;
    ctx.fill();
  } else if (vinyl.colorStyle === 'transparent') {
    ctx.globalAlpha = Math.max(0.2, (vinyl.transparency || 0.8) * 0.7);
    ctx.fillStyle = primaryColor;
    ctx.fill();
    ctx.globalAlpha = 1.0;
  } else if (vinyl.colorStyle === 'half_and_half') {
    // Left half
    ctx.beginPath();
    ctx.arc(0, 0, radius, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = primaryColor;
    ctx.fill();

    // Right half
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.fillStyle = secondaryColor;
    ctx.fill();
  } else if (vinyl.colorStyle === 'color_in_color') {
    // Outer color
    ctx.fillStyle = primaryColor;
    ctx.fill();

    // Inner center blob
    const innerRadius = radius * 0.65;
    const centerGrad = ctx.createRadialGradient(0, 0, innerRadius * 0.3, 0, 0, innerRadius);
    centerGrad.addColorStop(0, secondaryColor);
    centerGrad.addColorStop(0.85, secondaryColor);
    centerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fill();
  } else if (vinyl.colorStyle === 'marble') {
    // Base color
    ctx.fillStyle = primaryColor;
    ctx.fill();

    // Swirl pattern
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = secondaryColor;
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
  } else if (vinyl.colorStyle === 'tri_color_split') {
    const colors = [primaryColor, secondaryColor, splatterColor];
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
  } else if (vinyl.colorStyle === 'glow_in_the_dark') {
    const glowColor = vinyl.glowColor || '#22c55e';
    const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    glowGrad.addColorStop(0, '#f0fdf4');
    glowGrad.addColorStop(0.5, glowColor);
    glowGrad.addColorStop(0.9, '#15803d');
    glowGrad.addColorStop(1, '#052e16');
    ctx.fillStyle = glowGrad;
    ctx.fill();
  } else if (vinyl.colorStyle === 'liquid_glitter') {
    ctx.fillStyle = primaryColor;
    ctx.fill();

    ctx.save();
    ctx.clip();
    for (let i = 0; i < 150; i++) {
      const angle = (i * 123.7 * Math.PI) / 180;
      const dist = radius * 0.34 + (radius * 0.6 * ((i * 47) % 100)) / 100;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(253,224,71,0.65)';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  } else if (vinyl.colorStyle === 'splatter' || vinyl.finishEffect === 'splatter') {
    ctx.fillStyle = primaryColor;
    ctx.fill();
    renderPhotorealisticSplatter(ctx, radius, vinyl);
  } else if (vinyl.colorStyle === 'picture_disc') {
    // Default disc background
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.save();
    ctx.clip();
    if (vinyl.pictureDiscImage) {
      const img = getOrLoadImage(vinyl.pictureDiscImage);
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
      } else {
        const picGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        picGrad.addColorStop(0, primaryColor);
        picGrad.addColorStop(0.5, secondaryColor);
        picGrad.addColorStop(1, splatterColor);
        ctx.fillStyle = picGrad;
        ctx.fill();
      }
    } else {
      // Default kinetic design if no image uploaded
      const picGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
      picGrad.addColorStop(0, primaryColor);
      picGrad.addColorStop(0.5, secondaryColor);
      picGrad.addColorStop(1, splatterColor);
      ctx.fillStyle = picGrad;
      ctx.fill();

      // Circular kinetic graphic rings for picture disc
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 3;
      for (let r = radius * 0.38; r < radius * 0.9; r += radius * 0.1) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Polished outer rim bevel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawGrooves(ctx: CanvasRenderingContext2D, radius: number, vinyl: VinylConfig) {
  ctx.save();

  const deadWaxOuterRadius = radius * 0.46;
  const musicOuterRadius = radius * 0.94;

  const totalMusicWidth = musicOuterRadius - deadWaxOuterRadius;
  const bands = Math.max(1, vinyl.trackBandsCount || 4);
  const bandWidth = totalMusicWidth / bands;

  // Concentric fine micro-grooves
  ctx.lineWidth = 0.5;
  for (let b = 0; b < bands; b++) {
    const bandStart = deadWaxOuterRadius + b * bandWidth;
    const bandEnd = bandStart + bandWidth;

    // Draw micro grooves inside this song track
    const lineCount = 18;
    for (let i = 1; i < lineCount; i++) {
      const r = bandStart + (bandWidth * i) / lineCount;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = (i % 3 === 0) ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.22)';
      ctx.stroke();
    }

    // Inter-track silent gap band (the darker gap between songs)
    if (b < bands - 1) {
      ctx.beginPath();
      ctx.arc(0, 0, bandEnd, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.lineWidth = 0.5;
    }
  }

  // Lead-in groove at outer edge
  ctx.beginPath();
  ctx.arc(0, 0, musicOuterRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

function drawDeadWaxAndMatrix(
  ctx: CanvasRenderingContext2D,
  radius: number,
  vinyl: VinylConfig,
  side: 'A' | 'B'
) {
  ctx.save();

  const labelRadius = radius * 0.34;
  const deadWaxRadius = radius * 0.46;

  // Runout groove spiral line
  ctx.beginPath();
  ctx.arc(0, 0, (labelRadius + deadWaxRadius) / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 0.75;
  ctx.stroke();

  // Matrix text stamped into dead wax
  const matrixText = side === 'A' ? (vinyl.matrixTextSideA || 'SIDE A') : (vinyl.matrixTextSideB || 'SIDE B');
  const textRadius = (labelRadius + deadWaxRadius) / 2 + 8;
  const matrixFontSize = Math.max(10, Math.round(radius * 0.022));

  ctx.font = `500 ${matrixFontSize}px "Geist Mono", monospace`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Curve matrix text along the runout groove
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

  ctx.restore();
}

function drawCenterLabel(
  ctx: CanvasRenderingContext2D,
  radius: number,
  label: CenterLabelConfig,
  _vinyl: VinylConfig
) {
  ctx.save();

  const labelRadius = radius * 0.335;

  // Label paper circle with subtle shadow
  ctx.beginPath();
  ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = label.backgroundColor || '#ffffff';
  ctx.fill();

  if (label.artworkImage) {
    const img = getOrLoadImage(label.artworkImage);
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, -labelRadius, -labelRadius, labelRadius * 2, labelRadius * 2);
      ctx.restore();
    }
  }

  // Border ring indent
  ctx.lineWidth = Math.max(1.5, Math.round(labelRadius * 0.015));
  ctx.strokeStyle = label.accentColor || 'rgba(0,0,0,0.15)';
  ctx.stroke();

  // Inner aesthetic ring
  ctx.beginPath();
  ctx.arc(0, 0, labelRadius * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = label.accentColor ? `${label.accentColor}33` : 'rgba(0,0,0,0.08)';
  ctx.lineWidth = Math.max(1, Math.round(labelRadius * 0.008));
  ctx.stroke();

  // Scaled High-Res Typography
  ctx.fillStyle = label.textColor || '#000000';
  ctx.textAlign = 'center';

  const catFont = Math.max(8, Math.round(labelRadius * 0.075));
  const rpmFont = Math.max(7, Math.round(labelRadius * 0.06));
  const titleFont = Math.max(10, Math.round(labelRadius * 0.105));
  const artistFont = Math.max(8, Math.round(labelRadius * 0.08));
  const trackFont = Math.max(7, Math.round(labelRadius * 0.068));
  const trackGap = Math.max(11, Math.round(labelRadius * 0.105));
  const copyFont = Math.max(6, Math.round(labelRadius * 0.048));

  // Catalog No. / Side indicator at top
  ctx.font = `600 ${catFont}px "Geist Mono", monospace`;
  ctx.fillText(`${label.catalogNumber || 'CAT-01'}  •  ${label.sideIndicator || 'SIDE A'}`, 0, -labelRadius * 0.65);

  // RPM badge
  ctx.font = `500 ${rpmFont}px "Geist Mono", monospace`;
  ctx.fillStyle = label.accentColor || label.textColor;
  ctx.fillText(label.rpmBadge || '33 ⅓ RPM', 0, -labelRadius * 0.52);

  // Title
  ctx.fillStyle = label.textColor || '#000000';
  ctx.font = `700 ${titleFont}px "Plus Jakarta Sans", sans-serif`;
  const cleanTitle = (label.title || 'UNTITLED').toUpperCase();
  ctx.fillText(cleanTitle.length > 22 ? cleanTitle.slice(0, 20) + '...' : cleanTitle, 0, -labelRadius * 0.28);

  // Artist
  ctx.font = `500 ${artistFont}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(label.artist || 'UNKNOWN ARTIST', 0, -labelRadius * 0.16);

  // Track listing under spindle hole
  const tracksToDisplay = (label.tracks || []).slice(0, 4);
  const startY = labelRadius * 0.27;
  ctx.textAlign = 'center';
  ctx.font = `400 ${trackFont}px "Plus Jakarta Sans", sans-serif`;

  tracksToDisplay.forEach((track, idx) => {
    const y = startY + idx * trackGap;
    const line = `${track.number || idx + 1}. ${track.title} [${track.duration || '3:00'}]`;
    ctx.fillText(line.length > 28 ? line.slice(0, 26) + '...' : line, 0, y);
  });

  // Copyright text at bottom
  ctx.font = `400 ${copyFont}px "Geist Mono", monospace`;
  ctx.fillStyle = 'rgba(120, 120, 120, 0.85)';
  const copyright = label.copyrightNotice || 'ALL RIGHTS RESERVED';
  ctx.fillText(copyright.length > 36 ? copyright.slice(0, 34) + '...' : copyright, 0, labelRadius * 0.8);

  ctx.restore();
}

function drawCenterHole(ctx: CanvasRenderingContext2D, radius: number, vinyl: VinylConfig) {
  ctx.save();

  const isDinked = vinyl.holeType === 'dinked_large' && vinyl.size === '7inch';
  const holeRadius = isDinked ? radius * 0.12 : radius * 0.035;

  ctx.beginPath();
  ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#09090b'; // Hole cutout into dark background
  ctx.fill();

  // Spindle hole edge bevel
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.stroke();

  ctx.restore();
}

function drawAnisotropicSheen(
  ctx: CanvasRenderingContext2D,
  center: number,
  radius: number,
  lightAngleRad: number,
  vinyl: VinylConfig
) {
  ctx.save();
  ctx.translate(center, center);

  const innerRadius = radius * 0.34;
  const outerRadius = radius * 0.94;

  // Two opposed fan-shaped specular reflections
  const fanHalfAngle = 0.32;
  const angles = [lightAngleRad, lightAngleRad + Math.PI];

  angles.forEach(angle => {
    ctx.save();
    ctx.rotate(angle);

    const grad = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
    const intensity = vinyl.colorStyle === 'standard_black' ? 0.18 : 0.12;
    grad.addColorStop(0, `rgba(255, 255, 255, 0.0)`);
    grad.addColorStop(0.5, `rgba(255, 255, 255, ${intensity})`);
    grad.addColorStop(1, `rgba(255, 255, 255, 0.0)`);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, outerRadius, -fanHalfAngle, fanHalfAngle);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  });

  ctx.restore();
}
