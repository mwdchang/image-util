import { z } from 'zod';

export const FishEyeOptionSchema = z.object({
  cx: z.number().min(0).max(1000).default(200).describe('Centre X'),
  cy: z.number().min(0).max(1000).default(200).describe('Centre Y'),
  radius: z.number().min(0).max(1000).default(200).describe('Radius'),
  strength: z.number().min(0).max(0.05).multipleOf(0.0001).default(0.0055).describe('Strength'),
});


export const fishEyeFilter = (
  img: ImageData,
  options: z.input<typeof FishEyeOptionSchema>
): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const result: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - options.cx;
      const dy = y - options.cy;
      const r = Math.sqrt(dx * dx + dy * dy);

      if (r < options.radius) {
        const u = Math.floor(options.cx + dx * options.strength * r);
        const v = Math.floor(options.cy + dy * options.strength * r);
        const index = channels * (v * w + u);

        result.push(img.data[index]);
        result.push(img.data[index + 1]);
        result.push(img.data[index + 2]);
        result.push(255);

      } else {
        const index = channels * (y * w + x);
        result.push(img.data[index]);
        result.push(img.data[index + 1]);
        result.push(img.data[index + 2]);
        result.push(img.data[index + 3]);
      }
    }
  }
  return new ImageData(new Uint8ClampedArray(result), img.width, img.height);
};
