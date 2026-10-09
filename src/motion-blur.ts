import { z } from 'zod';
import { sampleBilinear } from "./core";

export const MotionBlurOptionsSchema = z.object({
  angleRad: z.number(),
  radius: z.number().default(24),
  samples: z.number().default(24),
});


export const motionBlur = (
  src: ImageData,
  options: z.input<typeof MotionBlurOptionsSchema>
) => {
  const { width, height } = src;
  const { angleRad, radius, samples } = options;

  const out = new ImageData(width, height);
  const dx = Math.cos(angleRad);
  const dy = Math.sin(angleRad);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let i = 0; i < samples; i++) {
        const t = (i / (samples - 1)) - 0.5;
        const sx = x + dx * t * radius;
        const sy = y + dy * t * radius;

        const c = sampleBilinear(src, sx, sy);
        r += c[0];
        g += c[1];
        b += c[2];
        a += c[3];
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

