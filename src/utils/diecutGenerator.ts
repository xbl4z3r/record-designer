import { ProjectData, ActiveDiecutComponent } from '../types';

export interface DiecutDimensions {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  spineMm: number;
}

export function getComponentDimensions(project: ProjectData, component: ActiveDiecutComponent): DiecutDimensions {
  const isGatefold = project.jacket.type === 'gatefold';
  const size = project.vinyl.size;

  const baseJacketSize = size === '12inch' ? 313 : size === '10inch' ? 260 : 185;
  const spine = isGatefold ? 5.5 : project.jacket.spineWidthMm || 3.0;

  switch (component) {
    case 'jacket_front':
    case 'jacket_back':
      return {
        widthMm: baseJacketSize,
        heightMm: baseJacketSize,
        bleedMm: 3,
        safeMarginMm: 4,
        spineMm: spine,
      };
    case 'jacket_spread':
      return {
        widthMm: baseJacketSize * 2 + spine,
        heightMm: baseJacketSize,
        bleedMm: 3,
        safeMarginMm: 4,
        spineMm: spine,
      };
    case 'label_a':
    case 'label_b':
      return {
        widthMm: project.vinyl.sideALabel.diameterMm || 100,
        heightMm: project.vinyl.sideALabel.diameterMm || 100,
        bleedMm: 2,
        safeMarginMm: 3,
        spineMm: 0,
      };
    case 'inner_sleeve':
      return {
        widthMm: baseJacketSize - 4,
        heightMm: baseJacketSize - 4,
        bleedMm: 3,
        safeMarginMm: 4,
        spineMm: 0,
      };
    case 'obi_strip':
      return {
        widthMm: project.obi.widthMm || 50,
        heightMm: baseJacketSize,
        bleedMm: 3,
        safeMarginMm: 3,
        spineMm: 0,
      };
    default:
      return { widthMm: 313, heightMm: 313, bleedMm: 3, safeMarginMm: 4, spineMm: 3 };
  }
}

/**
 * Generate full print-ready SVG template with die-lines, bleed, registration marks, and dimensions
 */
export function generatePrintReadySvg(project: ProjectData, component: ActiveDiecutComponent): string {
  const dims = getComponentDimensions(project, component);
  const totalW = dims.widthMm + dims.bleedMm * 2;
  const totalH = dims.heightMm + dims.bleedMm * 2;

  // Header spec info
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const componentTitle = component.replace(/_/g, ' ').toUpperCase();

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}mm" height="${totalH}mm">
  <defs>
    <style>
      .reg-mark { stroke: #000000; stroke-width: 0.25; fill: none; }
      .bleed-box { stroke: #e11d48; stroke-width: 0.35; fill: none; }
      .cut-line { stroke: #0284c7; stroke-width: 0.35; fill: none; }
      .crease-line { stroke: #10b981; stroke-width: 0.35; stroke-dasharray: 2, 2; fill: none; }
      .safe-zone { stroke: #6b7280; stroke-width: 0.2; stroke-dasharray: 1, 1; fill: none; }
      .spec-text { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 2.2px; fill: #4b5563; }
      .title-text { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 3.5px; font-weight: bold; fill: #111827; }
    </style>
  </defs>

  <!-- Technical Spec Header -->
  <g id="spec-header" transform="translate(${dims.bleedMm}, 2.5)">
    <text class="title-text" x="0" y="0">VINYL PRESSING DIE-CUT TEMPLATE — ${componentTitle}</text>
    <text class="spec-text" x="0" y="3.2">CAT: ${project.jacket.catalogNumber || 'N/A'} | ARTIST: ${project.jacket.artistName} | ALBUM: ${project.jacket.albumTitle} | ${dateStr}</text>
  </g>

  <!-- Background / Artwork Canvas -->
  <rect x="${dims.bleedMm}" y="${dims.bleedMm}" width="${dims.widthMm}" height="${dims.heightMm}" fill="${project.jacket.bgColor || '#18181b'}" />

  <!-- Bleed Boundary (RED) -->
  <rect class="bleed-box" x="0.5" y="0.5" width="${totalW - 1}" height="${totalH - 1}" />

  <!-- Cut / Trim Boundary (CYAN) -->
  <rect class="cut-line" x="${dims.bleedMm}" y="${dims.bleedMm}" width="${dims.widthMm}" height="${dims.heightMm}" />

  <!-- Safe Margin (GREY DASHED) -->
  <rect class="safe-zone" x="${dims.bleedMm + dims.safeMarginMm}" y="${dims.bleedMm + dims.safeMarginMm}" width="${dims.widthMm - dims.safeMarginMm * 2}" height="${dims.heightMm - dims.safeMarginMm * 2}" />

  ${dims.spineMm > 0 ? `
  <!-- Spine Crease Guides -->
  <line class="crease-line" x1="${dims.bleedMm + dims.widthMm / 2 - dims.spineMm / 2}" y1="${dims.bleedMm}" x2="${dims.bleedMm + dims.widthMm / 2 - dims.spineMm / 2}" y2="${dims.bleedMm + dims.heightMm}" />
  <line class="crease-line" x1="${dims.bleedMm + dims.widthMm / 2 + dims.spineMm / 2}" y1="${dims.bleedMm}" x2="${dims.bleedMm + dims.widthMm / 2 + dims.spineMm / 2}" y2="${dims.bleedMm + dims.heightMm}" />
  ` : ''}

  <!-- Registration Marks -->
  <g id="registration-marks">
    ${renderRegCrosshair(dims.bleedMm, dims.bleedMm)}
    ${renderRegCrosshair(dims.bleedMm + dims.widthMm, dims.bleedMm)}
    ${renderRegCrosshair(dims.bleedMm, dims.bleedMm + dims.heightMm)}
    ${renderRegCrosshair(dims.bleedMm + dims.widthMm, dims.bleedMm + dims.heightMm)}
  </g>

  <!-- CMYK Color Control Bars -->
  <g id="color-bars" transform="translate(${dims.bleedMm}, ${totalH - 2})">
    <rect x="0" y="0" width="4" height="1.5" fill="#00FFFF" />
    <rect x="4.5" y="0" width="4" height="1.5" fill="#FF00FF" />
    <rect x="9.0" y="0" width="4" height="1.5" fill="#FFFF00" />
    <rect x="13.5" y="0" width="4" height="1.5" fill="#000000" />
    <rect x="18.0" y="0" width="4" height="1.5" fill="#808080" />
  </g>
</svg>`;

  return svg;
}

function renderRegCrosshair(x: number, y: number): string {
  const r = 2;
  return `
    <circle cx="${x}" cy="${y}" r="${r}" class="reg-mark" />
    <line x1="${x - r - 1}" y1="${y}" x2="${x + r + 1}" y2="${y}" class="reg-mark" />
    <line x1="${x}" y1="${y - r - 1}" x2="${x}" y2="${y + r + 1}" class="reg-mark" />
  `;
}
