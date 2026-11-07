/**
 * Photorealistic IRL Vinyl Splatter Algorithm
 *
 * Models the hydraulic steam-press physics of vinyl pellet melting:
 * 1. Centrifugal outward radial flow from center spindle toward the rim.
 * 2. Tapered dendritic flame rays with wide molten bases and needle tips.
 * 3. Radial whisker filaments branching off the main streaks along groove vectors.
 * 4. Micro-droplet flecks thrown centrifugally beyond the ray tips.
 * 5. 1-tone, 2-tone, and 3-tone multi-color pellet blending.
 */
export function renderPhotorealisticSplatter(
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
  const spread = Math.min(2.5, Math.max(0.4, vinyl.splatterSpread || 1.15));

  ctx.save();
  ctx.clip(); // Constrain strictly inside disc perimeter

  const labelRadius = radius * 0.335;
  const outerRim = radius * 0.96;

  // Number of pellet seed drops distributed around the biscuit
  const clusterCount = Math.floor(density * 0.42) + 8;

  for (let b = 0; b < clusterCount; b++) {
    const color = colors[b % colors.length];

    // Quasi-random golden angle distribution around the disc
    const baseAngle = b * 2.39996 + ((b * 19) % 100) * 0.012;
    // Pellets fall between dead-wax and middle track area
    const startRadius = labelRadius + 12 + ((b * 37) % 100) * ((radius * 0.46) / 100);

    const pelletX = Math.cos(baseAngle) * startRadius;
    const pelletY = Math.sin(baseAngle) * startRadius;

    // Number of centrifugal flame rays shooting outward from this molten pellet
    const rayCount = 3 + ((b * 7) % 5);

    for (let r = 0; r < rayCount; r++) {
      // Ray radiates outward from center spindle toward the outer rim
      const rayAngle = baseAngle + ((r - rayCount / 2) * 0.09) + (((b * 13 + r * 7) % 20) - 10) * 0.005;

      // Centrifugal ray length
      const maxAvailableDist = outerRim - startRadius;
      const rayLength = Math.min(
        maxAvailableDist,
        (55 + ((b * 31 + r * 41) % 210)) * spread * (radius / 600)
      );

      const endX = pelletX + Math.cos(rayAngle) * rayLength;
      const endY = pelletY + Math.sin(rayAngle) * rayLength;

      // Base width of the flame streak
      const baseWidth = (5 + ((b * 11 + r * 5) % 12)) * spread * (radius / 600);
      const perpAngle = rayAngle + Math.PI / 2;

      const p1x = pelletX + Math.cos(perpAngle) * (baseWidth * 0.5);
      const p1y = pelletY + Math.sin(perpAngle) * (baseWidth * 0.5);
      const p2x = pelletX - Math.cos(perpAngle) * (baseWidth * 0.5);
      const p2y = pelletY - Math.sin(perpAngle) * (baseWidth * 0.5);

      // Mid-point control point with organic rotational curvature
      const midDist = rayLength * 0.45;
      const midAngle = rayAngle + 0.032 * (b % 2 === 0 ? 1 : -1);
      const midWidth = baseWidth * 0.55;
      const m1x = pelletX + Math.cos(midAngle) * midDist + Math.cos(perpAngle) * (midWidth * 0.5);
      const m1y = pelletY + Math.sin(midAngle) * midDist + Math.sin(perpAngle) * (midWidth * 0.5);
      const m2x = pelletX + Math.cos(midAngle) * midDist - Math.cos(perpAngle) * (midWidth * 0.5);
      const m2y = pelletY + Math.sin(midAngle) * midDist - Math.sin(perpAngle) * (midWidth * 0.5);

      // Tapered flame streak path
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.quadraticCurveTo(m1x, m1y, endX, endY);
      ctx.quadraticCurveTo(m2x, m2y, p2x, p2y);
      ctx.closePath();
      ctx.fill();

      // Sharp filament whiskers branching off the ray
      const whiskerCount = 2 + (r % 3);
      for (let w = 1; w <= whiskerCount; w++) {
        const wDist = rayLength * (0.3 + w * 0.22);
        const wx = pelletX + Math.cos(rayAngle) * wDist;
        const wy = pelletY + Math.sin(rayAngle) * wDist;
        const wAngle = rayAngle + ((w % 2 === 0 ? 1 : -1) * 0.25);
        const wLen = (9 + ((w * 13 + b * 5) % 20)) * spread * (radius / 600);

        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.2, baseWidth * 0.22);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + Math.cos(wAngle) * wLen, wy + Math.sin(wAngle) * wLen);
        ctx.stroke();
      }

      // Satellite micro-droplets thrown ahead of the streak tip
      const dropletCount = 2 + (r % 3);
      for (let d = 1; d <= dropletCount; d++) {
        const dropDist = rayLength + (d * (12 + (b % 7))) * spread * (radius / 600);
        const dropX = pelletX + Math.cos(rayAngle) * dropDist;
        const dropY = pelletY + Math.sin(rayAngle) * dropDist;
        const dropR = 1.3 + ((d * 7 + b * 3) % 4) * 0.6;

        if (Math.hypot(dropX, dropY) < outerRim) {
          ctx.beginPath();
          ctx.arc(dropX, dropY, dropR, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }
    }

    // Melted pellet core blob
    const coreRadius = (4 + ((b * 13) % 7)) * spread * (radius / 600);
    ctx.beginPath();
    ctx.arc(pelletX, pelletY, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.restore();
}
