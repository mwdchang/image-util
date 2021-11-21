const luminosity = (r: number, g: number, b: number): number => {
  return (r * 0.299 + g * 0.587 +  b * 0.114) / 255.0;
};

// http://www.geeks3d.com/20110219/shader-library-crosshatching-glsl-filter/
export const hatchFilter = (
  img: ImageData,
  t1: number,
  t2: number,
  t3: number,
  t4: number
): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const res: number[] = [];

  const hatchColour = 10;

  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      const index = channels * (y * w + x);
      const r = img.data[index + 0];
      const g = img.data[index + 1];
      const b = img.data[index + 2];
      const lum = luminosity(r, g, b);

      let nR = 245;
      let nG = 245;
      let nB = 245;

      const mod = 6;

      if (lum < t1) {
        if ((x + y) % mod === 0) {
          nR = 4 * hatchColour;
          nG = 4 * hatchColour;
          nB = 4 * hatchColour;
        }
      }
      if (lum < t2) {
        if ((x - y) % mod === 0) {
          nR = 4 * hatchColour;
          nG = 4 * hatchColour;
          nB = 4 * hatchColour;
        }
      }
      if (lum < t3) {
        if ((x + y - 5) % mod === 0) {
          nR = 4 * hatchColour;
          nG = 4 * hatchColour;
          nB = 4 * hatchColour;
        }
      }
      if (lum < t4) {
        if ((x - y - 5) % mod === 0) {
          nR = 8 * hatchColour;
          nG = 8 * hatchColour;
          nB = 8 * hatchColour;
        }
      }
      res.push(nR);
      res.push(nG);
      res.push(nB);
      res.push(255);
    }
  }

  return new ImageData(new Uint8ClampedArray(res), img.width, img.height);
};

export const fishEyeFilter = (img:ImageData, mw: number, mh: number): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const result: number[] = [];
  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      const dx = x - mw;
      const dy = y - mh;
      const r = Math.sqrt(dx * dx + dy * dy);
      
      if (r < 60) {
        const u = Math.floor(mw + dx * 0.015 * r);
        const v = Math.floor(mh + dy * 0.015 * r);
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

// Derivied from https://www.codeproject.com/Articles/471994/OilPaintEffect
export const painterlyFilter = (img: ImageData, radius: number, intensity: number): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;

  const dataOut = new Uint8ClampedArray(img.data);

  for(let y = radius; y < h - radius; y++) {
    for(let x = radius; x < w - radius; x++) {

      const counter = [];
      const sumR = [];
      const sumG = [];
      const sumB = [];
      for (let i = 0; i < intensity; i++) {
        counter.push(0);
        sumR.push(0);
        sumG.push(0);
        sumB.push(0);
      }

      for (let cy = -radius; cy <= radius; cy++) {
        for (let cx = -radius; cx <= radius; cx++) {
          const index = channels * ((y + cy) * w + (x + cx));

          const r = img.data[index + 0];
          const g = img.data[index + 1];
          const b = img.data[index + 2];

          const currentIntensity = Math.floor((( r + g + b) / 3.0) * intensity / 255);
          counter[currentIntensity] ++;
          sumR[currentIntensity] += r;
          sumG[currentIntensity] += g;
          sumB[currentIntensity] += b;
        }
      }

      // Apply effect
      let tmp = 0;
      let maxIndex = 0;
      for (let i = 0; i < intensity; i++) {
        if (counter[i] > tmp) {
          tmp = counter[i];
          maxIndex = i;
        }
      }
      const index = channels * (y * w + x);
      dataOut[index + 0] = sumR[maxIndex] / tmp;
      dataOut[index + 1] = sumG[maxIndex] / tmp;
      dataOut[index + 2] = sumB[maxIndex] / tmp;
    }
  } 

  return new ImageData(dataOut, w, h);
};
