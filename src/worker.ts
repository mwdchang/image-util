/// <reference lib="webworker" />

import * as allthings from './index';

// List of things to exclude from webworker
// not great, but things don't really change very much
// so just hardwire here.
const excluded = new Set([
  'createCanvas',
  'loadImage',
  'sampleBilinear',
  'rgbToHsv',
  'rgbToLab',
  'computePixel',
  'findLocalMinimum'
]);

const filters: { [key: string]: Function } = Object.fromEntries(
  Object.entries(allthings)
    .filter(([name, value]) =>
      typeof value === 'function' && !excluded.has(name)
    )
    .map(([name, value]) => [name, value as Function])
);
console.log('Discovered filters:', filters);


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

