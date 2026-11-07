import { ProjectData, ActiveDiecutComponent } from '../types';
import { getComponentDimensions } from './diecutGenerator';

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

export interface RenderEditorOptions {
  canvas: HTMLCanvasElement;
  project: ProjectData;
  component: ActiveDiecutComponent;
  showBleed: boolean;
  showSafeZone: boolean;
  showDimensions: boolean;
  zoom: number; // 0.5 to 2.0
}

export function drawEditorCanvas({
  canvas,
  project,
  component,
  showBleed,
  showSafeZone,
  showDimensions,
  zoom = 1.0,
}: RenderEditorOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dims = getComponentDimensions(project, component);
  const totalW = dims.widthMm + dims.bleedMm * 2;
  const totalH = dims.heightMm + dims.bleedMm * 2;

  // Pixel scale factor (3 pixels per mm for sharp crisp canvas display)
  const scale = 2.4 * zoom;
  const canvasW = Math.round(totalW * scale);
  const canvasH = Math.round(totalH * scale);

  if (canvas.width !== canvasW || canvas.height !== canvasH) {
    canvas.width = canvasW;
    canvas.height = canvasH;
  }

  ctx.clearRect(0, 0, canvasW, canvasH);

  // Background workbench
  ctx.save();
  ctx.scale(scale, scale);

  // 1. Draw Bleed Area & Base Background
  const bleedOffset = dims.bleedMm;
  const trimW = dims.widthMm;
  const trimH = dims.heightMm;

  // Fill entire bleed area with background color or artwork
  ctx.fillStyle = project.jacket.bgColor || '#18181b';
  ctx.fillRect(0, 0, totalW, totalH);

  // 2. Render Component-Specific Artwork & Typography
  if (component === 'jacket_front') {
    renderJacketFront(ctx, bleedOffset, trimW, trimH, project);
  } else if (component === 'jacket_back') {
    renderJacketBack(ctx, bleedOffset, trimW, trimH, project);
  } else if (component === 'jacket_spread') {
    renderJacketSpread(ctx, bleedOffset, trimW, trimH, project, dims.spineMm);
  } else if (component === 'label_a' || component === 'label_b') {
    renderLabelFlat(ctx, bleedOffset, trimW, project, component === 'label_a' ? 'A' : 'B');
  } else if (component === 'obi_strip') {
    renderObiFlat(ctx, bleedOffset, trimW, trimH, project);
  } else if (component === 'inner_sleeve') {
    renderInnerSleeveFlat(ctx, bleedOffset, trimW, trimH, project);
  }

  // 3. Render Spine text if applicable
  if (dims.spineMm > 0 && component === 'jacket_spread') {
    renderSpineText(ctx, bleedOffset, trimW, trimH, project, dims.spineMm);
  }

  // 4. Overlays: Bleed, Trim, Safe Margin, Registration Marks
  drawTechnicalGuides(ctx, totalW, totalH, dims, showBleed, showSafeZone, showDimensions);

  ctx.restore();
}

