import { rgbToHsv, transformFilter } from "./core";

export interface SplashOption {
  bands: {
    hueMin: number;
    hueMax: number;
    valueMax: number;
  }[]
}

export const colourSplash = (image: ImageData, options: SplashOption): ImageData => {
  let cnt = 0;
  return transformFilter(image, (d) => {
    const r = d.r;
    const g = d.g;
    const b = d.b;
    const { h, s, v }= rgbToHsv(r / 255, g / 255, b / 255);


    let keepColour = false;
    for (const band of options.bands) {
      // Keep pixel if hue inside range AND below valueMax
      const inHue = h >= band.hueMin / 360 && h <= band.hueMax / 360;
      const inValue = v <= band.valueMax;
      keepColour = inHue && inValue;

      if (keepColour) break;
    }

    if (!keepColour) {
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      return {
        r: Y,
        g: Y,
        b: Y,
        a: d.a
      }
    } else {
      return d;
    }
  });
}
