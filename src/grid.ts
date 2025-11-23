export const gridFilter = (img:ImageData, space: number, size: number): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const res: number[] = [];

  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      const index = channels * (y * w + x);
      if (y % space < size || x % space < size) {
        res.push(255);
        res.push(255);
        res.push(255);
        res.push(255);
      } else {
        res.push(img.data[index + 0]);
        res.push(img.data[index + 1]);
        res.push(img.data[index + 2]);
        res.push(255);
      }
    }
  }
  return new ImageData(new Uint8ClampedArray(res), img.width, img.height);
};
