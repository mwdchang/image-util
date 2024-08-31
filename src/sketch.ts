// https://github.com/geraintluff/canvas-sketch/blob/master/sketch.js
export interface SketchOptions {
  levelSteps: number;
  lineThickness: number;
  lineLength: number;
  lineAlpha: number;
  lineDensity: number;
  darkeningFactor: number;
  lightness: number;
  edgeAmount: number;
  edgeBlurAmount: number;
  greyScale: boolean;
}

/*
var Sketcher = (function() {
  function Sketcher(width: number, height: number) {
    this.levelSteps = 2;
    this.textureCanvases = null;

    this.lineThickness = 1;
    this.maxTextures = NaN;
    this.lineLength = Math.sqrt(width * height) * 0.2;
    this.darkeningFactor = 0.1;
    this.lineAlpha = 0.1;
    this.lineDensity = 0.5;

    this.lightness = 4;

    this.edgeBlurAmount = 4;
    this.edgeAmount = 0.5;
  }

  return Sketcher;
})();
*/

export const sketchTransform = (img: ImageData, options: SketchOptions) => {
  const width = img.width;
  const height = img.height;
  const pixels = img.data;

  const colourSet = new Set<string>();
  const pixelCodes: number[][] = [];

  // Get unique colours
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = (x + y * width) * 4;
      const pixelCode = pixels[index] + ':' + pixels[index + 1] + ':' + pixels[index + 2];

      if (!colourSet.has(pixelCode)) {
        colourSet.add(pixelCode);
        pixelCodes.push(
          [pixels[index + 0], pixels[index + 1], pixels[index + 2]]
        )
      }
    }
  }

  let requiredColours = {};
  while (true) {
    const levelSteps = options.levelSteps;

    requiredColours = {};
    for (const pixelCode of pixelCodes) {
      const red = pixelCode[0];
      const green = pixelCode[1];
      const blue = pixelCode[2];

      const redIndex = Math.round(red / 255 * (levelSteps - 1));
      const greenIndex = Math.round(green / 255 * (levelSteps - 1));
      const blueIndex = Math.round(blue / 255 * (levelSteps - 1));
      for (let ri = -1; ri <= 1; ri++) {
        for (let gi = -1; gi <= 1; gi++) {
          for (let bi = -1; bi <= 1; bi++) {
            const key = (redIndex + ri) + ':' + (greenIndex + gi) + ':' + (blueIndex + bi);
            requiredColours[key] = true;
          }
        }
      }
    }
    const maxTextures = NaN;
    if (Object.keys(requiredColours).length > maxTextures && options.levelSteps > 2) {
      options.levelSteps--;
      console.log('Reducing to ' + options.levelSteps + ' RGB steps');
      continue;
    }
    break;
  }
  const { canvases, imageDatas } = createTextures(width, height, requiredColours, options);
  return transformCanvasInner(img, imageDatas, options);
}


const transformCanvasInner = (
  img: ImageData,
  imageDatas: any[],
  options: SketchOptions
) => {
  const width = img.width;
  const height = img.height;
  const pixels = img.data;

  let edges = [];
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = x + y * width;
      edges[index * 3] = pixels[index * 4];
      edges[index * 3 + 1] = pixels[index * 4 + 1];
      edges[index * 3 + 2] = pixels[index * 4 + 2];
    }
  }
  edges = calculateStandardDeviation(edges, {
    width: width,
    height: height,
    blurAmount: options.edgeBlurAmount
  });

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = x + y * width;
      const red = pixels[index * 4];
      const green = pixels[index * 4 + 1];
      const blue = pixels[index * 4 + 2];
      const rgb = getPixel(
        imageDatas, index, red, green, blue, options.levelSteps
      );

      if (options.greyScale) {
        const value = Math.round((rgb.red + rgb.green + rgb.blue) / 3);
        rgb.red = rgb.green = rgb.blue = value;
      }

      let edgeFactor = Math.max(0, (255 - edges[x + y * width] * options.edgeAmount) / 255);
      edgeFactor = Math.min(1, Math.max(0.5, edgeFactor * edgeFactor));
      pixels[index * 4] = Math.round(rgb.red * edgeFactor);
      pixels[index * 4 + 1] = Math.round(rgb.green * edgeFactor);
      pixels[index * 4 + 2] = Math.round(rgb.blue * edgeFactor);
    }
  }
  return img;
}


