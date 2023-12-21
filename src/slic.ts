// From https://github.com/xs7/Pixelate

export const rgb2lab = (sR: number, sG: number, sB: number) => {
  //rgb2xyz
  let R = sR / 255
  let G = sG / 255
  let B = sB / 255

  let r: number, g: number, b: number
  if (R <= 0.04045) r = R / 12.92
  else r = Math.pow((R + 0.055) / 1.055, 2.4)

  if (G <= 0.04045) g = G / 12.92
  else g = Math.pow((G + 0.055) / 1.055, 2.4)

  if (B <= 0.04045) b = B / 12.92
  else b = Math.pow((B + 0.055) / 1.055, 2.4)

  let X: number, Y: number, Z: number
  X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
  Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041

  //xyz2lab
  let epsilon = 0.008856        //actual CIE standard
  let kappa = 903.3             //actual CIE standard

  let Xr = 0.950456     //reference white
  let Yr = 1.0          //reference white
  let Zr = 1.088754     //reference white
  let xr = X / Xr
  let yr = Y / Yr
  let zr = Z / Zr

  let fx: number, fy: number, fz: number
  if (xr > epsilon) fx = Math.pow(xr, 1.0 / 3.0)
  else fx = (kappa * xr + 16.0) / 116.0

  if (yr > epsilon) fy = Math.pow(yr, 1.0 / 3.0)
  else fy = (kappa * yr + 16.0) / 116.0

  if (zr > epsilon) fz = Math.pow(zr, 1.0 / 3.0)
  else fz = (kappa * zr + 16.0) / 116.0

  const lval = 116.0 * fy - 16.0
  const aval = 500.0 * (fx - fy)
  const bval = 200.0 * (fy - fz)
  return { l: lval, a: aval, b: bval }
}

interface Center {
  x: number,
  y: number,
  l: number,
  a: number,
  b: number
}

export const findLocalMinimum = (img:ImageData, hpos: number, wpos: number) => {
  let min_grad = Number.MAX_VALUE;
  let loc_min: Center = { x: 0, y : 0, l: 0, a: 0, b: 0 };

  const width = img.width;
  const height = img.height;

  for (let i = hpos - 1; i <= hpos + 1 && i >= 0 && i < height - 1; i++) {
    for (let j = wpos - 1; j <= wpos + 1 && j >= 0 && j < width - 1; j++) {
      let i1 = img.data[4 * (i * width + j + 1)];        // right pixel
      let i2 = img.data[4 * ((i + 1) * width + j + 1)];  // bottom pixel
      let i3 = img.data[4 * (i * width + j)];            // self
      if (Math.sqrt(Math.pow(i1 - i3, 2)) + Math.sqrt(Math.pow(i2 - i3, 2)) < min_grad) {
        min_grad = Math.abs(i1 - i3) + Math.abs(i2 - i3)
        loc_min.x = i
        loc_min.y = j
      }
    }
  }
  return loc_min
}

const computeDist = (img: ImageData, center: Center, pixX: number, pixY: number, step: number, weight: number) => {
  const width = img.width;
  const dc = Math.sqrt(Math.pow(center.l - img.data[4 * (pixX * width + pixY)], 2)
      + Math.pow(center.a - img.data[4 * (pixX * width + pixY) + 1], 2)
      + Math.pow(center.b - img.data[4 * (pixX * width + pixY) + 2], 2));
  const ds = Math.sqrt(Math.pow(center.x - pixX, 2) + Math.pow(center.y - pixY, 2));

  return Math.pow(dc / weight, 2) + Math.pow(ds / step, 2)
}

