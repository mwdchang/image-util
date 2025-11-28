import { mult } from "./core";

// Matrices from Pixi.js
export const sepiaFilter = (img: ImageData) : ImageData => {
  const matrix = [
    0.393, 0.7689999, 0.18899999,
    0.349, 0.6859999, 0.16799999,
    0.272, 0.5339999, 0.13099999
  ];
  return mult(img, matrix);
};

export const polaroidFilter = (img: ImageData): ImageData => {
  // Polaroid
  const matrix = [
     1.438, -0.062, -0.062,
    -0.122, 1.378, -0.122,
    -0.016, -0.016, 1.483
  ];
  return mult(img, matrix);
};

// Technicolor
export const technicolourFilter = (img: ImageData): ImageData => {
  const matrix = [
    1.9125277891456083, -0.8545344976951645, -0.09155508482755585,
    -0.3087833385928097, 1.7658908555458428, -0.10601743074722245,
    -0.231103377548616, -0.7501899197440212, 1.847597816108189
  ];
  return mult(img, matrix);
};


// Kodak chrome
export const kodakChromeFilter = (img: ImageData): ImageData => {
  const matrix = [
    1.1285582396593525, -0.3967382283601348, -0.03992559172921793,
    -0.16404339962244616, 1.0835251566291304, -0.05498805115633132,
    -0.16786010706155763, -0.5603416277695248, 1.6014850761964943
  ];
  return mult(img, matrix);
};

// Browni
export const browniFilter = (img: ImageData): ImageData => {
  const matrix = [
    0.5997023498159715, 0.34553243048391263, -0.2708298674538042,
    -0.037703249837783157, 0.8609577587992641, 0.15059552388459913,
    0.24113635128153335, -0.07441037908422492, 0.44972182064877153
  ];
  return mult(img, matrix);
}


// vintage
export const vintageFilter = (img: ImageData): ImageData => {
  const matrix = [
    0.6279345635605994, 0.3202183420819367, -0.03965408211312453,
    0.02578397704808868, 0.6441188644374771, 0.03259127616149294,
    0.0466055556782719, -0.0851232987247891, 0.5241648018700465
  ];

  return mult(img, matrix);
};

// Night Vision
export const nightVisionFilter = (img: ImageData): ImageData => {
  /*
    0.1, 0.4, 0.1,
    0.14, 0.56, 0.14,
    0.1, 0.4, 0.1
  */

  const matrix = [
    0.1, 0.4, 0.1,
    0.2, 0.8, 0.2,
    0.1, 0.4, 0.1
  ];
  return mult(img, matrix);
};
