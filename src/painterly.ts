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
