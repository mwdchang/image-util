import { convolve } from './core';

export const uniformBlur = (img: ImageData, v: number): ImageData => {
  const weights = [];
  const v2 = v * v;
  for (let i = 0; i < v2; i++) {
    weights.push(1 / v2);
  }
  return convolve(img, weights);
};
