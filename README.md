# image-util
A collection of Javscript image manipulation utilties and effects filters.


![preview](preview.png)


## Usage example
Quickstart

```html
<script type="module">
import * as ImageUtil from "https://cdn.jsdelivr.net/gh/mwdchang/image-util@latest/dist/index.js"

const img = await ImageUtil.loadImage('https://picsum.photos/300', { width: 300, height: 300 });
document.body.append(ImageUtil.createCanvas(img));

const painterly = ImageUtil.painterlyFilter(img, 4, 10);
document.body.append(ImageUtil.createCanvas(painterly));

</script>
```

Composing filters, using matrix-mult, glow, and blur to simulate a nightvision filter
```js
const nightVision = ImageUtil.uniformBlur(
  ImageUtil.glowFilter(
    ImageUtil.nightVisionFilter(img)
  ), 6
);
document.body.append(ImageUtil.createCanvas(nightVision));
```


## Build library
The final files are under `build/dist/*`
```
npm run build
```

## Run Examples
Runs on http://localhost:8090
```
npm run develop
```

## Filters and effects

### Color Matrix Effects
3x3 color matrix transformations

- **Sepia**: Applies a sepia tone to the image.
- **Polaroid**: Simulates the look of a Polaroid picture.
- **Technicolor**: Mimics the Technicolor film effect.
- **Kodak Chrome**: Simulates the look of Kodak Chrome film.
- **Browni**: Applies a brownish tone to the image.
- **Vintage**: Gives the image a vintage look.
- **Night Vision**: Simulates a night vision effect.

### Convolutional Effects
Convolution related effects

- **Blur**: Applies a simple box blur to the image.
- **Gaussian Blur**: Applies a Gaussian blur to the image.
- **Edge Detection**: Detects the edges in the image.

### Pixel Transformation Effects
These filters manipulate the individual pixels of the image.

- **Greyscale**: Converts the image to greyscale.
- **Invert**: Inverts the colors of theimage.
- **Color Splash**: Converts the image to greyscale except for a selected color.

### Geometric Transformation Effects
Distortions

- **Fisheye**: Creates a fisheye lens effect.
- **Shear**: Shears the image.

### Stylistic Effects
Complex filters that produce a specific artistic style.

- **Dodge**: Creates a dodge effect.
- **Glow**: Adds a glow effect to the image.
- **Halftone**: Creates a halftone pattern effect.
- **Hatch**: Creates a hatching effect.
- **Painterly**: Creates a painterly effect.
- **Sketch**: Creates a sketch effect.

