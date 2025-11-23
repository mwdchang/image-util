/**
 * Flattens to grey scale
 */
interface RetainFilter {
  rFilter?: [number, number]
  gFilter?: [number, number]
  bFilter?: [number, number]
}
export const greyScaleFilter = (
  img: ImageData,
  retainFilter?: RetainFilter
): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const flat = new Uint8ClampedArray(w * h * channels);

  for (let i = 0; i < w * h; ++i) {
    const j = i * channels;

    // Retain specific colour ranges
    if (retainFilter) {
      if (retainFilter.rFilter) {
        const f = retainFilter.rFilter;
        if (img.data[j] >= f[0] && img.data[j] <= f[1]) {
          flat[j] = img.data[j];
          flat[j + 1] = img.data[j + 1];
          flat[j + 2] = img.data[j + 2];
          flat[j + 3] = 255;
          continue;
        }
      }
      if (retainFilter.gFilter) {
        const f = retainFilter.gFilter;
        if (img.data[j + 1] >= f[0] && img.data[j + 1] <= f[1]) {
          flat[j] = img.data[j];
          flat[j + 1] = img.data[j + 1];
          flat[j + 2] = img.data[j + 2];
          flat[j + 3] = 255;
          continue;
        }
      }
      if (retainFilter.bFilter) {
        const f = retainFilter.bFilter;
        if (img.data[j + 2] >= f[0] && img.data[j + 2] <= f[1]) {
          flat[j] = img.data[j];
          flat[j + 1] = img.data[j + 1];
          flat[j + 2] = img.data[j + 2];
          flat[j + 3] = 255;
          continue;
        }
      }
    }

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

