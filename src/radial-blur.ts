import { z } from 'zod';
import { sampleBilinear } from "./core";

export const RadialSpinOptionsSchema = z.object({
  cx: z.number(),
  cy: z.number(),
  angleRad: z.number().default(0.5),
  samples: z.number().default(32)
});


/**
 * cx - center x
 * cy - center y
 * samples - number of rotational steps
 * angleRad - angle of blur
**/
export const radialSpinBlur = (
  src: ImageData,
  options: z.input<typeof RadialSpinOptionsSchema>
) => {
  const { width, height } = src;
  const out = new ImageData(width, height);
  const { cx, cy, angleRad, samples } = options;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {

      let r = 0, g = 0, b = 0, a = 0;

      const dx = x - cx;
      const dy = y - cy;

      for (let i = 0; i < samples; i++) {
        const t = (i / (samples - 1)) - 0.5;
        const aRot = t * angleRad;

        const s = Math.sin(aRot);
        const c = Math.cos(aRot);

        // rotate around center
        const sx = cx + (dx * c - dy * s);
        const sy = cy + (dx * s + dy * c);

        const col = sampleBilinear(src, sx, sy);
        r += col[0];
        g += col[1];
        b += col[2];
        a += col[3];
      }

      const id = (y * width + x) * 4;
      out.data[id] = r / samples;
      out.data[id + 1] = g / samples;
      out.data[id + 2] = b / samples;
      out.data[id + 3] = a / samples;
    }
  }

  return out;
};

