import { numChannels } from './core';

export const convolve2 = (
  data: number[],
  width: number,
  height: number,
  channels: number,
  weights: number[]
): number[] => {
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const sw = width;
  const sh = height;

  // pad output by the convolution matrix
  const w = sw;
  const h = sh;

  const result: number[] = [];
  // go through the destination image pixels
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // calculate the weighed sum of the source image pixels that
      // fall under the convolution matrix
      const ch = [];
      for (let c = 0; c < channels; c++) {
        ch.push(0);
      }

      // Not well defined around edges
      // if (y - halfSide < 0 || y + halfSide >= h || x - halfSide < 0 || x + halfSide >= w) {
      //   for (let c = 0; c < channels; c++) {
      //     ch[c] = data[(x * w + y) * channels];
      //   }
      // }

      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = (scy * sw + scx) * channels;
            const wt = weights[cy * side + cx];

            for (let c = 0; c < channels; c++) {
              ch[c] += data[srcOff + c] * wt;
            }
          } else {
            // Not great ... but does the job
            for (let c = 0; c < channels; c++) {
              ch[c] += data[(y * w + x) * channels] * (1 / weights.length) * 0.28;
            }
          }
        }
      }
      for (let c = 0; c < channels; c++) {
        result.push(ch[c]);
      }
    }
  }
  return result;
}; 

// Adapted from https://www.html5rocks.com/en/tutorials/canvas/imagefilters/
export const convolve = (img: ImageData, weights: number[]): ImageData => {
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const sw = img.width;
  const sh = img.height;
  const channels = numChannels(img);

  // pad output by the convolution matrix
  const w = sw;
  const h = sh;

  const result: number[] = [];
  // go through the destination image pixels
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // calculate the weighed sum of the source image pixels that
      // fall under the convolution matrix
      const ch = [];
      for (let c = 0; c < channels; c++) {
        ch.push(0);
      }

      // Not well defined around edges
      // if (y - halfSide < 0 || y + halfSide >= h || x - halfSide < 0 || x + halfSide >= w) {
      //   for (let c = 0; c < channels; c++) {
      //     ch[c] = data[(x * w + y) * channels];
      //   }
      // }

      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = (scy * sw + scx) * channels;
            const wt = weights[cy * side + cx];

            for (let c = 0; c < channels; c++) {
              ch[c] += img.data[srcOff + c] * wt;
            }
          } else {
            // Not great ... but does the job
            for (let c = 0; c < channels; c++) {
              ch[c] += img.data[(y * w + x) * channels] * (1 / weights.length) * 0.28;
            }
          }
        }
      }
      for (let c = 0; c < channels; c++) {
        result.push(ch[c]);
      }
    }
  }

  return new ImageData( new Uint8ClampedArray(result), sw, sh);
};

