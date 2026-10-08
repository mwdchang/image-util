/**
 * Flattens to grey scale
 */
export const greyScaleFilter = (
  img: ImageData
): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const flat = new Uint8ClampedArray(w * h * channels);

  for (let i = 0; i < w * h; ++i) {
    const j = i * channels;
    let v = 0;
    for (let c = 0; c < (channels - 1); c++) {
      v += img.data[j + c];
    }
    v /= 3;
    for (let c = 0; c < (channels - 1); c++) {
      flat[j + c] = v;
    }
    flat[j + channels - 1] = 255;
  }

  return new ImageData(new Uint8ClampedArray(flat), w, h);
};

