import { describe, it, expect } from 'vitest';
import { PRESET_PROJECTS } from '../presets';

describe('Built-in Vinyl & Packaging Presets', () => {
  it('contains at least 5 production presets', () => {
    const keys = Object.keys(PRESET_PROJECTS);
    expect(keys.length).toBeGreaterThanOrEqual(5);
  });

  it('validates each preset has required vinyl audio specs', () => {
    Object.entries(PRESET_PROJECTS).forEach(([key, preset]) => {
      expect(preset.vinyl.size, `${key} size`).toMatch(/^(12inch|10inch|7inch)$/);
      expect(preset.vinyl.rpm, `${key} rpm`).toMatch(/^(33rpm|45rpm)$/);
      expect(preset.vinyl.weight, `${key} weight`).toMatch(/^(140g|180g)$/);
      expect(preset.vinyl.sideALabel.tracks.length, `${key} side A tracks`).toBeGreaterThanOrEqual(1);
      expect(preset.vinyl.sideBLabel.tracks.length, `${key} side B tracks`).toBeGreaterThanOrEqual(1);
    });
  });

  it('validates city pop preset has enabled Obi strip configuration', () => {
    const cityPop = PRESET_PROJECTS.city_pop_obi;
    expect(cityPop.obi.enabled).toBe(true);
    expect(cityPop.obi.japaneseTitle).toBeTruthy();
    expect(cityPop.obi.priceJpy).toContain('¥');
  });

  it('validates 7-inch soul single has dinked large center hole', () => {
    const single7 = PRESET_PROJECTS.vintage_soul_single_7;
    expect(single7.vinyl.size).toBe('7inch');
    expect(single7.vinyl.holeType).toBe('dinked_large');
    expect(single7.vinyl.rpm).toBe('45rpm');
  });
});
