import { transformFilter } from "./core";

export const invertFilter = (image: ImageData): ImageData => {
  return transformFilter(image, (d) => {
    return {
      r: 255 - d.r,
      g: 255 - d.g,
      b: 255 - d.b,
      a: d.a
    };
  });
};
