/**
 * Photorealistic IRL Vinyl Finishing Simulation Engine
 *
 * Implements the physical mechanics of 100-ton hydraulic steam-press biscuit compression:
 * 1. Centrifugal Radial Flow: Molten plastic is forced radially outward from center to rim.
 * 2. Pellet Shear Elongation: Solid accent chips stretch into long, non-repeating dendritic lightning flares.
 * 3. Jagged Fracturing: High-viscosity chip boundaries fracture into feathered whiskers and needle points.
 * 4. Micro-Spatter Droplets: Satellite flecks thrown forward along centrifugal velocity vectors.
 * 5. Multi-Tone Color Bleed: 1-Tone, 2-Tone, and 3-Tone pellet interactions with natural opacity gradients.
 */

// Simple seeded pseudo-random number generator for reproducible, non-repeating organic shapes
function createSeededRandom(seed: number) {
  let s = Math.sin(seed) * 10000;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Draws ultra-realistic, non-repeating vinyl splatter pressing
 */
export function renderPhotorealisticSplatter(
  ctx: CanvasRenderingContext2D,
  radius: number,
  vinyl: any
) {
  const toneCount =
    vinyl.splatterToneCount ||
    (vinyl.splatterColor3 ? 3 : vinyl.splatterColor2 ? 2 : 1);

  const c1 = vinyl.splatterColor1 || vinyl.splatterColor || '#ec4899';
  const c2 = vinyl.splatterColor2 || '#6366f1';
  const c3 = vinyl.splatterColor3 || '#38bdf8';
  const colors: string[] =
    toneCount >= 3 ? [c1, c2, c3] : toneCount === 2 ? [c1, c2] : [c1];

  const density = Math.min(100, Math.max(10, vinyl.splatterDensity || 48));
  const spread = Math.min(2.5, Math.max(0.4, vinyl.splatterSpread || 1.15));

  ctx.save();
  ctx.clip(); // Constrain strictly within disc outer boundary

  const deadWaxRadius = radius * 0.46;
  const outerRim = radius * 0.95;

  // Use fixed or variable seed based on vinyl colors and track count
  const seedBase =
    (c1.charCodeAt(1) || 99) * 17 +
    (c2.charCodeAt(1) || 53) * 31 +
    (density * 7) +
    (toneCount * 101);
  const rand = createSeededRandom(seedBase);

  // Total pellet count based on density
  const totalPellets = Math.floor(density * 0.65) + 12;

  // Track colors individually so each pellet is a distinct piece of plastic
  for (let p = 0; p < totalPellets; p++) {
    const color = colors[p % colors.length];

    // 1. Initial Pellet Landing Position on the Biscuit
    const baseAngle = rand() * Math.PI * 2;
    // Pellets land between dead-wax and middle track area
    const startRadius =
      deadWaxRadius + 8 + rand() * (radius * 0.44);

    const pelletX = Math.cos(baseAngle) * startRadius;
    const pelletY = Math.sin(baseAngle) * startRadius;

    // Classification of pellet behavior (real vinyl press distribution):
    // - 25% major lightning runners (stretch far across the record)
    // - 50% medium dendritic flares (classic starburst splatter)
    // - 25% small impact shards & droplet clusters
    const pelletType = rand();
    const isMajorRunner = pelletType < 0.25;
    const isMinorShard = pelletType > 0.75;

    // Centrifugal outward vector (pointing away from spindle center)
    const outAngle = Math.atan2(pelletY, pelletX);

    // Number of dendritic streaks from this pellet
    const rayCount = isMinorShard
      ? 1 + Math.floor(rand() * 2)
      : isMajorRunner
      ? 4 + Math.floor(rand() * 4)
      : 2 + Math.floor(rand() * 3);

    for (let r = 0; r < rayCount; r++) {
      // Angular spread of ray relative to centrifugal radial line
      const angleJitter = (rand() - 0.5) * 0.25 + (r - (rayCount - 1) / 2) * 0.08;
      const rayAngle = outAngle + angleJitter;

      // Available distance to outer rim
      const maxDist = outerRim - startRadius;
      let streakLength: number;

      if (isMajorRunner && r === 0) {
        // Main runner streaks 60% to 92% of the way to the rim
        streakLength = Math.min(maxDist, (maxDist * (0.6 + rand() * 0.35)) * spread);
      } else if (isMinorShard) {
        // Small shard: 25px to 80px
        streakLength = Math.min(maxDist, (30 + rand() * 55) * spread * (radius / 600));
      } else {
        // Medium flare: 70px to 220px
        streakLength = Math.min(maxDist, (60 + rand() * 160) * spread * (radius / 600));
      }

      // Root width of the molten streak (proportional to length)
      const rootWidth = (isMajorRunner ? 6 + rand() * 6 : 3.5 + rand() * 4) * spread * (radius / 600);

      // Construct non-repeating jagged dendritic streak polygon
      const steps = Math.max(4, Math.floor(streakLength / (18 * (radius / 600))));
      const leftPoints: { x: number; y: number }[] = [];
      const rightPoints: { x: number; y: number }[] = [];

      for (let s = 0; s <= steps; s++) {
        const frac = s / steps;
        // Non-linear taper: wide at root, narrows with sudden jagged flares, finishes at sharp point
        const taper = Math.pow(1 - frac, 1.4);
        // Jagged fractal edge noise
        const noiseL = 1 + (rand() - 0.5) * 0.45;
        const noiseR = 1 + (rand() - 0.5) * 0.45;

        const currentW = rootWidth * taper;
        const currentDist = frac * streakLength;

        // Swirl curve along groove direction
        const swirlOffset = Math.sin(frac * Math.PI) * (streakLength * 0.04) * (p % 2 === 0 ? 1 : -1);

        const cx = pelletX + Math.cos(rayAngle) * currentDist - Math.sin(rayAngle) * swirlOffset;
        const cy = pelletY + Math.sin(rayAngle) * currentDist + Math.cos(rayAngle) * swirlOffset;

        const perpA = rayAngle + Math.PI / 2;
        leftPoints.push({
          x: cx + Math.cos(perpA) * (currentW * 0.5 * noiseL),
          y: cy + Math.sin(perpA) * (currentW * 0.5 * noiseL),
        });
        rightPoints.push({
          x: cx - Math.cos(perpA) * (currentW * 0.5 * noiseR),
          y: cy - Math.sin(perpA) * (currentW * 0.5 * noiseR),
        });
      }

      // Draw the organic jagged streak
      ctx.beginPath();
      ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
      for (let i = 1; i < leftPoints.length; i++) {
        ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
      }
      for (let i = rightPoints.length - 1; i >= 0; i--) {
        ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Sharp filament whiskers branching off the streak edges (tapered needle spikes)
      if (!isMinorShard && streakLength > 60) {
        const whiskerCount = 2 + Math.floor(rand() * 3);
        for (let w = 0; w < whiskerCount; w++) {
          const wFrac = 0.25 + rand() * 0.55;
          const wDist = wFrac * streakLength;
          const wx = pelletX + Math.cos(rayAngle) * wDist;
          const wy = pelletY + Math.sin(rayAngle) * wDist;

          // Branches shoot outwards diagonally
          const wSide = rand() > 0.5 ? 1 : -1;
          const wAngle = rayAngle + wSide * (0.2 + rand() * 0.3);
          const wLen = (12 + rand() * 28) * spread * (radius / 600);

          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(
            wx + Math.cos(wAngle) * wLen,
            wy + Math.sin(wAngle) * wLen
          );
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1.0, rootWidth * 0.22);
          ctx.lineCap = 'round';
          ctx.stroke();

          // Droplet at branch tip
          const bTipX = wx + Math.cos(wAngle) * (wLen + 4);
          const bTipY = wy + Math.sin(wAngle) * (wLen + 4);
          if (Math.hypot(bTipX, bTipY) < outerRim) {
            ctx.beginPath();
            ctx.arc(bTipX, bTipY, 1.2 + rand() * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          }
        }
      }

      // Satellite micro-droplets peppered forward along the streak trajectory
      const dropCount = Math.floor(rand() * 4) + (isMajorRunner ? 3 : 1);
      for (let d = 0; d < dropCount; d++) {
        const dDist = streakLength + (6 + rand() * 35) * spread * (radius / 600);
        const dAngle = rayAngle + (rand() - 0.5) * 0.12;
        const dx = pelletX + Math.cos(dAngle) * dDist;
        const dy = pelletY + Math.sin(dAngle) * dDist;

        if (Math.hypot(dx, dy) < outerRim) {
          ctx.beginPath();
          // Elongated droplet along velocity vector
          ctx.arc(dx, dy, 0.9 + rand() * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
    }

    // Organic melted pellet core (irregular blob, not a compass circle)
    const coreR = (3.5 + rand() * 4.5) * spread * (radius / 600);
    ctx.beginPath();
    const blobPoints = 7;
    for (let bp = 0; bp < blobPoints; bp++) {
      const bAngle = (bp / blobPoints) * Math.PI * 2;
      const bRad = coreR * (0.7 + rand() * 0.6);
      const bpx = pelletX + Math.cos(bAngle) * bRad;
      const bpy = pelletY + Math.sin(bAngle) * bRad;
      if (bp === 0) ctx.moveTo(bpx, bpy);
      else ctx.lineTo(bpx, bpy);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws ultra-realistic Galaxy Swirl / Marble Smoke fluid streams
 */
export function renderPhotorealisticGalaxySwirl(
  ctx: CanvasRenderingContext2D,
  radius: number,
  vinyl: any
) {
  const secondaryColor = vinyl.secondaryColor || '#6366f1';
  const tertiaryColor = vinyl.tertiaryColor || vinyl.splatterColor1 || '#38bdf8';

  ctx.save();
  ctx.clip();

  // Multi-pass volumetric smoke rivers
  const riverCount = 14;
  for (let r = 0; r < riverCount; r++) {
    const color = r % 2 === 0 ? secondaryColor : tertiaryColor;
    const baseA = (r / riverCount) * Math.PI * 2;
    const streamWidth = radius * (0.05 + ((r * 13) % 7) * 0.015);

    ctx.beginPath();
    const startR = radius * 0.28;
    ctx.moveTo(Math.cos(baseA) * startR, Math.sin(baseA) * startR);

    // Multi-octave spiral curve
    const steps = 18;
    for (let s = 1; s <= steps; s++) {
      const frac = s / steps;
      const curR = startR + frac * (radius * 0.68);
      // Fluid vortex turbulence
      const curl = baseA + frac * 2.2 + Math.sin(frac * 6.28 + r) * 0.22;
      ctx.lineTo(Math.cos(curl) * curR, Math.sin(curl) * curR);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = streamWidth;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.42;
    ctx.stroke();
  }

  ctx.restore();
}
