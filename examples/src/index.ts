import type { z } from 'zod';
import * as ImageUtil from '../../src';
import { buildForm, initialValues, type OptionValues } from './helpers';

type Example = {
  name: string;
  /** Name of the filter function exposed by the worker. */
  filter: string;
  /** Optional Zod schema describing the filter's options. */
  options?: z.ZodType;
};

const examples: Example[] = [
  // Filters with options
  { name: 'Painterly', filter: 'painterlyFilter', options: ImageUtil.PainterlyOptionsSchema },
  { name: 'Kaleidoscope', filter: 'kaleidoscopeFilter', options: ImageUtil.KaleidoscopeOptionsSchema },
  { name: 'Swirl', filter: 'swirlFilter', options: ImageUtil.SwirlOptionsSchema },
  { name: 'Motion blur', filter: 'motionBlur', options: ImageUtil.MotionBlurOptionsSchema },
  { name: 'Radial spin blur', filter: 'radialSpinBlur', options: ImageUtil.RadialSpinOptionsSchema },
  { name: 'Fish eye', filter: 'fishEyeFilter', options: ImageUtil.FishEyeOptionSchema },
  { name: 'Grid', filter: 'gridFilter', options: ImageUtil.GridFilterOptionsSchema },
  { name: 'Hatch', filter: 'hatchFilter', options: ImageUtil.HatchOptionsSchema },
  { name: 'Halftone', filter: 'halftoneFilter', options: ImageUtil.HalftoneOptionsSchema },
  { name: 'Sketch', filter: 'sketchTransform', options: ImageUtil.SketchOptionsSchema },
  { name: 'SLIC', filter: 'SLIC', options: ImageUtil.SLICOptionsSchema },
  { name: 'Shear', filter: 'shearFilter', options: ImageUtil.ShearAllOptionsSchema },
  { name: 'Uniform blur', filter: 'uniformBlur', options: ImageUtil.uniformBlurSchema },
  { name: 'Polaroid collage', filter: 'polaroidCollageFilter', options: ImageUtil.PolaroidOptionsSchema },
  { name: 'Colour splash', filter: 'colourSplash', options: ImageUtil.SplashOptionSchema },

  // Filters without options
  { name: 'Greyscale', filter: 'greyScaleFilter' },
  { name: 'Invert', filter: 'invertFilter' },
  { name: 'Sepia', filter: 'sepiaFilter' },
  { name: 'Polaroid', filter: 'polaroidFilter' },
  { name: 'Technicolour', filter: 'technicolourFilter' },
  { name: 'Kodak chrome', filter: 'kodakChromeFilter' },
  { name: 'Browni', filter: 'browniFilter' },
  { name: 'Vintage', filter: 'vintageFilter' },
  { name: 'Night vision', filter: 'nightVisionFilter' },
  { name: 'Glow', filter: 'glowFilter' },
  { name: 'Sharpen', filter: 'sharpenFilter' },
  { name: 'Emboss', filter: 'embossFilter' },
  { name: 'Laplacian', filter: 'laplacianFilter' },
  { name: 'Sobel', filter: 'sobelFilter' },
];

const testImages = [
  'example.png',
  'example2.png',
  'example3.jpg',
  'example4.jpeg',
];

const MAX_DIMENSION = 400;

const originalCanvas = document.createElement('canvas');
const filteredCanvas = document.createElement('canvas');
const filteredCaption = document.createElement('figcaption');
const status = document.createElement('span');
const controlsPanel = document.createElement('aside');
const controlsForm = document.createElement('div');
const codeOutput = document.createElement('code');
const imageSelect = document.createElement('select');
const select = document.createElement('select');
const demoBlurb = document.createElement('div');
select.classList = 'select-wrapper';

const worker: any = ImageUtil.newWorker('examples');

let current = examples[0];
let values: OptionValues = current.options
  ? initialValues(current.options)
  : {};
let generation = 0;
let imageRequest = 0;
let running = false;
let queued = false;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let originalImage: ImageData;

const createCanvasFigure = (
  canvas: HTMLCanvasElement,
  caption: string
): HTMLElement => {
  const figure = document.createElement('figure');
  const label = document.createElement('figcaption');
  label.textContent = caption;
  figure.append(canvas, label);
  return figure;
};

const draw = (canvas: HTMLCanvasElement, image: ImageData) => {
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.putImageData(image, 0, 0);
};

/**
 * Load a test image at its natural aspect ratio, capped to MAX_DIMENSION.
 */
