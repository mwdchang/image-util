export const polaroidCollageFilter = (img: ImageData, num: number): ImageData => {
  const w = img.width;
  const h = img.height;
  const channels = 4;


  const r: number[] = [];
  for (let i = 0; i < img.data.length; i++) {
    const v = i % channels === 3 ? img.data[i] : img.data[i] / 4;
    r.push(v);
    // r.push(img.data[i]);
  }

  const RAD = Math.PI / 180.0;
  const BORDER = 4;

  for (let i = 0; i < num; i++) {
    const sx = Math.floor(Math.random() * w);
    const sy = Math.floor(Math.random() * h);
    const size = 35 + Math.floor(Math.random() * 40);
    const angle = Math.random() * 340;

    for (let xidx = -size; xidx < size; xidx += 0.5) {
      for (let yidx = -size; yidx < size; yidx += 0.5) {
        // Calculate coordinate after rotation
        const jitter = Math.random() * 0.11;
        const xrot = xidx * Math.cos(angle * RAD) - yidx * Math.sin(angle * RAD);
        const yrot = xidx * Math.sin(angle * RAD) + yidx * Math.cos(angle * RAD);

        const px = Math.round(sx + xrot + jitter); 
        const py = Math.round(sy + yrot + jitter);

        if (px < 0 || px >= w) continue;
        if (py < 0 || py >= h) continue;

        // Sampling logic
        if (xidx < -size + BORDER || xidx > size - BORDER) {
          r[channels * (px * w + py) + 0] = 230;
          r[channels * (px * w + py) + 1] = 230;
          r[channels * (px * w + py) + 2] = 230;
          r[channels * (px * w + py) + 3] = 255;
        } else if (yidx < -size + 2 * BORDER || yidx > size - BORDER) {
          r[channels * (px * w + py) + 0] = 230;
          r[channels * (px * w + py) + 1] = 230;
          r[channels * (px * w + py) + 2] = 230;
          r[channels * (px * w + py) + 3] = 255;
        } else {
          r[channels * (px * w + py) + 0] = img.data[channels * (px * w + py) + 0]; 
          r[channels * (px * w + py) + 1] = img.data[channels * (px * w + py) + 1]; 
          r[channels * (px * w + py) + 2] = img.data[channels * (px * w + py) + 2]; 
          r[channels * (px * w + py) + 3] = 255;
        }
      }
    }
  }


  return new ImageData(
    new Uint8ClampedArray(r),
    w,
    h
  );
}
