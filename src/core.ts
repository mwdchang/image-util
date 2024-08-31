import { transpose } from "d3"

interface Options {
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

export const loadImage = async (url: string, options: Options): Promise<ImageData> =>  {
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