const loadTestImage = async (file: string): Promise<ImageData> => {
  const probe = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = '';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${file}`));
    image.src = file;
  });

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(probe.naturalWidth, probe.naturalHeight)
  );

  return ImageUtil.loadImage(file, {
    width: Math.max(1, Math.round(probe.naturalWidth * scale)),
    height: Math.max(1, Math.round(probe.naturalHeight * scale)),
  });
};

const setStatus = (message: string) => {
  status.textContent = message;
};

const runOnce = async (
  example: Example,
  snapshot: OptionValues
): Promise<void> => {
  const token = ++generation;

  let parsed: unknown;
  if (example.options) {
    try {
      parsed = example.options.parse(snapshot);
    } catch (error) {
      console.warn('Invalid options', error);
      setStatus('Options are not valid yet');
      return;
    }
  }

  setStatus(`Rendering ${example.name}…`);

  const request = imageRequest;
  const input = structuredClone(originalImage);
  const output = example.options
    ? await worker[example.filter](input, parsed)
    : await worker[example.filter](input);

  // Ignore stale results, and results for an effect/image the user moved away from.
  if (
    token !== generation ||
    request !== imageRequest ||
    example !== current
  ) return;

  draw(filteredCanvas, output);
  filteredCaption.textContent = example.name;
  setStatus('');
};

/**
 * Run the current filter. If a render is already in flight, remember that
 * another run was requested so we do not queue up one job per slider tick.
 */
const run = async (): Promise<void> => {
  if (running) {
    queued = true;
    return;
  }

  running = true;
  try {
    do {
      queued = false;
      await runOnce(current, structuredClone(values));
    } while (queued);
  } catch (error) {
    console.error(error);
    setStatus('Filter failed — see console');
  } finally {
    running = false;
  }
};

const updateCode = (): void => {
  let options: unknown = values;
  if (current.options) {
    try {
      options = current.options.parse(values);
    } catch {
      // Show the in-progress values if the manual input is not valid yet.
    }
  }

  const lines = [
    'import * as ImageUtil from "https://cdn.jsdelivr.net/gh/mwdchang/image-util@latest/dist/index.js";',
    '',
    "const img = await ImageUtil.loadImage('https://picsum.photos/300', { width: 300, height: 300 });",
  ];

  if (current.options) {
    lines.push(
      `const options = ${JSON.stringify(options, null, 2)};`,
      `const result = ImageUtil.${current.filter}(img, options);`
    );
  } else {
    lines.push(`const result = ImageUtil.${current.filter}(img);`);
  }

  lines.push('document.body.append(ImageUtil.createCanvas(result));');
  codeOutput.textContent = lines.join('\n');
};

const scheduleRun = (): void => {
  updateCode();

  if (debounceTimer !== undefined) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    void run();
  }, 120);
};

const selectImage = async (file: string): Promise<void> => {
  const request = ++imageRequest;
  setStatus(`Loading ${file}…`);

  try {
    const image = await loadTestImage(file);
    if (request !== imageRequest) return;

    originalImage = image;
    draw(originalCanvas, image);
    void run();
  } catch (error) {
    console.error(error);
    if (request === imageRequest) setStatus(`Could not load ${file}`);
  }
};

const selectExample = (example: Example): void => {
  current = example;
  values = example.options ? initialValues(example.options) : {};
  updateCode();

  if (example.options) {
    controlsForm.replaceChildren(buildForm(example.options, values, scheduleRun));
  } else {
    const message = document.createElement('p');
    message.className = 'muted';
    message.textContent = 'This filter has no options.';
    controlsForm.replaceChildren(message);
  }

  filteredCaption.textContent = example.name;
  setStatus(`Rendering ${example.name}…`);
  void run();
};

const buildUI = (): void => {
  const controlsHeader = document.createElement('div');
  controlsHeader.className = 'controls-header';

  const imagePicker = document.createElement('label');
  imagePicker.className = 'picker';
  const imagePickerLabel = document.createElement('span');
  imagePickerLabel.textContent = 'Image';
  imagePicker.append(imagePickerLabel, imageSelect);

  const picker = document.createElement('label');
  picker.className = 'picker';
  const pickerLabel = document.createElement('span');
  pickerLabel.textContent = 'Effect';
  picker.append(pickerLabel, select);

  status.className = 'status';

  testImages.forEach((file) => {
    imageSelect.add(new Option(file, file));
  });
  imageSelect.value = testImages[0];
  imageSelect.addEventListener('change', () => {
    void selectImage(imageSelect.value);
  });

  examples.forEach((example, index) => {
    select.add(new Option(example.name, String(index)));
  });
  select.addEventListener('change', () => {
    selectExample(examples[Number(select.value)]);
  });

  controlsHeader.append(demoBlurb, imagePicker, picker, status);

  const message = document.createTextNode("Click to see ");
  const link = document.createElement("a");
  link.href = "demo.html";
  link.textContent = "showcase";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  demoBlurb.className = 'demo-blurb';
  demoBlurb.appendChild(message);
  demoBlurb.appendChild(link);
  demoBlurb.appendChild(document.createElement('br'));

  controlsPanel.className = 'controls-panel';
  controlsPanel.append(controlsHeader, controlsForm);

  const originalFigure = createCanvasFigure(originalCanvas, 'Original');
  const filteredFigure = document.createElement('figure');
  filteredFigure.append(filteredCanvas, filteredCaption);

  const stage = document.createElement('section');
  stage.className = 'stage';
  stage.append(originalFigure, filteredFigure);

  const codeBlock = document.createElement('pre');
  codeBlock.append(codeOutput);

  const codePanel = document.createElement('section');
  codePanel.className = 'code-panel';
  codePanel.append(codeBlock);

  const preview = document.createElement('section');
  preview.className = 'preview-column';
  preview.append(stage, codePanel);

  const layout = document.createElement('section');
  layout.className = 'layout';
  layout.append(controlsPanel, preview);

  const app = document.createElement('main');
  app.className = 'app';
  app.append(layout);

  document.body.replaceChildren(app);
};

const start = async (): Promise<void> => {
  originalImage = await loadTestImage(testImages[0]);
  draw(originalCanvas, originalImage);

  buildUI();
  select.value = '0';
  selectExample(current);
};

void start();
