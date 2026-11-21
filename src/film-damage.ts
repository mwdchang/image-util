import { z } from 'zod';

/**
 * A simple seedable pseudo-random number generator (mulberry32).
 * Allows reproducible randomness when a seed is provided.
 */
const mulberry32 = (seed: number) => {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const FilmDamageOptionsSchema = z.object({
  scratches: z.number().int().min(0).max(40).default(6)
    .describe('Number of vertical scratch lines'),
  scratchIntensity: z.number().min(0).max(1).default(0.55)
    .describe('Opacity/brightness of the scratch lines (0 = invisible, 1 = bright white)'),
  dust: z.number().min(0).max(1).default(0.004)
    .describe('Density of dust/dirt specks (probability per pixel)'),
  grain: z.number().min(0).max(1).default(0.12)
    .describe('Amount of film grain noise'),
  vignette: z.number().min(0).max(1).default(0.35)
    .describe('Strength of edge darkening vignette'),
  desaturate: z.number().min(0).max(1).default(0.25)
    .describe('Amount of colour desaturation for an aged look'),
  seed: z.number().int().optional()
    .describe('Random seed for reproducible results'),
});

/**
 * Simulates damaged / aged film stock. Produces vertical scratch lines,
 * dust & dirt specks, film grain noise, corner vignetting, and optional
 * desaturation — all composited directly onto the ImageData buffer.
 */
export const filmDamageFilter = (
  img: ImageData,
  options: z.input<typeof FilmDamageOptionsSchema>
): ImageData => {
  const opts = FilmDamageOptionsSchema.parse(options);
  const { width: w, height: h } = img;
  const channels = 4;
  const len = w * h * channels;

  const rng = mulberry32(opts.seed ?? (Date.now() | 0));

  // Copy source pixels into a working buffer
  const result = new Uint8ClampedArray(len);
  for (let i = 0; i < len; i++) {
    result[i] = img.data[i];
  }

  // ── 1. Desaturate ────────────────────────────────────────────────────
  if (opts.desaturate > 0) {
    const amt = opts.desaturate;
    for (let i = 0; i < len; i += channels) {
      const r = result[i];
      const g = result[i + 1];
      const b = result[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      result[i + 0] = r + (lum - r) * amt;
      result[i + 1] = g + (lum - g) * amt;
      result[i + 2] = b + (lum - b) * amt;
    }
  }

  // ── 2. Vertical scratch lines ────────────────────────────────────────
  // Each scratch is a thin vertical band that runs the full height of the
  // image with slight horizontal wobble and random gaps.
  for (let s = 0; s < opts.scratches; s++) {
    const baseX = Math.floor(rng() * w);
    const scratchWidth = rng() < 0.3 ? 2 : 1; // occasional thicker scratch
    const brightness = 180 + Math.floor(rng() * 76); // 180-255
    const opacity = opts.scratchIntensity * (0.5 + rng() * 0.5);

    let wobbleX = 0;
    for (let y = 0; y < h; y++) {
      // Random gaps — parts of the scratch disappear
      if (rng() < 0.03) continue;

      // Gentle horizontal drift
      if (rng() < 0.15) {
        wobbleX += rng() < 0.5 ? -1 : 1;
      }

      for (let dx = 0; dx < scratchWidth; dx++) {
        const px = baseX + wobbleX + dx;
        if (px < 0 || px >= w) continue;

        const idx = (y * w + px) * channels;
        result[idx + 0] = result[idx + 0] + (brightness - result[idx + 0]) * opacity;
        result[idx + 1] = result[idx + 1] + (brightness - result[idx + 1]) * opacity;
        result[idx + 2] = result[idx + 2] + (brightness - result[idx + 2]) * opacity;
      }
    }
  }

  // ── 3. Dust & dirt specks ────────────────────────────────────────────
  // Small bright or dark spots scattered randomly across the image.
  if (opts.dust > 0) {
    for (let i = 0; i < len; i += channels) {
      if (rng() < opts.dust) {
        const bright = rng() < 0.6; // 60 % bright specks, 40 % dark
        const size = rng() < 0.15 ? 2 : 1; // occasional larger speck
        const speckValue = bright ? 200 + Math.floor(rng() * 56) : Math.floor(rng() * 50);
        const speckOpacity = 0.4 + rng() * 0.6;

        const pixelIndex = i / channels;
        const px0 = pixelIndex % w;
        const py0 = Math.floor(pixelIndex / w);

        for (let dy = 0; dy < size; dy++) {
          for (let dx = 0; dx < size; dx++) {
            const px = px0 + dx;
            const py = py0 + dy;
            if (px >= w || py >= h) continue;

            const idx = (py * w + px) * channels;
            result[idx + 0] = result[idx + 0] + (speckValue - result[idx + 0]) * speckOpacity;
            result[idx + 1] = result[idx + 1] + (speckValue - result[idx + 1]) * speckOpacity;
            result[idx + 2] = result[idx + 2] + (speckValue - result[idx + 2]) * speckOpacity;
          }
        }
      }
    }
  }

  // ── 4. Film grain ───────────────────────────────────────────────────
  if (opts.grain > 0) {
    const strength = opts.grain * 60; // max ±60 brightness units
    for (let i = 0; i < len; i += channels) {
      const noise = (rng() - 0.5) * 2 * strength;
      result[i + 0] = Math.min(255, Math.max(0, result[i + 0] + noise));
      result[i + 1] = Math.min(255, Math.max(0, result[i + 1] + noise));
      result[i + 2] = Math.min(255, Math.max(0, result[i + 2] + noise));
    }
  }

  // ── 5. Vignette (edge darkening) ────────────────────────────────────
  if (opts.vignette > 0) {
    const cx = w / 2;
    const cy = h / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) / maxDist; // 0 at centre, 1 at corner
        const factor = 1 - dist * dist * opts.vignette;

        const idx = (y * w + x) * channels;
        result[idx + 0] = result[idx + 0] * factor;
        result[idx + 1] = result[idx + 1] * factor;
        result[idx + 2] = result[idx + 2] * factor;
      }
    }
  }

  return new ImageData(new Uint8ClampedArray(result), w, h);
};
