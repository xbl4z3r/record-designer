import { describe, it, expect } from 'vitest';
import { getComponentDimensions } from '../utils/diecutGenerator';
import { DEFAULT_PROJECT, PRESET_PROJECTS } from '../presets';

describe('Anti-Static Inner Sleeve & Vinyl Variations', () => {
  it('validates inner sleeve die-cut template dimensions', () => {
    const dims = getComponentDimensions(DEFAULT_PROJECT, 'inner_sleeve');
    expect(dims.widthMm).toBe(309);
    expect(dims.heightMm).toBe(309);
    expect(dims.bleedMm).toBe(3);
    expect(dims.safeMarginMm).toBe(4);
  });

  it('validates anti-static rice paper preset configuration', () => {
    const bauhaus = PRESET_PROJECTS.bauhaus_audiophile;
    expect(bauhaus.innerSleeve.type).toBe('anti_static_rice_paper');
    expect(bauhaus.innerSleeve.hasDieCutHole).toBe(true);
    expect(bauhaus.innerSleeve.translucency).toBeGreaterThan(0.5);
    expect(bauhaus.innerSleeve.archivalPrintText).toContain('ANTI-STATIC');
  });

  it('validates multi-style vinyl types and effects', () => {
    const cityPop = PRESET_PROJECTS.city_pop_obi;
    expect(cityPop.vinyl.colorStyle).toBe('color_in_color');

    const acidTechno = PRESET_PROJECTS.acid_techno_picture;
    expect(acidTechno.vinyl.colorStyle).toBe('picture_disc');

    const nebula = PRESET_PROJECTS.indie_splatter_gatefold;
    expect(nebula.vinyl.colorStyle).toBe('splatter');
    expect(nebula.vinyl.splatterColor).toBeTruthy();
  });
});