function renderJacketFront(
  ctx: CanvasRenderingContext2D,
  offset: number,
  w: number,
  h: number,
  project: ProjectData
) {
  ctx.save();
  ctx.translate(offset, offset);

  // Decorative subtle grid or art placeholder if no custom image
  ctx.fillStyle = project.jacket.bgColor;
  ctx.fillRect(0, 0, w, h);

  if (project.jacket.frontArtwork) {
    const img = getOrLoadImage(project.jacket.frontArtwork);
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }

  // Modern minimal album artwork layout
  const accent = project.jacket.accentColor || '#f43f5e';

  // Graphic geometric accent band
  ctx.fillStyle = accent;
  ctx.fillRect(20, 20, 4, 35);

  // Artist Name
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText((project.jacket.artistName || 'ARTIST NAME').toUpperCase(), 30, 32);

  // Album Title
  ctx.font = '300 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#f4f4f5';
  ctx.fillText((project.jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 30, 52);

  // Center visual motif / abstract vinyl record aperture
  ctx.save();
  ctx.translate(w / 2, h / 2);

  if (project.jacket.centerCutoutHole) {
    // Disco bag die-cut circle
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#3f3f46';
    ctx.stroke();

    ctx.font = '500 7px "Geist Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('DIE-CUT CENTER APERTURE (100mm)', 0, 0);
  } else {
    // Modern architectural minimalist layout frame
    ctx.strokeStyle = `${accent}40`;
    ctx.lineWidth = 1;
    ctx.strokeRect(-w * 0.35, -h * 0.28, w * 0.7, h * 0.56);

    ctx.fillStyle = `${accent}15`;
    ctx.fillRect(-w * 0.35, -h * 0.28, w * 0.7, h * 0.56);

    ctx.font = '600 9px "Geist Mono", monospace';
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.fillText('12-INCH VINYL MASTER EDITION', 0, -10);

    ctx.font = '400 8px "Geist Mono", monospace';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(`PRESSING SPEC: ${project.vinyl.weight.toUpperCase()} • ${project.vinyl.rpm.toUpperCase()}`, 0, 10);
  }
  ctx.restore();

  // Bottom info strip: Catalog no & format
  ctx.font = '500 8px "Geist Mono", monospace';
  ctx.fillStyle = '#a1a1aa';
  ctx.textAlign = 'left';
  ctx.fillText(project.jacket.catalogNumber || 'CAT-001', 25, h - 22);

  if (project.jacket.parentalAdvisory) {
    renderParentalAdvisoryBadge(ctx, w - 50, h - 35, 36, 20);
  }

  ctx.restore();
}

function renderJacketBack(
  ctx: CanvasRenderingContext2D,
  offset: number,
  w: number,
  h: number,
  project: ProjectData
) {
  ctx.save();
  ctx.translate(offset, offset);

  ctx.fillStyle = project.jacket.bgColor;
  ctx.fillRect(0, 0, w, h);

  if (project.jacket.backArtwork) {
    const img = getOrLoadImage(project.jacket.backArtwork);
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }

  // Back header
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText((project.jacket.artistName || 'ARTIST NAME').toUpperCase(), 25, 35);

  ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = project.jacket.accentColor || '#f43f5e';
  ctx.fillText((project.jacket.albumTitle || 'ALBUM TITLE').toUpperCase(), 25, 54);

  // Two track columns: Side A and Side B
  const colY = 90;
  const col1X = 30;
  const col2X = w / 2 + 15;

  // Side A Tracks
  ctx.font = '700 9px "Geist Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SIDE A  [ 33 ⅓ RPM ]', col1X, colY);

  ctx.font = '400 8px "Plus Jakarta Sans", sans-serif';
  project.vinyl.sideALabel.tracks.forEach((track, i) => {
    const y = colY + 18 + i * 16;
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(track.number, col1X, y);
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(track.title, col1X + 16, y);
    ctx.fillStyle = '#71717a';
    ctx.fillText(track.duration, col1X + 105, y);
  });

  // Side B Tracks
  ctx.font = '700 9px "Geist Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SIDE B  [ 33 ⅓ RPM ]', col2X, colY);

  project.vinyl.sideBLabel.tracks.forEach((track, i) => {
    const y = colY + 18 + i * 16;
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText(track.number, col2X, y);
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText(track.title, col2X + 16, y);
    ctx.fillStyle = '#71717a';
    ctx.fillText(track.duration, col2X + 105, y);
  });

  // Barcode and Legal text at footer
  renderBarcode(ctx, w - 60, h - 45, 45, 25, project.jacket.barcode || '7 93573 19482 0');

  ctx.font = '400 6px "Geist Mono", monospace';
  ctx.fillStyle = '#71717a';
  ctx.textAlign = 'left';
  ctx.fillText(project.vinyl.sideALabel.copyrightNotice || '℗ & © 2026. ALL RIGHTS RESERVED.', 25, h - 25);
  ctx.fillText(`MANUFACTURED UNDER EXCLUSIVE LICENSE. UNAUTHORIZED DUPLICATION IS A VIOLATION OF APPLICABLE LAWS.`, 25, h - 16);

  ctx.restore();
}

