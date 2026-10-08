import { z } from 'zod';
import { convolve } from './core';

export const uniformBlurSchema = z.object({
  value: z.number().min(1).max(10).default(1).describe('Blur radius')
});

export const uniformBlur = (
  img: ImageData,
  options: z.input<typeof uniformBlurSchema>
): ImageData => {
  const v = options.value;
  const weights = [];
  const v2 = v * v;
  for (let i = 0; i < v2; i++) {
    weights.push(1 / v2);
  }
  return convolve(img, weights);
};
