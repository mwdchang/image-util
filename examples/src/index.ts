import { loadImage, transformFilter } from '../../src/core';
import { dodgeFilter } from '../../src';
import { greyScaleFilter } from '../../src';
import { invertFilter } from '../../src';
import {  uniformBlur } from '../../src/blur';
import { glowFilter } from '../../src';
import { sobelFilter, embossFilter } from '../../src/edges';
import { painterlyFilter } from '../../src';
import { fishEyeFilter } from '../../src';
import { hatchFilter } from '../../src';
import { gridFilter } from '../../src';
import { 
    browniFilter,
  kodakChromeFilter, polaroidfilter, sepiaFilter, vintageFilter
} from '../../src/colours';
import { SLIC } from '../../src/slic';
import { shearFilter } from '../../src/shear';
import { halftoneFilter } from '../../src/halftone';
import { SketchOptions, sketchTransform } from '../../src/sketch';
import { treemap } from 'd3';

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
  const rose = await loadImage('example.png', { width: 490, height: 482 });
  const fern = await loadImage('example2.png', { width: 190, height: 140 });
  const tree = await loadImage('example3.jpg', { width: 190, height: 140 });
  const boat = await loadImage('example4.jpeg', { width: 190, height: 170 });

  // Basic
  /*
  addExample(austin);
  addExample(invertFilter(austin));
  addExample(transformFilter(austin, d => {
    const v = (d.r + d.g + d.b) / 3.0;
    if (d.r > 100 && d.b < 100 && d.g < 100) {
      return d;
    }
    return {
      r: v,
      g: v,
      b: v,
      a: d.a
    };
  }));
  */


  

  // First row
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
  document.body.append(document.createElement('br'));



  // Second row
  document.body.append(document.createElement('br'));
  addExample(fern);

  const vintage = vintageFilter(fern);
  addExample(vintage);

  const polaroid = polaroidfilter(fern);
  addExample(polaroid);

  const browni = browniFilter(fern);
  addExample(browni);

  const kodak = kodakChromeFilter(fern);
  addExample(kodak);


  // Third row
  document.body.append(document.createElement('br'));
  addExample(tree);

  const sepia = sepiaFilter(tree);
  addExample(sepia);

  const glow = glowFilter(tree);
  addExample(glow);

  const fishEye= fishEyeFilter(tree, 90, 60, 90, 0.0105);
  addExample(fishEye);

  const sobel = sobelFilter(tree);
  addExample(sobel);

  
  // Fourth row
  document.body.append(document.createElement('br'));

  addExample(boat);

  const invert = invertFilter(boat);
  addExample(invert);

  const slic2 = SLIC(boat, 12, 18, 4, 80);
  addExample(slic2);

  const shift = shearFilter(boat, 15, 20, 15, 5);
  addExample(shift);


  // Test test
  // const sketcherCanvas = createCanvas(boat);
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

  const sketch = sketchTransform(boat, options);
  addExample(sketch);
  
  /*
  document.body.append(document.createElement('br'));
  addExample(sketch[0]['0']['-1']);
  addExample(sketch[0]['0']['0']);
  addExample(sketch[0]['0']['1']);
  addExample(sketch[0]['0']['2']);

  document.body.append(document.createElement('br'));
  addExample(sketch[1]['0']['-1']);
  addExample(sketch[1]['0']['0']);
  addExample(sketch[1]['0']['1']);
  addExample(sketch[1]['0']['2']);

  document.body.append(document.createElement('br'));
  addExample(sketch[2]['0']['-1']);
  addExample(sketch[2]['0']['0']);
  addExample(sketch[2]['0']['1']);
  addExample(sketch[2]['0']['2']);
  */
};

runExample();