function renderJacketSpread(
  ctx: CanvasRenderingContext2D,
  offset: number,
  w: number,
  h: number,
  project: ProjectData,
  spineWidth: number
) {
  const panelW = (w - spineWidth) / 2;

  // Left panel: Back cover
  ctx.save();
  ctx.translate(offset, offset);
  renderJacketBack(ctx, 0, panelW, h, project);
  ctx.restore();

  // Right panel: Front cover
  ctx.save();
  ctx.translate(offset + panelW + spineWidth, offset);
  renderJacketFront(ctx, 0, panelW, h, project);
  ctx.restore();
}

function renderSpineText(
  ctx: CanvasRenderingContext2D,
  offset: number,
  w: number,
  h: number,
  project: ProjectData,
  spineWidth: number
) {
  const spineCenterX = offset + (w - spineWidth) / 2 + spineWidth / 2;
  const spineCenterY = offset + h / 2;

  ctx.save();
  ctx.translate(spineCenterX, spineCenterY);
  ctx.rotate(-Math.PI / 2); // Vertical spine orientation

  ctx.font = '600 5.5px "Geist Mono", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(project.jacket.spineText || `${project.jacket.artistName} — ${project.jacket.albumTitle} — ${project.jacket.catalogNumber}`, 0, 0);

  ctx.restore();
}

function renderLabelFlat(
  ctx: CanvasRenderingContext2D,
  offset: number,
  w: number,
  project: ProjectData,
  side: 'A' | 'B'
) {
  const label = side === 'A' ? project.vinyl.sideALabel : project.vinyl.sideBLabel;
  const center = offset + w / 2;
  const radius = w / 2;

  ctx.save();
  ctx.translate(center, center);

  // Label background disc
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = label.backgroundColor || '#ffffff';
  ctx.fill();

  ctx.lineWidth = 1;
  ctx.strokeStyle = label.accentColor || '#000000';
  ctx.stroke();

  // Inner rings
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = `${label.accentColor || '#000'}33`;
  ctx.stroke();

  // Center hole punch guide
  const isDinked = project.vinyl.holeType === 'dinked_large' && project.vinyl.size === '7inch';
  const holeRadius = isDinked ? 19 : 3.6; // 38mm or 7.2mm
  ctx.beginPath();
  ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#09090b';
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.stroke();

  // Typography
  ctx.fillStyle = label.textColor || '#000000';
  ctx.textAlign = 'center';

  ctx.font = '600 5.5px "Geist Mono", monospace';
  ctx.fillText(`${label.catalogNumber}  •  ${label.sideIndicator}`, 0, -radius * 0.65);

  ctx.font = '700 8.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(label.title.toUpperCase(), 0, -radius * 0.35);

  ctx.font = '500 6.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(label.artist, 0, -radius * 0.2);

  // Tracks
  const startY = radius * 0.28;
  ctx.font = '400 5.5px "Plus Jakarta Sans", sans-serif';
  label.tracks.slice(0, 4).forEach((track, i) => {
    ctx.fillText(`${track.number}. ${track.title} (${track.duration})`, 0, startY + i * 9);
  });

  ctx.restore();
}

