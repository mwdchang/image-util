export const fishEyeFilter = (
  img:ImageData,
  cx: number,
  cy: number,
  radius: number,
  strength: number
): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const result: number[] = [];
  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      
      if (r < radius) {
        const u = Math.floor(cx + dx * strength * r);
        const v = Math.floor(cy + dy * strength * r);
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
