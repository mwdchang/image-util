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
};

self.onmessage = (e: any) => {
  const { id, filter, imageData, params } = e.data;

  console.log('[worker] started', params);
  if (filter === 'xyz') {
    console.log('I am done...');
    self.postMessage({ id, result: 'done done'});
    return;
  }

  if (filters[filter]) {
    const result = filters[filter](imageData, ...params);
    self.postMessage({ id, result });
  }
};
