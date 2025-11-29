import { loadImage, transformFilter } from '../../src/core';
import { dodgeFilter } from '../../src';
import { greyScaleFilter } from '../../src';
import { invertFilter } from '../../src';
import {  uniformBlur } from '../../src/blur';
import { sobelFilter, embossFilter } from '../../src/edges';
import { painterlyFilter } from '../../src';
import { fishEyeFilter } from '../../src';
import { hatchFilter } from '../../src';
import { SLIC } from '../../src/slic';
import { halftoneFilter } from '../../src/halftone';
import { SketchOptions, sketchTransform } from '../../src/sketch';

const createCanvas = (img: ImageData) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height; 
  const context = canvas.getContext('2d');
  context.putImageData(img, 0, 0);
  return canvas;
};

const addExample = (image: ImageData): void => {
  const canvas = createCanvas(image);
  document.body.append(canvas);
};

const runExample = async () => {
  const rose = await loadImage('example.png', { width: 400, height: 400 });
  const tree = await loadImage('example3.jpg', { width: 400, height: 300 });

  addExample(rose);

  const dodge = dodgeFilter(
    invertFilter(uniformBlur(greyScaleFilter(rose), 7)),
    greyScaleFilter(rose)
  ); 
  addExample(dodge);

  const painterly = painterlyFilter(rose, 4, 10);
  addExample(painterly);

  const emboss = embossFilter(rose);
  addExample(emboss);

  const hatch = hatchFilter(rose, 1.0, 0.75, 0.5, 0.35);
  addExample(hatch);

  const halftone = halftoneFilter(rose, {
    kernel: 11,
    shiftXAmt: 2,
    shiftXStride: 2
  });
  addExample(halftone);


  // Third row
  addExample(tree);

  const fishEye= fishEyeFilter(tree, 90, 60, 90, 0.0105);
  addExample(fishEye);

  const sobel = sobelFilter(tree);
  addExample(sobel);

  const slic2 = SLIC(structuredClone(tree), 12, 18, 4, 80);
  addExample(slic2);

  
  // Test test
  const options: SketchOptions = {
    levelSteps: 2,
    lineThickness: 2.5,
    lineLength: 80,
    lineAlpha: 0.1,
    lineDensity: 0.3,
    darkeningFactor: 0.1,
    lightness: 4,
    edgeAmount: 0.2,
    edgeBlurAmount: 4,
    greyScale: false
  };

  options.lineDensity = 0.2;
  options.lineThickness = 1.5;
  options.lineLength = 40;
  options.lineAlpha = 0.3;
  options.levelSteps = 3;

  options.edgeAmount = 1.0;
  options.edgeBlurAmount = 3;

  // const sketch = sketchTransform(structuredClone(tree), options);
  // addExample(sketch);


  const transform = transformFilter(tree, (d) => {
    return {
      r: 400 - d.r,
      g: d.x % 12 == 0 ? d.g : 120,
      b: 400 - d.x,
      a: d.a
    }
  });
  addExample(transform);
};

runExample();