// Initialize cluster centers by sampling pixels at regualr grid step 
export const computePixel = (img: ImageData, step: number, iters: number, weight: number) => {
  console.log("computing.............................")
  const width = img.width;
  const height = img.height;

  const clusterID = Array.from({ length: width * height }).map(item => item = -1);
  const centers = new Array();

  ////////////////////////////////////////////
  // FIXME: change imageArray from RGB to LAB
  ////////////////////////////////////////////
  
  for (let i = step; i < height; i += step) {
    for (let j = step; j < width; j += step) {
      let center = findLocalMinimum(img, i, j);
      center.l = (img.data)[4 * (center.x * width + center.y)];
      center.a = (img.data)[4 * (center.x * width + center.y) + 1];
      center.b = (img.data)[4 * (center.x * width + center.y) + 2];
      centers.push(center);
    }
  }

  // Interations
  for (let i = 0; i < iters; i++) {
    // minimum distance to centers 
    let distances = Array.from({ length: width * height }).map(item => item = Number.MAX_VALUE)

    for (let j = 0; j < centers.length; j++) {
      for (let m = centers[j].x - step; m < centers[j].x + step; m++) {
        for (let n = centers[j].y - step; n < centers[j].y + step; n++) {
          if (m >= 0 && m < height && n >= 0 && n < width) {
            // console.log(this.centers[j].x, this.centers[j].y, intStep)
            let d = computeDist(img, centers[j], m, n, step, weight)
            if (d < distances[m * width + n]) {
              distances[m * width + n] = d
              clusterID[m * width + n] = j
            }
          }
        }
      }
    }

    // FIXME: lodash
    let oldcenters = JSON.parse(JSON.stringify(centers));

    // clear old value
    for (let ele of centers) {
      ele.c = ele.l = ele.a = ele.b = ele.x = ele.y = 0;
    }

    // compute new cluster centers
    for (let j = 0; j < height; j++) {
      for (let k = 0; k < width; k++) {
        let c = clusterID[j * width + k]
        if (c != -1) {
          centers[c].l += img.data[4 * (j * width + k)];
          centers[c].a += img.data[4 * (j * width + k) + 1];
          centers[c].b += img.data[4 * (j * width + k) + 2];
          centers[c].x += j;
          centers[c].y += k;
          centers[c].c += 1;
        }
      }
    }

    for (let index in centers) {
      if (centers[index].c == 0 || centers[index].x == undefined || centers[index].y == undefined) {
        centers[index] = JSON.parse(JSON.stringify(oldcenters[index]))
        // let canvas = document.getElementById("canvas")
        // let context = canvas.getContext("2d")
        // context.fillRect(this.centers[index].y, this.centers[index].x, 10, 10)
      } else {
        centers[index].l /= centers[index].c;
        centers[index].a /= centers[index].c;
        centers[index].b /= centers[index].c;
        centers[index].x = Math.floor(centers[index].x / centers[index].c);
        centers[index].y = Math.floor(centers[index].y / centers[index].c);
      }
    }
  }
  console.log("compute done.............................")
  return { clusterID, centers };
}


const pickPixel = (img: ImageData, centers: any[], clusterID: any[], stride: number) => {
  console.log("painting...................")

  const width = img.width;
  const height = img.height;

  // pick pixel 
  let row = Math.ceil(height / stride);
  let col = Math.ceil(width / stride);
  let resultImage = new Uint8ClampedArray(width * height * 4);

  // iteration for every pix rectangle
  for (let m = 0; m < row; m++) {
    for (let n = 0; n < col; n++) {
      let startj = m * stride;
      let startk = n * stride;
      let counts: { [key: string]: number } = {};

      for (let j = startj; j < startj + stride && j < height; j++) {
        for (let k = startk; k < startk + stride && k < width; k++) {
          let c = clusterID[j * width + k];
          if (c != -1) {
            if (counts[c]) {
              counts[c]++
            } else {
              counts[c] = 1
            }
          }
        }
      }
      let centerpos = -1;
      let max = Number.MIN_VALUE;
      for (let pos in counts) {
        if (counts[pos] > max) {
          max = counts[pos];
          centerpos = +pos;
        }
      }

      for (let j = startj; j < startj + stride && j < height; j++) {
        for (let k = startk; k < startk + stride && k < width; k++) {
          resultImage[4 * (j * width + k)] = img.data[4 * (centers[centerpos].x * width + centers[centerpos].y)];
          resultImage[4 * (j * width + k) + 1] = img.data[4 * (centers[centerpos].x * width + centers[centerpos].y) + 1];
          resultImage[4 * (j * width + k) + 2] = img.data[4 * (centers[centerpos].x * width + centers[centerpos].y) + 2];
          resultImage[4 * (j * width + k) + 3] = img.data[4 * (centers[centerpos].x * width + centers[centerpos].y) + 3];
        }
      }
    }
  }
  console.log("painting done...................");
  return resultImage
}

