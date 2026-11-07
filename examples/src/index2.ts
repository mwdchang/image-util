import { loadImage } from '../../src/core';
import { newWorker } from '../../src';

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

const worker1: any = newWorker();
const worker2: any = newWorker();

const runExample = async () => {
  const rose = await loadImage('example.png', { width: 400, height: 400 });
  // const tree = await loadImage('example3.jpg', { width: 400, height: 300 });

  // Loading sync
  addExample(rose);

  // Loading asynchronously
  (async () => {
    const painterly = await worker1.painterlyFilter(rose, { radius: 4, intensity: 10 });
    addExample(painterly);
  })();

  (async () => {
    const im01 = await worker2.sobelFilter(rose);
    addExample(im01);
  })();

  (async () => {
    const emboss = await worker1.embossFilter(rose);
    addExample(emboss);
  })();

  (async () => {
    const hatch = await worker2.hatchFilter(rose, {
      t1: 1.0,
      t2: 0.75,
      t3: 0.5,
      t4: 0.35
    });
    addExample(hatch);
  })();

  (async () => {
    const p = await worker1.polaroidCollageFilter(rose, { num: 10 });
    addExample(p);
  })();

  (async () => {
    const p = await worker1.greyScaleFilter(rose);
    addExample(p);
  })();


  /*
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
  */
};

runExample();

