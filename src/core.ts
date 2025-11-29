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

export const createCanvas = (img: ImageData) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height; 
  const context = canvas.getContext('2d');
  context.putImageData(img, 0, 0);
  return canvas;
};



/**
 * Image crop
 */
export const crop = (img: ImageData, rect: IRect): ImageData => {
  const w = img.width;
  const channels = 4;
  const croppedWidth = rect.width;
  const croppedHeight = rect.height;

  const result = new Uint8ClampedArray(croppedWidth * croppedHeight * channels);
  let resultIndex = 0;

  for (let j = rect.y; j < rect.y + rect.height; j++) {
    for (let i = rect.x; i < rect.x + rect.width; i++) {
      const idx = (j * w * channels) + i * channels;

      for (let c = 0; c < channels; c++) {
        result[resultIndex++] = img.data[idx + c];
      }
    }
  }
  return new ImageData(
    result,
    croppedWidth,
    croppedHeight
  );
};


interface ColourData {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface TransFormParam extends ColourData {
  x: number;
  y: number;
}

/**
 * Transform a single image at pixel level
**/
type TransformFN = (d: TransFormParam)  => ColourData;
export const transformFilter = (img: ImageData, fn: TransformFN) : ImageData => {
  const len = img.data.length;
  const result = new Uint8ClampedArray(len);

  for (let i = 0; i < len; i+=4) {
    const index = i / 4;
    const transformed = fn({
      r: img.data[i + 0],
      g: img.data[i + 1],
      b: img.data[i + 2],
      a: img.data[i + 3],
      x: index % img.width,
      y: Math.floor(index / img.height)
    });
    result[i+0] = transformed.r;
    result[i+1] = transformed.g;
    result[i+2] = transformed.b;
    result[i+3] = transformed.a;
  }

  return new ImageData(
    result,
    img.width,
    img.height
  );
}

/**
 * Combined transform of two images at pixel level
**/
type Transform2FN = (a: ColourData, b: ColourData)  => ColourData;
export const transform2Filter = (img1: ImageData, img2: ImageData, fn: Transform2FN) : ImageData => {
  if (img1.data.length !== img2.data.length) throw new Error('images need to be same length');

  const len = img1.data.length;
  const result = new Uint8ClampedArray(len);

  for (let i = 0; i < len; i+=4) {
    const transformed = fn(
      {
        r: img1.data[i + 0],
        g: img1.data[i + 1],
        b: img1.data[i + 2],
        a: img1.data[i + 3]
      },
      {
        r: img2.data[i + 0],
        g: img2.data[i + 1],
        b: img2.data[i + 2],
        a: img2.data[i + 3]
      }
    );
    result[i+0] = transformed.r;
    result[i+1] = transformed.g;
    result[i+2] = transformed.b;
    result[i+3] = transformed.a;
  }

  return new ImageData(
    result,
    img1.width,
    img1.height
  );
}

/**
 * Adapted from https://www.html5rocks.com/en/tutorials/canvas/imagefilters/
**/
export const convolve = (img: ImageData, weights: number[]): ImageData => {
  const { width, height, data } = img;
  const channels = numChannels(img);
  const result = convolve2(Array.from(data), width, height, channels, weights);
  return new ImageData(new Uint8ClampedArray(result), width, height);
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
  const fallbackWeight = (1 / weights.length) * 0.28;
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
              ch[c] += data[(y * w + x) * channels] * fallbackWeight;
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

/**
 * Applies a color matrix transformation to an image.
 * This function is used to apply various color filters to an image.
 *
 * @param {ImageData} img The image data to apply the filter to.
 * @param {number[]} matrix The color matrix to apply. This is a 3x3 matrix represented as a 9-element array.
 * @returns {ImageData} The new image data with the filter applied.
 */
export const mult = (img: ImageData, matrix: number[]): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;
  const res = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const index = channels * (y * w + x);
      const r = img.data[index + 0];
      const g = img.data[index + 1];
      const b = img.data[index + 2];
      const a = img.data[index + 3];

      const rNew = r * matrix[0] + g * matrix[1] + b * matrix[2];
      const gNew = r * matrix[3] + g * matrix[4] + b * matrix[5];
      const bNew = r * matrix[6] + g * matrix[7] + b * matrix[8];

      res.push(rNew);
      res.push(gNew);
      res.push(bNew);
      res.push(a);
    }
  }

  return new ImageData(new Uint8ClampedArray(res), w, h);
};



// RGB → HSV (normalized 0–1 range)
export const rgbToHsv = (r: number, g: number, b: number) => {
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6;
    } else {
      h = ((r - g) / d + 4) / 6;
    }
  }

  let s = max === 0 ? 0 : d / max;
  let v = max;
  return { h, s, v };
};


export const sampleBilinear = (img: ImageData, xpoint: number, ypoint: number) => {
  const { width, height, data } = img;

  const channels = (data.length / width) / height;
  if (channels !== 4) {
    throw new Error('Only support rgba channels currently...');
  }

  // Clamp to edges
  let x = Math.max(0, Math.min(width - 1, xpoint));
  let y = Math.max(0, Math.min(height - 1, ypoint));

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);

  const dx = x - x0;
  const dy = y - y0;

  function sample(px: number, py: number) {
    const i = (py * width + px) * 4;
    return [
        data[i], data[i + 1], data[i + 2], data[i + 3]
    ];
  }

  const c00 = sample(x0, y0);
  const c10 = sample(x1, y0);
  const c01 = sample(x0, y1);
  const c11 = sample(x1, y1);

  const c0 = c00.map((v, i) => v * (1 - dx) + c10[i] * dx);
  const c1 = c01.map((v, i) => v * (1 - dx) + c11[i] * dx);
  return c0.map((v, i) => v * (1 - dy) + c1[i] * dy);
}