const getContours = (clusterID: any[], width: number, height: number) => {
  const dx8 = [-1, -1,  0,  1, 1, 1, 0, -1];
  const dy8 = [ 0, -1, -1, -1, 0, 1, 1,  1];
  let contours = []
  let istaken = Array.from({ length: height }).map(linearray =>
    linearray = Array.from({ length: width }).map(item => item = false))

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      let nr_p = 0

      /* Compare the pixel to its 8 neighbours. */
      for (let k = 0; k < 8; k++) {
        let x = i + dx8[k], y = j + dy8[k]

        if (x >= 0 && x < height && y >= 0 && y < width) {
          if (istaken[x][y] == false && clusterID[i * width + j] != clusterID[x * width + y]) {
              nr_p += 1
          }
        }
      }

      /* Add the pixel to the contour list if desired. */
      if (nr_p >= 2) {
        contours.push({ x: i, y: j })
        istaken[i][j] = true
      }
    }
  }
  return contours;
}



export const SLIC = (img: ImageData, step: number, iters: number, stride: number, weight: number) => {
  const width = img.width;
  const height = img.height;

  const imgCopyLAB = new ImageData(
    new Uint8ClampedArray(img.data),
    img.width,
    img.height
  );

  // tranlate rgb to lab
  for (let i = 0; i < width * height; i += 4) {
      let labColor = rgb2lab(
        img.data[i], 
        img.data[i + 1], 
        img.data[i + 2]
      );
      imgCopyLAB.data[i] = labColor.l;
      imgCopyLAB.data[i + 2] = labColor.a;
      imgCopyLAB.data[i + 3] = labColor.b;
  }
  const { clusterID, centers } = computePixel(imgCopyLAB, step, iters, weight);
  const result = pickPixel(img, centers, clusterID, stride);


  const contours = getContours(clusterID, width, height);

  for (let i = 0; i < contours.length; i++) {
      const idx = 4 * (contours[i].x * width + contours[i].y);

      result[idx] = 255;
      result[idx + 1] = 255;
      result[idx + 2] = 255;
      result[idx + 3] = 255;
  }

  // return result
  return new ImageData(new Uint8ClampedArray(result), img.width, img.height);
}




