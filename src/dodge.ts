/**
 * See: https://www.freecodecamp.org/news/sketchify-turn-any-image-into-a-pencil-sketch-with-10-lines-of-code-cf67fa4f68ce/
 * greyscale => blur => invert
 * greyscale
*/
export const dodgeFilter = (front: ImageData, back: ImageData): ImageData => {
  const r: number[] = [];
  for (let i = 0; i < front.data.length; i++) {
    let v = front.data[i] /  (255 - back.data[i]);
    if (v > 1) v = 1;
    r.push(v * 255);
  }
  return new ImageData(
    new Uint8ClampedArray(r),
    front.width,
    front.height
  );
};

