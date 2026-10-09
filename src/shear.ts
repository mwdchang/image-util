import { z } from 'zod';

export const ShearOptionsSchema = z.object({
  chunk: z.number(),
  maxSize: z.number(),
});

export const vshear = (
  img: ImageData,
  options: z.input<typeof ShearOptionsSchema>
) => {
  const width = img.width;
  const height = img.height;

  const shifted = new ImageData(new Uint8ClampedArray(img.data), width, height);
  const { chunk, maxSize } = options;

  let offset = Math.floor(Math.random() * maxSize);

  let counter = 0;
  let flag = false;
  for (let i = 0; i < width; i++) {
    counter++;

    if (flag) {
      for (let j = 0; j < height - offset; j++) {
        const idx = 4 * (j * width + i);
        const ridx = 4 * ((j + offset) * width + i);

        shifted.data[idx] = img.data[ridx];
        shifted.data[idx + 1] = img.data[ridx + 1];
        shifted.data[idx + 2] = img.data[ridx + 2];
        shifted.data[idx + 3] = img.data[ridx + 3];
      }
      for (let j = height - offset; j < height; j++) {
        const idx = 4 * (j * width + i);
        shifted.data[idx] = 255;
        shifted.data[idx + 1] = 255;
        shifted.data[idx + 2] = 255;
        shifted.data[idx + 3] = 255;
      }
    } else {
      for (let j = 0; j < offset; j++) {
        const idx = 4 * (j * width + i);
        shifted.data[idx] = 255;
        shifted.data[idx + 1] = 255;
        shifted.data[idx + 2] = 255;
        shifted.data[idx + 3] = 255;
      }
      for (let j = offset; j < height; j++) {
        const idx = 4 * (j * width + i);
        const ridx = 4 * ((j - offset) * width + i);

        shifted.data[idx] = img.data[ridx];
        shifted.data[idx + 1] = img.data[ridx + 1];
        shifted.data[idx + 2] = img.data[ridx + 2];
        shifted.data[idx + 3] = img.data[ridx + 3];
      }
    }

    if (counter == chunk) {
      offset = Math.floor(Math.random() * maxSize);
      flag = !flag;
      counter = 0;
    }
  }

  return shifted;
};


export const hshear = (
  img: ImageData,
  options: z.input<typeof ShearOptionsSchema>
) => {
  const width = img.width;
  const height = img.height;

  const shifted = new ImageData(new Uint8ClampedArray(img.data), width, height);
  const { chunk, maxSize } = options;

  let offset = Math.floor(Math.random() * maxSize);

  let counter = 0;
  let flag = false;
  for (let i = 0; i < height; i++) {
    counter++;

    if (flag) {
      for (let j = 0; j < width - offset; j++) {
        const idx = 4 * (i * width + j);
        const ridx = 4 * (i * width + j + offset);

        shifted.data[idx] = img.data[ridx];
        shifted.data[idx + 1] = img.data[ridx + 1];
        shifted.data[idx + 2] = img.data[ridx + 2];
        shifted.data[idx + 3] = img.data[ridx + 3];
      }

      for (let j = width - offset; j < width; j++) {
        const idx = 4 * (i * width + j);
        shifted.data[idx] = 255;
        shifted.data[idx + 1] = 255;
        shifted.data[idx + 2] = 255;
        shifted.data[idx + 3] = 255;
      }
    } else {
      for (let j = offset; j < width; j++) {
        const idx = 4 * (i * width + j);
        const ridx = 4 * (i * width + j - offset);

        shifted.data[idx] = img.data[ridx];
        shifted.data[idx + 1] = img.data[ridx + 1];
        shifted.data[idx + 2] = img.data[ridx + 2];
        shifted.data[idx + 3] = img.data[ridx + 3];
      }


      for (let j = 0; j < offset; j++) {
        const idx = 4 * (i * width + j);
        shifted.data[idx] = 255;
        shifted.data[idx + 1] = 255;
        shifted.data[idx + 2] = 255;
        shifted.data[idx + 3] = 255;
      }
    }

    if (counter == chunk) {
      offset = Math.floor(Math.random() * maxSize);
      flag = !flag;
      counter = 0;
    }
  }
  return shifted;
};


export const ShearAllOptionsSchema = z.object({
  hChunk: z.number(),
  hSize: z.number(),
  vChunk: z.number(),
  vSize: z.number(),
});


export const shearFilter = (
  img: ImageData,
  options: z.input<typeof ShearAllOptionsSchema>
) => {
  const { hChunk, hSize, vChunk, vSize } = options;
  const res = hshear(img, { chunk: hChunk, maxSize: hSize });
  return vshear(res, { chunk: vChunk, maxSize: vSize });
};
