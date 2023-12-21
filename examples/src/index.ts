import { loadImage, greyScale, invert, dodge } from '../../src/core';
import {  uniformBlur, glowFilter } from '../../src/blur';
import { sobelFilter, embossFilter } from '../../src/edges';
import { painterlyFilter, fishEyeFilter, hatchFilter, gridFilter } from '../../src/effects';
import { 
  kodakChromeFilter, polaroidfilter, sepiaFilter, vintageFilter
} from '../../src/colours';
import { SLIC } from '../../src/slic';
import { shearAll } from '../../src/shear';

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
  const rose = await loadImage('example.png', { width: 180, height: 170 });
  const fern = await loadImage('example2.png', { width: 180, height: 130 });
  const tree = await loadImage('example3.jpg', { width: 180, height: 130 });
  const boat = await loadImage('example4.jpeg', { width: 180, height: 160 });

  // First row
  addExample(rose);

  const d = dodge(
    invert(uniformBlur(greyScale(rose), 7)),
    greyScale(rose)
  ); 
  addExample(d);

  const painterly = painterlyFilter(rose, 4, 10);
  addExample(painterly);

  const emboss = embossFilter(rose);
  addExample(emboss);

  const hatch = hatchFilter(rose, 1.0, 0.75, 0.5, 0.35);
  addExample(hatch);


  // Second row
  document.body.append(document.createElement('br'));
  addExample(fern);

  const vintage = vintageFilter(fern);
  addExample(vintage);

  const polaroid = polaroidfilter(fern);
  addExample(polaroid);

  const grid = gridFilter(fern, 5, 2);
  addExample(grid);

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

  const slic2 = SLIC(boat, 12, 18, 4, 80);
  addExample(slic2);

  const shift = shearAll(boat, 2, 10, 2, 10);
  addExample(shift);


};

runExample();