// export default class SLIC {
//     constructor(imageArray, width, height) {
//         this.rgbImage = Uint8ClampedArray.from(imageArray)
//         this.imageArray = Array.from(imageArray)
//         this.width = width
//         this.height = height
//         console.log("Total pixel :", this.width * this.height)
//         console.log("width :", width)
//         console.log("height: ", height)
//     }
// 
//     showCenters(ctx) {
// 
//         // let canvas = document.getElementById("canvas")
//         // let ctx = canvas.getContext("2d")
//         //ctx.fillStyle = "#FF0000"
//         ctx.fillStyle = "#" + ("00000" + ((Math.random() * 16777215 + 0.5) >> 0).toString(16)).slice(-6)
//         for (let i = 0; i < this.centers.length; i++) {
//             //console.log(this.centers[i].x + "  " + this.centers[i].y)
//             ctx.fillRect(this.centers[i].y, this.centers[i].x, 5, 5)
//         }
//     }
// 
//     showContours(ctx) {
//         let dx8 = [-1, -1, 0, 1, 1, 1, 0, -1]
//         let dy8 = [0, -1, -1, -1, 0, 1, 1, 1]
// 
//         let contours = []
//         let istaken = Array.from({ length: this.height }).map(linearray =>
//             linearray = Array.from({ length: this.width }).map(item => item = false))
// 
//         for (let i = 0; i < this.height; i++) {
//             for (let j = 0; j < this.width; j++) {
//                 let nr_p = 0
// 
//                 /* Compare the pixel to its 8 neighbours. */
//                 for (let k = 0; k < 8; k++) {
//                     let x = i + dx8[k], y = j + dy8[k]
// 
//                     if (x >= 0 && x < this.height && y >= 0 && y < this.width) {
//                         if (istaken[x][y] == false && this.clusterID[i * this.width + j] != this.clusterID[x * this.width + y]) {
//                             nr_p += 1
//                         }
//                     }
//                 }
// 
//                 /* Add the pixel to the contour list if desired. */
//                 if (nr_p >= 2) {
//                     contours.push({
//                         x: i,
//                         y: j
//                     })
//                     istaken[i][j] = true
//                 }
//             }
//         }
//         for (let i = 0; i < contours.length; i++) {
//             // let ctx = this.canvas.getContext("2d")
//             ctx.fillStyle = "#ffffff"
//             ctx.fillRect(contours[i].y, contours[i].x, 2, 2)
//         }
//     }
// 
//     pickPixel() {
//         console.log("paiting...................")
//         // pick pixel 
//         let row = Math.ceil(this.height / this.stride)
//         let col = Math.ceil(this.width / this.stride)
//         let resultImage = new Uint8ClampedArray(this.width * this.height * 4)
// 
//         // iteration for every pix rectangle
//         for (let m = 0; m < row; m++) {
//             for (let n = 0; n < col; n++) {
// 
//                 let startj = m * this.stride
//                 let startk = n * this.stride
//                 let counts = {}
// 
//                 for (let j = startj; j < startj + this.stride && j < this.height; j++) {
//                     for (let k = startk; k < startk + this.stride && k < this.width; k++) {
//                         let c = this.clusterID[j * this.width + k]
//                         if (c != -1) {
//                             if (counts[c]) {
//                                 counts[c]++
//                             } else {
//                                 counts[c] = 1
//                             }
//                         }
//                     }
//                 }
//                 let centerpos = -1
//                 let max = Number.MIN_VALUE
//                 for (let pos in counts) {
//                     if (counts[pos] > max) {
//                         max = counts[pos]
//                         centerpos = pos
//                     }
//                 }
// 
//                 for (let j = startj; j < startj + this.stride && j < this.height; j++) {
//                     for (let k = startk; k < startk + this.stride && k < this.width; k++) {
//                         resultImage[4 * (j * this.width + k)] = this.rgbImage[4 * (this.centers[centerpos].x * this.width + this.centers[centerpos].y)]
//                         resultImage[4 * (j * this.width + k) + 1] = this.rgbImage[4 * (this.centers[centerpos].x * this.width + this.centers[centerpos].y) + 1]
//                         resultImage[4 * (j * this.width + k) + 2] = this.rgbImage[4 * (this.centers[centerpos].x * this.width + this.centers[centerpos].y) + 2]
//                         resultImage[4 * (j * this.width + k) + 3] = this.rgbImage[4 * (this.centers[centerpos].x * this.width + this.centers[centerpos].y) + 3]
//                     }
//                 }
//             }
//         }
//         console.log("paiting done...................")
//         return resultImage
//     }
// 
//     //pixelate image
//     pixelDeal(step, iters, stride, weight) {
//         this.step = step
//         this.iters = iters
//         this.stride = stride
//         this.weight = weight
// 
//         console.log("step :", step)
//         console.log("iters :", iters)
//         console.log("weight :", weight)
//         console.log("stride :", stride)
// 
//         //tranlate rgb to lab
//         for (let i = 0; i < this.width * this.height; i += 4) {
//             let labColor = this.rgb2lab(this.imageArray[i], this.imageArray[i + 1], this.imageArray[i + 2])
//             this.imageArray[i] = labColor.l
//             this.imageArray[i + 2] = labColor.a
//             this.imageArray[i + 3] = labColor.b
//         }
//         this.computePixel()
//         let result = this.pickPixel()
// 
//         return result
//     }
// }
