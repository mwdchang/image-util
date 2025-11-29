// hack for dev this is build ahead of time
const worker = new Worker(new URL('worker.js', import.meta.url));
// const worker = new Worker(new URL('worker.ts', import.meta.url), { type: 'module' });

const call = (filter: string, imageData: ImageData, options: any) => {
  return new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      resolve(e.data);
    };
    worker.onerror = (e) => {
      reject(e);
    };
    worker.postMessage({
      filter,
      imageData,
      options,
    });
  });
};

export const newWorker = () => {
  return new Proxy({}, {
    get: (target, prop: string) => {
      return (imageData: ImageData, options: any) => {
        return call(prop, imageData, options);
      };
    }
  });
};
