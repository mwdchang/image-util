import { sampleBilinear } from "./core";

/**
 * cx, cy - center of symmetry
 * segments - num mirrored slices
**/
export const kaleidoscopeFilter = (src: ImageData, cx: number, cy: number, segments = 6) => {
  const { width, height } = src;
  const out = new ImageData(width, height);

  const angleStep = (2 * Math.PI) / segments;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let dx = x - cx;
      let dy = y - cy;
      let theta = Math.atan2(dy, dx);
      let r = Math.sqrt(dx*dx + dy*dy);

      // Mirror the angle into one segment
      theta = theta % angleStep;              // angle within segment
      theta = Math.abs(theta - angleStep/2);  // fold for symmetry

      const sx = cx + r * Math.cos(theta);
      const sy = cy + r * Math.sin(theta);

      const color = sampleBilinear(src, sx, sy);
      const id = (y * width + x) * 4;
      out.data[id]     = color[0];
      out.data[id + 1] = color[1];
      out.data[id + 2] = color[2];
      out.data[id + 3] = color[3];
    }
  }
  return out;
}

