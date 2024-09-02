import { gaussianBlur } from "./gaussian-blur";
import { greyScaleFilter } from "./greyscale";

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
