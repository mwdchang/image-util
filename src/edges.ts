import { convolve2 } from './convolve';
import {greyScale} from './core';

export const sobelFilter = (img: ImageData): ImageData => {
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  const grey = greyScale(img);

  const data: number[] = [];
  for (let i = 0; i < grey.data.length; i++) {
    if (i % 4 === 0) data.push(grey.data[i]);
  }

  const gxResult = convolve2(data, img.width, img.height, 1, gx);
  const gyResult = convolve2(data, img.width, img.height, 1, gy);


  // Join
  const r: number[] = [];
  for (let i = 0; i < gxResult.length; i++) {
    const v = Math.sqrt(gxResult[i] * gxResult[i] + gyResult[i] * gyResult[i]);
    r.push(Math.min(255, v));
    r.push(Math.min(255, v));
    r.push(Math.min(255, v));
    r.push(Math.min(255, v));
  }

  return new ImageData(
    new Uint8ClampedArray(r),
    img.width,
    img.height
  );
};

