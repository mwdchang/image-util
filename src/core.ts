interface LoadOptions {
  width: number
  height: number
}

interface IRect {
  x: number
  y: number
  width: number
  height: number
}

export const numChannels = (img: ImageData): number => {
  return img.data.length / img.width / img.height;
};

export const loadImage = async (url: string, options: LoadOptions): Promise<ImageData> =>  {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const imgRequest = new Promise<ImageData>((resolve, reject) => {
    img.crossOrigin = '';
    img.onerror = () => {
      reject(new Error('unable to load image'));
    };
    img.onload = () => {
      img.width = options.width || img.naturalWidth;
      img.height = options.height || img.naturalHeight;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(imageData);
    };
    img.src = url;
  });
  return imgRequest;
};


/**
 * Cropping
 */
export const crop = (img: ImageData, rect: IRect): ImageData => {
  const w = img.width;
  const channels = 4;

  const r: number[] = [];

  for (let j = rect.y; j < rect.y + rect.height; j++) {
    for (let i = rect.x; i < rect.x + rect.width; i++) {
      const idx = (j * w * channels) + i * channels;

      for (let c = 0; c < channels; c++) {
        r.push(img.data[idx + c]);
      }
    }
  }
  return new ImageData(
    new Uint8ClampedArray(r),
    rect.width,
    rect.height
  );
};


type ColourData = {
  r: number;
  g: number;
  b: number;
  a: number;
}
type TransformFN = (d: ColourData)  => ColourData;

export const transformFilter = (img: ImageData, fn: TransformFN) : ImageData => {
  const r: number[] = [];
  const len = img.data.length;

  for (let i = 0; i < len; i+=4) {
    const result = fn({
      r: img.data[i + 0],
      g: img.data[i + 1],
      b: img.data[i + 2],
      a: img.data[i + 3]
    });
    r.push(result.r);
    r.push(result.g);
    r.push(result.b);
    r.push(result.a);
  }

  return new ImageData(
    new Uint8ClampedArray(r),
    img.width,
    img.height
  );
}

export const imposeFilter = (imgA: ImageData, imgB: ImageData): ImageData => {
  if (imgA.data.length !== imgB.data.length) {
    throw new Error('Bad dimension');
  }
  const r: number[] = [];

  for (let i = 0; i < imgA.data.length; i++) {
    const v = Math.min(255, imgA.data[i] + imgB.data[i]);
    r.push(v);
  }
  return new ImageData(
    new Uint8ClampedArray(r),
    imgA.width,
    imgA.height
  );
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