function renderObiFlat(
  ctx: CanvasRenderingContext2D,
  offset: number,
  w: number,
  h: number,
  project: ProjectData
) {
  ctx.save();
  ctx.translate(offset, offset);

  // Obi background
  ctx.fillStyle = project.obi.backgroundColor || '#f43f5e';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = project.obi.textColor || '#ffffff';
  ctx.textAlign = 'center';

  // Japanese title (vertical writing or bold horizontal)
  ctx.font = '700 11px sans-serif';
  ctx.fillText(project.obi.japaneseTitle || '邦題タイトル', w / 2, 45);

  ctx.font = '500 9px sans-serif';
  ctx.fillText(project.obi.katakanaArtist || 'アーティスト名', w / 2, 65);

  // Catchphrase box
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(6, 85, w - 12, 30);
  ctx.font = '600 7px sans-serif';
  ctx.fillText(project.obi.catchphrase || '完全限定生産盤', w / 2, 102);

  // Price & Specs at bottom
  ctx.font = '700 10px "Geist Mono", monospace';
  ctx.fillText(project.obi.priceJpy || '¥4,180 (税込)', w / 2, h - 45);

  ctx.font = '400 6px "Geist Mono", monospace';
  ctx.fillText(project.obi.releaseCode || 'JPC-8021', w / 2, h - 30);

  ctx.restore();
}

function renderInnerSleeveFlat(
  ctx: CanvasRenderingContext2D,
  offset: number,
  w: number,
  h: number,
  project: ProjectData
) {
  ctx.save();
  ctx.translate(offset, offset);

  ctx.fillStyle = project.innerSleeve.backgroundColor || '#111215';
  ctx.fillRect(0, 0, w, h);

  if (project.innerSleeve.hasDieCutHole) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#3f3f46';
    ctx.stroke();

    ctx.font = '500 7px "Geist Mono", monospace';
    ctx.fillStyle = '#71717a';
    ctx.textAlign = 'center';
    ctx.fillText('100mm DIE-CUT APERTURE', w / 2, h / 2);
  }

  ctx.restore();
}

function renderParentalAdvisoryBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = '700 4.5px sans-serif';
  ctx.fillText('PARENTAL', x + w / 2, y + 6);
  ctx.font = '800 6.5px sans-serif';
  ctx.fillText('ADVISORY', x + w / 2, y + 13);
  ctx.font = '700 3.5px sans-serif';
  ctx.fillText('EXPLICIT CONTENT', x + w / 2, y + 17.5);
  ctx.restore();
}

function renderBarcode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  code: string
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = '#000000';
  // Procedural barcode bars
  const barCount = 30;
  const barW = (w - 8) / barCount;
  for (let i = 0; i < barCount; i++) {
    if ((i * 7 + 3) % 4 !== 0) {
      ctx.fillRect(x + 4 + i * barW, y + 3, barW * 0.7, h - 9);
    }
  }

  ctx.font = '500 4px "Geist Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(code, x + w / 2, y + h - 2);

  ctx.restore();
}

function drawTechnicalGuides(
  ctx: CanvasRenderingContext2D,
  totalW: number,
  totalH: number,
  dims: { widthMm: number; heightMm: number; bleedMm: number; safeMarginMm: number; spineMm: number },
  showBleed: boolean,
  showSafeZone: boolean,
  showDimensions: boolean
) {
  ctx.save();

  // Bleed Box (Magenta/Red line)
  if (showBleed) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0.5, 0.5, totalW - 1, totalH - 1);
  }

  // Trim Line (Cyan line)
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 0.6;
  ctx.strokeRect(dims.bleedMm, dims.bleedMm, dims.widthMm, dims.heightMm);

  // Safe Margin (Dashed Yellow/Gray line)
  if (showSafeZone) {
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
    ctx.lineWidth = 0.4;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(
      dims.bleedMm + dims.safeMarginMm,
      dims.bleedMm + dims.safeMarginMm,
      dims.widthMm - dims.safeMarginMm * 2,
      dims.heightMm - dims.safeMarginMm * 2
    );
    ctx.setLineDash([]);
  }

  // Dimension Markers
  if (showDimensions) {
    ctx.font = '500 5px "Geist Mono", monospace';
    ctx.fillStyle = '#06b6d4';
    ctx.textAlign = 'center';
    ctx.fillText(`${dims.widthMm} mm`, totalW / 2, dims.bleedMm - 2);
  }

  ctx.restore();
}