const createTextures = (
  width: number,
  height: number,
  requiredColours: { [key: string]: boolean },
  options: SketchOptions
) => {
  let start = performance.now();
  const steps = options.levelSteps;
  const canvases = [];
  const imageDatas = [];

  const thickness = options.lineThickness;
  const length = options.lineLength;
  const darkeningFactor = 1 - options.darkeningFactor;
  const alpha = options.lineAlpha;
  const densityFactor = options.lineDensity * 2;
  const lightness = options.lightness;

  for (let ri = -1; ri <= steps; ri++) {
    canvases[ri] = {};
    imageDatas[ri] = {};
    for (let gi = -1; gi <= steps; gi++) {
      canvases[ri][gi] = {};
      imageDatas[ri][gi] = {};
    }
  }

  for (let key in requiredColours) {
    const parts = key.split(':');
    const ri = parseInt(parts[0]);
    const gi = parseInt(parts[1]);
    const bi = parseInt(parts[2]);
    let red = 255 * ri / (steps - 1);
    let green = 255 * gi / (steps - 1);
    let blue = 255 * bi / (steps - 1);

    red = Math.min(255, Math.max(0, red));
    green = Math.min(255, Math.max(0, green));
    blue = Math.min(255, Math.max(0, blue));

    const minimum = 1 - Math.min(red, green, blue) / 255;
    let colour = '';
    if (minimum > 0) {
      const scaling = Math.pow(1 / minimum, 1.0 / lightness);
      const displayRed = Math.round((255 - (255 - red) * scaling) * darkeningFactor);
      const displayGreen = Math.round((255 - (255 - green) * scaling) * darkeningFactor);
      const displayBlue = Math.round((255 - (255 - blue) * scaling) * darkeningFactor);
      colour = `rgb(${displayRed}, ${displayGreen}, ${displayBlue})`;
    } else {
      const displayRed = Math.round(red * darkeningFactor);
      const displayGreen = Math.round(green * darkeningFactor);
      const displayBlue = Math.round(blue * darkeningFactor);
      colour = `rgb(${displayRed}, ${displayGreen}, ${displayBlue})`;
    }

    let saturation = 0;
    let hue = 0;
    if (Math.abs(green - blue) > 0.1 || Math.abs(2 * red - green - blue) > 0.1) {
      hue = Math.atan2(Math.sqrt(3) * (green - blue), 2 * red - green - blue);
      const maxRgb = Math.max(255 - red, 255 - green, 255 - blue);
      const minRgb = Math.min(255 - red, 255 - green, 255 - blue)
      saturation = (maxRgb - minRgb) / maxRgb;
      if (saturation == 0) {
        hue = Math.random() * Math.PI * 2;
      }
    } else {
      hue = 0;
      saturation = 0;
    }

    const angleVariation = Math.PI * (0.1 + 0.9 * Math.pow(1 - saturation, 3));
    const canvas = directionalStrokes(
      width,
      height,
      hue / 2 + Math.PI * 0.3,
      angleVariation,
      thickness,
      length,
      minimum * densityFactor,
      colour,
      alpha);

    canvases[ri][gi][bi] = canvas;
    imageDatas[ri][gi][bi] = canvas.getContext('2d').getImageData(0, 0, width, height);
  }

  let end = performance.now();
  console.log('create textures....', (end - start));

  return {
    canvases, imageDatas
  }
}


const getPixel = (
  imageDatas,
  pixelIndex: number,
  r: number,
  g: number,
  b: number,
  levelSteps: number
) => {
  pixelIndex *= 4;
  let redIndex = r / 255 * (levelSteps - 1);
  let greenIndex = g / 255 * (levelSteps - 1);
  let blueIndex = b / 255 * (levelSteps - 1);

  const redBlend = redIndex;
  const greenBlend = greenIndex;
  const blueBlend = blueIndex;
  redIndex = Math.round(redIndex);
  greenIndex = Math.round(greenIndex);
  blueIndex = Math.round(blueIndex);

  let blendTotal = 0;
  for (let ri = -1; ri <= 1; ri++) {
    for (let gi = -1; gi <= 1; gi++) {
      for (let bi = -1; bi <= 1; bi++) {
        const blend = (0.75 - Math.abs(redIndex + ri - redBlend) / 2)
          * (0.75 - Math.abs(greenIndex + gi - greenBlend) / 2)
          * (0.75 - Math.abs(blueIndex + bi - blueBlend) / 2);
        if (blend < 0) {
          throw new Error('debug');
        }
        blendTotal += blend;
      }
    }
  }

  let red = 0;
  let green = 0;
  let blue = 0;
  for (let ri = -1; ri <= 1; ri++) {
    for (let gi = -1; gi <= 1; gi++) {
      for (let bi = -1; bi <= 1; bi++) {
        let blend = (0.75 - Math.abs(redIndex + ri - redBlend) / 2)
          * (0.75 - Math.abs(greenIndex + gi - greenBlend) / 2)
          * (0.75 - Math.abs(blueIndex + bi - blueBlend) / 2);
        blend /= blendTotal

        const imageData = imageDatas[redIndex + ri][greenIndex + gi][blueIndex + bi];
        if (imageData == undefined) {
          throw new Error('debug me!');
        }
        red += imageData.data[pixelIndex] * blend;
        green += imageData.data[pixelIndex + 1] * blend;
        blue += imageData.data[pixelIndex + 2] * blend;
      }
    }
  }
  const brighteningFactor = 1 - (1 - (levelSteps + 1) / levelSteps) * 0.25;
  return {
    red: Math.min(255, Math.round(red * brighteningFactor)),
    green: Math.min(255, Math.round(green * brighteningFactor)),
    blue: Math.min(255, Math.round(blue * brighteningFactor))
  };
}


