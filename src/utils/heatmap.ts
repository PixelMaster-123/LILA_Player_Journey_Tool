/**
 * High-performance 2D Canvas Heatmap Renderer
 */

export interface HeatmapOptions {
  radius?: number;
  opacity?: number;
  colorScheme?: 'traffic' | 'combat' | 'storm' | 'loot';
}

const GRADIENTS: Record<string, [number, string][]> = {
  traffic: [
    [0.0, 'rgba(0, 0, 255, 0)'],
    [0.2, 'rgba(0, 240, 255, 0.4)'],
    [0.5, 'rgba(57, 255, 20, 0.7)'],
    [0.8, 'rgba(255, 230, 0, 0.85)'],
    [1.0, 'rgba(255, 50, 50, 1.0)']
  ],
  combat: [
    [0.0, 'rgba(255, 0, 0, 0)'],
    [0.2, 'rgba(255, 100, 0, 0.5)'],
    [0.5, 'rgba(255, 40, 0, 0.75)'],
    [0.8, 'rgba(255, 0, 100, 0.9)'],
    [1.0, 'rgba(200, 0, 255, 1.0)']
  ],
  storm: [
    [0.0, 'rgba(128, 0, 255, 0)'],
    [0.2, 'rgba(160, 32, 240, 0.5)'],
    [0.5, 'rgba(255, 0, 128, 0.75)'],
    [0.8, 'rgba(255, 50, 50, 0.9)'],
    [1.0, 'rgba(255, 255, 255, 1.0)']
  ],
  loot: [
    [0.0, 'rgba(255, 215, 0, 0)'],
    [0.3, 'rgba(255, 215, 0, 0.5)'],
    [0.6, 'rgba(50, 205, 50, 0.8)'],
    [1.0, 'rgba(0, 255, 255, 1.0)']
  ]
};

function createPalette(colorScheme: string): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8ClampedArray(256 * 4);

  const gradStops = GRADIENTS[colorScheme] || GRADIENTS.traffic;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [stop, color] of gradStops) {
    grad.addColorStop(stop, color);
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, 256);
  return ctx.getImageData(0, 0, 1, 256).data;
}

export function drawHeatmap(
  targetCtx: CanvasRenderingContext2D,
  points: [number, number][],
  width: number,
  height: number,
  options: HeatmapOptions = {}
) {
  if (points.length === 0) return;

  const radius = options.radius || 24;
  const opacity = options.opacity ?? 0.75;
  const scheme = options.colorScheme || 'traffic';

  // 1. Create offscreen alpha canvas
  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = width;
  alphaCanvas.height = height;
  const alphaCtx = alphaCanvas.getContext('2d');
  if (!alphaCtx) return;

  // 2. Create radial circle brush
  const brushCanvas = document.createElement('canvas');
  brushCanvas.width = radius * 2;
  brushCanvas.height = radius * 2;
  const brushCtx = brushCanvas.getContext('2d');
  if (!brushCtx) return;

  const radGrad = brushCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  radGrad.addColorStop(0, 'rgba(0,0,0,1)');
  radGrad.addColorStop(1, 'rgba(0,0,0,0)');
  brushCtx.fillStyle = radGrad;
  brushCtx.beginPath();
  brushCtx.arc(radius, radius, radius, 0, Math.PI * 2);
  brushCtx.fill();

  // 3. Stamp brush for each point into alpha buffer
  alphaCtx.globalAlpha = 0.15;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    alphaCtx.drawImage(brushCanvas, x - radius, y - radius);
  }

  // 4. Colorize alpha buffer with palette
  const imgData = alphaCtx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const palette = createPalette(scheme);

  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i];
    if (alpha > 0) {
      const paletteOffset = alpha * 4;
      data[i - 3] = palette[paletteOffset];     // R
      data[i - 2] = palette[paletteOffset + 1]; // G
      data[i - 1] = palette[paletteOffset + 2]; // B
      data[i] = Math.round(palette[paletteOffset + 3] * opacity); // A
    }
  }

  // 5. Draw colorized image back onto target canvas
  alphaCtx.putImageData(imgData, 0, 0);
  targetCtx.save();
  targetCtx.drawImage(alphaCanvas, 0, 0);
  targetCtx.restore();
}
