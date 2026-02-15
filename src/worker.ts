/// <reference lib="webworker" />

import * as blur from './blur';
import * as colourSplash from './colour-splash';
import * as colours from './colours';
import * as dodge from './dodge';
import * as edges from './edges';
import * as fisheye from './fisheye';
import * as gaussianBlur from './gaussian-blur';
import * as glow from './glow';
import * as greyscale from './greyscale';
import * as grid from './grid';
import * as halftone from './halftone';
import * as hatch from './hatch';
import * as invert from './invert';
import * as kaleidoscope from './kaleidoscope';
import * as motionBlur from './motion-blur';
import * as painterly from './painterly';
import * as radialBlur from './radial-blur';
import * as shear from './shear';
import * as sketch from './sketch';
import * as swirl from './swirl';
import * as slic  from './slic';
import * as polaroidCollage from './polaroid.ts';

const filters: { [key: string]: Function } = {
  ...blur,
  ...colourSplash,
  ...colours,
  ...dodge,
  ...edges,
  ...fisheye,
  ...gaussianBlur,
  ...glow,
  ...greyscale,
  ...grid,
  ...halftone,
  ...hatch,
  ...invert,
  ...kaleidoscope,
  ...motionBlur,
  ...painterly,
  ...radialBlur,
  ...shear,
  ...sketch,
  ...swirl,
  ...slic,
  ...polaroidCollage
};

let workerName = '';

self.onmessage = (e: any) => {
  const { id, filter, imageData, params, type, name } = e.data;

  if (type && type === 'init' && name) {
    workerName = name;
    return;
  }

  console.log(`[worker: ${workerName}] started with ${filter}`, params);
  if (filter === 'xyz') {
    console.log('I am done...');
    //self.postMessage({ id, result: 'done done'});
    self.postMessage({ id, buffer: null, width: 0, height: 0 });
    return;
  }

  if (filters[filter]) {
    const result = filters[filter](imageData, ...params);
    console.log(`[worker: ${workerName}] finished with ${filter}`);

    self.postMessage({ 
      id, 
      buffer: result.data.buffer,
      width: result.width,
      height: result.height,
    }, [result.data.buffer]);
  } else {
    console.error(`${filter} not found`);
  }

  /*
  if (filters[filter]) {
    const result = filters[filter](imageData, ...params);
    self.postMessage({ 
      id, 
      result
    });
  }
  */
};


// console.log("worker global is Worker?", typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope);

