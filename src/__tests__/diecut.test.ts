import { describe, it, expect } from 'vitest';
import { getComponentDimensions, generatePrintReadySvg } from '../utils/diecutGenerator';
import { DEFAULT_PROJECT, PRESET_PROJECTS } from '../presets';

describe('Die-Cut Template Calculations', () => {
  it('calculates 12-inch single pocket jacket dimensions correctly', () => {
    const dims = getComponentDimensions(DEFAULT_PROJECT, 'jacket_front');
    expect(dims.widthMm).toBe(313);
    expect(dims.heightMm).toBe(313);
    expect(dims.bleedMm).toBe(3);
    expect(dims.safeMarginMm).toBe(4);
    expect(dims.spineMm).toBe(3.5);
  });

  it('calculates 7-inch single dimensions correctly', () => {
    const project7 = PRESET_PROJECTS.vintage_soul_single_7;
    const dims = getComponentDimensions(project7, 'jacket_front');
    expect(dims.widthMm).toBe(185);
    expect(dims.heightMm).toBe(185);
  });

  it('calculates gatefold jacket spread dimensions with wider spine', () => {
    const gatefoldProject = PRESET_PROJECTS.indie_splatter_gatefold;
    const dims = getComponentDimensions(gatefoldProject, 'jacket_spread');
    // Gatefold spread = front + back + 5.5mm spine
    expect(dims.spineMm).toBe(5.5);
    expect(dims.widthMm).toBe(313 * 2 + 5.5);
  });

  it('calculates center label die-cut dimensions', () => {
    const dimsA = getComponentDimensions(DEFAULT_PROJECT, 'label_a');
    expect(dimsA.widthMm).toBe(100);
    expect(dimsA.heightMm).toBe(100);
    expect(dimsA.bleedMm).toBe(2);
  });

  it('generates a valid print-ready SVG with registration marks and bleed', () => {
    const svg = generatePrintReadySvg(DEFAULT_PROJECT, 'jacket_front');
    expect(svg).toContain('<svg');
    expect(svg).toContain('class="bleed-box"');
    expect(svg).toContain('class="cut-line"');
    expect(svg).toContain('class="safe-zone"');
    expect(svg).toContain('id="registration-marks"');
    expect(svg).toContain('id="color-bars"');
  });
});
