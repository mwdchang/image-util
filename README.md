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

