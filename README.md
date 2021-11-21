# image-util
A collection of Javscript image manipulation utilties and effects filters.


## Usage example
```
const createCanvas = (img) => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.putImageData(img, 0, 0);
  return canvas;
};

const img = await loadImage('example.jpg', { width: 200, height: 200 });

// Cross-hatch effect
const hatch = hatchFilter(img, 1.0, 0.7, 0.5, 0.25);
const hatchCanvas = createCanvas(hatch);
document.body.append(hatchCanvas);


// Dodge burn effect
const burn = dodge(
  invert(uniformBlur(greyScale(img), 8)),
  greyScale(img)
);
const burnCanvas = createCanvas(burn);
document.body.append(burnCanvas);
```


## Build library
```
npm run build
```


## Run Examples
Runs on http://localhost:8090
```
npm run develop
```
