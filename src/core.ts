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
export const greyScale = (img: ImageData): ImageData => {
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


export const add = (imgA: ImageData, imgB: ImageData): ImageData => {
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


export const invert = (image: ImageData): ImageData => {
  const r: number[] = [];
  for (let i = 0; i < image.data.length; i++) {
    if (i % 4 !== 3) {
      r.push(255 - image.data[i]);
    } else {
      r.push(image.data[i]);
    }
  }
  return new ImageData(
    new Uint8ClampedArray(r),
    image.width,
    image.height
  );
};


/**
 * See: https://www.freecodecamp.org/news/sketchify-turn-any-image-into-a-pencil-sketch-with-10-lines-of-code-cf67fa4f68ce/
 * greyscale => blur => invert
 * greyscale
*/
export const dodge = (front: ImageData, back: ImageData): ImageData => {
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
