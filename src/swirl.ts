import { sampleBilinear } from "./core";

export const swirlFilter = (src: ImageData, cx: number, cy: number, radius: number, angle: number) => {
  const { width, height } = src;
  const out = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        const factor = (radius - dist) / radius; // stronger near center
        const theta = angle * factor;            // rotation angle
        const s = Math.sin(theta);
        const c = Math.cos(theta);

        const sx = cx + dx * c - dy * s;
        const sy = cy + dx * s + dy * c;

        const color = sampleBilinear(src, sx, sy);
        const id = (y * width + x) * 4;
        out.data[id]     = color[0];
        out.data[id + 1] = color[1];
        out.data[id + 2] = color[2];
        out.data[id + 3] = color[3];
      } else {
        const id = (y * width + x) * 4;
        const i = id;
        out.data[id]     = src.data[i];
        out.data[id + 1] = src.data[i + 1];
        out.data[id + 2] = src.data[i + 2];
        out.data[id + 3] = src.data[i + 3];
      }
    }
  }
  return out;
}

