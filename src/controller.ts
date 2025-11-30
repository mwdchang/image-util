export const newWorker = () => {
  // create a fresh Worker each time
  const worker = new Worker(new URL('worker.js', import.meta.url));

  // Map to store pending promises for this worker
  const pending = new Map<number, (data: any) => void>();
  let nextId = 0;

  // Handle messages from this worker
  worker.onmessage = (e) => {
    const { id, result } = e.data;
    const resolve = pending.get(id);
    if (resolve) {
      resolve(result);
      pending.delete(id);
    }
  };

  worker.onerror = (e) => {
    console.error('Worker error', e);
  };

  const call = (filter: string, imageData?: ImageData, params: any[] = []) => {
    return new Promise((resolve) => {
      const id = nextId++;
      pending.set(id, resolve);

      worker.postMessage({ id, filter, imageData, params });
    });
  };

  return new Proxy({}, {
    get: (_target, prop: string) => {
      return (imageData?: ImageData, ...args: any[]) =>
        call(prop, imageData, args);
    }
  });



  // // Function to call a filter on this worker
  // const call = (filter: string, imageData?: ImageData, options?: any) => {
  //   return new Promise((resolve) => {
  //     const id = nextId++;
  //     pending.set(id, resolve);
  //     worker.postMessage({ id, filter, imageData, options });
  //   });
  // };

  // // Return a proxy so you can call filters like worker.blur(img, opts)
  // return new Proxy({}, {
  //   get: (_target, prop: string) => {
  //     return (imageData?: ImageData, options?: any) => call(prop, imageData, options);
  //   }
  // });
};


/*
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
*/
