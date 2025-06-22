// Simulate a halftone looking filter
// const grayscale = ({r, g, b}) => { // in 0..255
//   return 0.2 * r/255 + 
//     0.7 * g/255 + 
//     0.1 * b/255;
// }

interface HalftoneOptions {
  kernel: number;
  shiftXStride?: number;
  shiftXAmt?: number;
  shiftYStride?: number;
  shiftYAmt?: number;
  rWeight?: number;
  gWeight?: number;
  bWeight?: number;
}

const rgb = (r: number, g: number, b: number) => `rgb(${r},${g},${b})`;

const sample = (
  imageData: ImageData,
  x: number,
  y: number,
  options: HalftoneOptions
) => {
  const { width, data } = imageData;
  const kernel = options.kernel;
  const size = kernel * kernel; 

  let r = 0;
  let g = 0;
  let b = 0;

  for (let i = y; i < y + kernel; i++) {
    for (let j = x; j < x + kernel; j++) {
      const at = (i * width + j) * 4; 
      r += data[at] || 0;
      g += data[at + 1] || 0;
      b += data[at + 2] || 0;
    }
  }

  let v = (options.rWeight * r + options.gWeight * g + options.bWeight * b) / (255 * size);
  let avgR = r / (size);
  let avgG = g / (size);
  let avgB = b / (size);
  return { v, avgR, avgG, avgB };
}

export const halftoneFilter= (
  img: ImageData, 
  options: HalftoneOptions
) => {
  const kernel = options.kernel
  const w = img.width;
  const h = img.height;

  if (!options.rWeight) options.rWeight = 0.2;
  if (!options.gWeight) options.gWeight = 0.2;
  if (!options.bWeight) options.bWeight = 0.2;

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height; 
  const context = canvas.getContext('2d');

  const halfKernel = (kernel - 1) * 0.5;

  for (let y = 0; y <= h - kernel; y += kernel) {
    for (let x = 0; x <= w - kernel; x += kernel) {
      const { v, avgR, avgG, avgB } = sample(img, x, y, options);
      const r = (kernel/2) * (1 - v);

      let shiftY = 0;
      if (options.shiftYAmt && options.shiftYStride) {
        shiftY = x % (options.shiftYStride * kernel) === 0 ? 0 : options.shiftYAmt;
      }
      let shiftX = 0;
      if (options.shiftXAmt && options.shiftXStride) {
        shiftY = x % (options.shiftXStride * kernel) === 0 ? 0 : options.shiftXAmt;
      }
      
      context.beginPath();
      context.fillStyle = rgb(avgR, avgG, avgB);
      context.ellipse(
        shiftX +x + halfKernel, 
        shiftY + y + halfKernel,
        r, r,
        0, 0, 2 * Math.PI);
      context.fill();
      context.closePath();  
    }
  }
  return context.getImageData(0, 0, w, h);
}
