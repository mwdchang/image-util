import { greyScaleFilter } from './core';
import { convolve } from './convolve';

const blurGaussian = [
  0.00000067, 0.00002292, 0.00019117, 0.00038771, 0.00019117, 0.00002292, 0.00000067,
  0.00002292, 0.00078633, 0.00655965, 0.01330373, 0.00655965, 0.00078633, 0.00002292,
  0.00019117, 0.00655965, 0.05472157, 0.11098164, 0.05472157, 0.00655965, 0.00019117,
  0.00038771, 0.01330373, 0.11098164, 0.22508352, 0.11098164, 0.01330373, 0.00038771,
  0.00019117, 0.00655965, 0.05472157, 0.11098164, 0.05472157, 0.00655965, 0.00019117,
  0.00002292, 0.00078633, 0.00655965, 0.01330373, 0.00655965, 0.00078633, 0.00002292,
  0.00000067, 0.00002292, 0.00019117, 0.00038771, 0.00019117, 0.00002292, 0.00000067
];

export const gaussianBlur = (img: ImageData): ImageData => {
  return convolve(img, blurGaussian);
};

export const uniformBlur = (img: ImageData, v: number): ImageData => {
  const weights = [];
  const v2 = v * v;
  for (let i = 0; i < v2; i++) {
    weights.push(1 / v2);
  }
  return convolve(img, weights);
};


export const glowFilter = (img: ImageData): ImageData => {
  let mask = gaussianBlur(img);
  mask = greyScaleFilter(mask);

  const r: number[] = [];

  for (let i = 0; i < img.data.length; i++) {
    if (i % 4 !== 3) {
      const v = Math.min(255, 0.5 * mask.data[i] + 0.9 * img.data[i]);
      r.push(v);
    } else {
      r.push(255);
    }
  }
  return new ImageData(
    new Uint8ClampedArray(r),
    img.width, 
    img.height
  );
};
