import { z } from "zod";

const luminosity = (r: number, g: number, b: number): number => {
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255.0;
};


export const HatchOptionsSchema = z.object({
  t1: z.number(),
  t2: z.number(),
  t3: z.number(),
  t4: z.number(),
});

// http://www.geeks3d.com/20110219/shader-library-crosshatching-glsl-filter/
// https://www.npmjs.com/package/glsl-crosshatch-filter
export const hatchFilter = (
  img: ImageData,
  options: z.infer<typeof HatchOptionsSchema>
): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const res: number[] = [];

  const hatchColour = 10;

  const { t1, t2, t3, t4 } = options;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const index = channels * (y * w + x);
      const r = img.data[index + 0];
      const g = img.data[index + 1];
      const b = img.data[index + 2];
      const lum = luminosity(r, g, b);

      let nR = 245;
      let nG = 245;
      let nB = 245;

      const mod = 6;

      if (lum < t1) {
        if ((x + y) % mod === 0) {
          nR = 4 * hatchColour;
          nG = 4 * hatchColour;
          nB = 4 * hatchColour;
        }
      }
      if (lum < t2) {
        if ((x - y) % mod === 0) {
          nR = 4 * hatchColour;
          nG = 4 * hatchColour;
          nB = 4 * hatchColour;
        }
      }
      if (lum < t3) {
        if ((x + y - 5) % mod === 0) {
          nR = 4 * hatchColour;
          nG = 4 * hatchColour;
          nB = 4 * hatchColour;
        }
      }
      if (lum < t4) {
        if ((x - y - 5) % mod === 0) {
          nR = 8 * hatchColour;
          nG = 8 * hatchColour;
          nB = 8 * hatchColour;
        }
      }
      res.push(nR);
      res.push(nG);
      res.push(nB);
      res.push(255);
    }
  }

  return new ImageData(new Uint8ClampedArray(res), img.width, img.height);
};