const directionalStrokes = (
  width: number,
  height: number,
  angle: number,
  angleVariation: number,
  thickness: number,
  length: number,
  density: number,
  lineStyle: string,
  alpha: number
) => {
  const count = density * width * height / length / thickness / alpha;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.strokeStyle = lineStyle;
  context.globalAlpha = 1;
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, width, height);
  context.globalAlpha = alpha;
  context.lineWidth = thickness;
  for (let i = 0; i < count; i++) {
    const lineAngle = angle + Math.round(Math.random() * 2 - 1) / 2 * angleVariation;
    const midX = Math.random() * width;
    const midY = Math.random() * height;
    const deltaX = length / 2 * Math.cos(lineAngle);
    const deltaY = length / 2 * Math.sin(lineAngle);
    const startX = midX + deltaX;
    const endX = midX - deltaX;
    const startY = midY + deltaY;
    const endY = midY - deltaY;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
  }
  return canvas;
}


interface SDOptions {
  width: number;
  height: number;
  blurAmount: number;
}
const calculateStandardDeviation = (inputRgb, options: SDOptions) => {
  const width = options.width;
  const height = options.height;
  const blurAmount = options.blurAmount;

  const vsum = [];
  const vsum2 = [];
  for (let x = 0; x < width; x++) {
    const totals = [0, 0, 0];
    const totals2 = [0, 0, 0];
    for (let y = 0; y < height; y++) {
      const index = x + y * width;
      totals[0] += inputRgb[index * 3 + 0];
      totals[1] += inputRgb[index * 3 + 1];
      totals[2] += inputRgb[index * 3 + 2];
      totals2[0] += inputRgb[index * 3 + 0] * inputRgb[index * 3 + 0];
      totals2[1] += inputRgb[index * 3 + 1] * inputRgb[index * 3 + 1];
      totals2[2] += inputRgb[index * 3 + 2] * inputRgb[index * 3 + 2];
      vsum[index] = totals.slice(0);
      vsum2[index] = totals2.slice(0);
    }
  }
  const hsum = [];
  const hsum2 = [];
  for (let y = 0; y < height; y++) {
    const totals = [0, 0, 0];
    const totals2 = [0, 0, 0];
    for (let x = 0; x < width; x++) {
      const index = x + y * width;
      const startIndex = x + Math.max(0, Math.round(y - blurAmount / 2)) * width;
      const endIndex = x + Math.min(height - 1, Math.round(y + blurAmount / 2)) * width;
      totals[0] += (vsum[endIndex][0] - vsum[startIndex][0]) / (endIndex - startIndex) * width;
      totals[1] += (vsum[endIndex][1] - vsum[startIndex][1]) / (endIndex - startIndex) * width;
      totals[2] += (vsum[endIndex][2] - vsum[startIndex][2]) / (endIndex - startIndex) * width;
      totals2[0] += (vsum2[endIndex][0] - vsum2[startIndex][0]) / (endIndex - startIndex) * width;
      totals2[1] += (vsum2[endIndex][1] - vsum2[startIndex][1]) / (endIndex - startIndex) * width;
      totals2[2] += (vsum2[endIndex][2] - vsum2[startIndex][2]) / (endIndex - startIndex) * width;
      hsum[index] = totals.slice(0);
      hsum2[index] = totals2.slice(0);
    }
  }
  const sd = [];
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = x + y * width;
      const startIndex = Math.max(0, Math.round(x - blurAmount / 2)) + y * width;
      const endIndex = Math.min(width - 1, Math.round(x + blurAmount / 2)) + y * width;
      const avgR = (hsum[endIndex][0] - hsum[startIndex][0]) / (endIndex - startIndex);
      const avgG = (hsum[endIndex][1] - hsum[startIndex][1]) / (endIndex - startIndex);
      const avgB = (hsum[endIndex][2] - hsum[startIndex][2]) / (endIndex - startIndex);
      const avgR2 = (hsum2[endIndex][0] - hsum2[startIndex][0]) / (endIndex - startIndex);
      const avgG2 = (hsum2[endIndex][1] - hsum2[startIndex][1]) / (endIndex - startIndex);
      const avgB2 = (hsum2[endIndex][2] - hsum2[startIndex][2]) / (endIndex - startIndex);
      sd[index] = Math.sqrt((avgR2 + avgG2 + avgB2) - (avgR * avgR + avgG * avgG + avgB * avgB));
      if (isNaN(sd[index])) {
        sd[index] = 0;
      }
    }
  }
  return sd;
}
