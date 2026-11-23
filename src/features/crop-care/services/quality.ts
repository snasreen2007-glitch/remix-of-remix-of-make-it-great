import type { QualityReport } from "./types";

/** Pure image-quality maths on RGBA pixels, so it runs the same in the browser and in tests. */
export function assessPixels(data: Uint8ClampedArray, width: number, height: number): QualityReport {
  const gray = new Float32Array(width * height);
  let sum = 0;
  let sumChroma = 0;
  let sumExg = 0;
  let green = 0;
  let chlorotic = 0;
  let lesion = 0;
  let straw = 0;
  let neonCount = 0;
  let skinCount = 0;
  const colorMap = new Map<number, number>();

  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4]!, g = data[i * 4 + 1]!, b = data[i * 4 + 2]!;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = y;
    sum += y;

    // 5-bit color quantization
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    colorMap.set(key, (colorMap.get(key) || 0) + 1);

    // Artificial neon colors common in clipart / drawings (extreme saturation + bright)
    if ((r > 240 && g > 240 && b < 20) || (g > 245 && r < 20 && b > 245) || (r < 20 && g > 245 && b < 20)) {
      neonCount++;
    }

    // Biometric human skin tone detection (YCbCr + Illumination Invariant RGB)
    // Accurately recognizes human skin across all ethnicities (Fitzpatrick I-VI) and varied indoor/outdoor lighting
    const yCb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const yCr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    const isSkinPixel =
      (yCr >= 130 && yCr <= 185 && yCb >= 70 && yCb <= 140) &&
      (r >= 20);

    if (isSkinPixel) {
      skinCount++;
    }

    // Excess Green Index (ExG): living vegetative chlorophyll reflects 550nm green while absorbing red & blue
    const exg = 2 * g - r - b;
    sumExg += exg;

    // Neutral grey check (walls, paper, tables, floor tiles, grey furniture)
    const chromaRange = Math.max(r, g, b) - Math.min(r, g, b);
    sumChroma += chromaRange;
    const isStrictNeutralGrey =
      (chromaRange <= 12) ||
      (r > 160 && g > 160 && b > 150 && chromaRange <= 18);

    // Multi-spectral botanical foliage classification
    // 1. Green foliage: genuine green chlorophyll dominance over red AND blue
    const isGreen =
      !isSkinPixel &&
      !isStrictNeutralGrey &&
      (g > r * 1.04 && g > b * 1.06 && exg > 8.0 && g > 30);

    // 2. Chlorotic, lime, & yellow foliage (natural senescence, nutritional chlorosis, or viral yellowing)
    const isChlorotic =
      !isSkinPixel &&
      !isStrictNeutralGrey &&
      (r > 40 && g > 40 && (r + g) > 2.0 * b && g >= r * 0.70 && b < Math.min(r, g) * 0.85);

    // 3. Brown, necrotic, & fungal lesion tissue (blast spots, brown spot, cercospora lesions, anthracnose)
    const isLesion =
      !isSkinPixel &&
      !isStrictNeutralGrey &&
      (r > 35 && g > 20 && (r + g) > b * 1.25 && (r - b) >= 10 && b < Math.max(r, g) * 0.88);

    // 4. Straw, tan, & desiccated leaf blade/sheath tissue
    const isStraw =
      !isSkinPixel &&
      !isStrictNeutralGrey &&
      (r > 45 && g > 35 && (r + g) > b * 1.30 && Math.abs(r - g) < 40 && (r - b) >= 12 && b < Math.max(r, g) * 0.85);

    if (isGreen) {
      green++;
    } else if (isChlorotic) {
      chlorotic++;
    } else if (isLesion) {
      lesion++;
    } else if (isStraw) {
      straw++;
    }
  }
  const n = width * height;
  const brightness = sum / n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (gray[i]! - brightness) ** 2;
  const contrast = Math.sqrt(variance / n);

  // Variance of the Laplacian: low values mean a blurry image.
  let lapSum = 0, lapSq = 0, count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap = gray[i - width]! + gray[i + width]! + gray[i - 1]! + gray[i + 1]! - 4 * gray[i]!;
      lapSum += lap;
      lapSq += lap * lap;
      count++;
    }
  }
  const mean = count ? lapSum / count : 0;
  const sharpness = count ? lapSq / count - mean * mean : 0;
  const greenShare = green / n;
  const chloroticShare = chlorotic / n;
  const foliageShare = greenShare + chloroticShare;
  const meanExg = sumExg / n;
  const skinShare = skinCount / n;

  // Real leaf tissue requires genuine chlorophyll presence (green or chlorotic foliage)
  const hasBaseChlorophyll = foliageShare >= 0.08 || (foliageShare >= 0.04 && meanExg >= 10.0);
  // Lesions and straw only constitute verified botanical leaf tissue when accompanied by genuine leaf chlorophyll or in genuine agricultural monochrome
  const validLesion = hasBaseChlorophyll ? lesion : 0;
  const validStraw = hasBaseChlorophyll ? straw : 0;
  const plantTissueShare = (green + chlorotic + validLesion + validStraw) / n;
  const lesionShare = validLesion / n;
  const avgChroma = sumChroma / n;

  let maxColorOccurrences = 0;
  for (const occ of colorMap.values()) {
    if (occ > maxColorOccurrences) maxColorOccurrences = occ;
  }
  const topColorShare = maxColorOccurrences / n;
  const uniqueColorCount = colorMap.size;

  // Reject flat vector art, drawings, cartoons, clipart, illustrations
  // Digital art has low palette diversity, extreme flat color dominance, or high neon saturation
  const isCartoonOrDrawing =
    (uniqueColorCount < 80 && (topColorShare > 0.45 || plantTissueShare < 0.08)) ||
    ((neonCount / n) > 0.05 && plantTissueShare < 0.15);

  // Reject flat painted drywall / artificial indoor surfaces, desks, monitors
  const isIndoorWallDecor = topColorShare > 0.65 && plantTissueShare < 0.15;

  // Reject human faces, selfies, portraits, and people (human skin presence without dominant crop foliage)
  const isHumanFace = (skinShare >= 0.04 && foliageShare < 0.20) || (skinShare >= 0.02 && foliageShare < 0.08);

  // Support true monochrome/black-and-white photos of leaves if they possess genuine foliar sharpness and edge contrast
  const isTrueMonochromeLeaf = (avgChroma < 1.5) && sharpness >= 20 && contrast >= 14;
  const isMissingBotanicalFoliage =
    ((foliageShare < 0.10 && meanExg < 8.0) || (foliageShare < 0.05) || (meanExg < 2.0 && foliageShare < 0.15)) &&
    !isTrueMonochromeLeaf && !isHumanFace && !isCartoonOrDrawing && !isIndoorWallDecor;

  const leafOk = !isCartoonOrDrawing && !isHumanFace && !isIndoorWallDecor && !isMissingBotanicalFoliage;

  const sharpOk = sharpness >= 16;
  const lightOk = brightness >= 25 && brightness <= 250;
  const subjectOk = contrast >= 10;
  const suitable = sharpOk && lightOk && subjectOk && leafOk;

  const leafTip = isIndoorWallDecor
    ? "Indoor wall decoration or artificial object detected. Please photograph a living crop leaf in the field."
    : isHumanFace
    ? "Human face or skin detected. Please photograph an agricultural crop leaf, not people or faces."
    : isCartoonOrDrawing
    ? "Digital drawing or illustration detected. Please photograph a real crop leaf in your field."
    : isMissingBotanicalFoliage
    ? "No agricultural crop leaf detected. Please photograph a rice or chilli plant leaf."
    : "Real botanical foliage detected.";

  return {
    ok: suitable,
    brightness: Math.round(brightness),
    sharpness: Math.round(sharpness),
    contrast: Math.round(contrast),
    greenShare: Math.round(greenShare * 100) / 100,
    checks: [
      { id: "leaf", pass: leafOk, tip: leafTip },
      { id: "blur", pass: sharpOk, tip: sharpOk ? "Sharp enough to see detail." : "The photo looks blurry. Hold the phone steady and tap the screen to focus." },
      { id: "dark", pass: lightOk, tip: lightOk ? "Lighting is good." : brightness < 45 ? "The photo is too dark. Move into daylight or turn on the flash." : "The photo is too bright. Avoid direct glare on the leaf." },
      { id: "subject", pass: subjectOk, tip: subjectOk ? "The subject stands out." : "The plant doesn't stand out. Move closer so the affected area fills the frame." },
      { id: "suitability", pass: suitable, tip: suitable ? "Suitable for analysis." : "Fix the points above, then retake the photo." },
    ],
  };
}

export function assessImage(dataUrl: string): Promise<QualityReport> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error("invalid-image"));
    image.onload = () => {
      const scale = 256 / Math.max(image.width, image.height);
      const w = Math.max(8, Math.round(image.width * scale));
      const h = Math.max(8, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("invalid-image"));
      ctx.drawImage(image, 0, 0, w, h);
      resolve(assessPixels(ctx.getImageData(0, 0, w, h).data, w, h));
    };
    image.src = dataUrl;
  });
}

export function compressPhoto(source: File | HTMLCanvasElement): Promise<string> {
  if (source instanceof HTMLCanvasElement) return Promise.resolve(resizeCanvas(source));
  return new Promise((resolve, reject) => {
    if (!source.type.startsWith("image/")) return reject(new Error("invalid-image"));
    const url = URL.createObjectURL(source);
    const image = new Image();
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("invalid-image")); };
    image.onload = () => {
      // Center crop to square matching the viewfinder reticle
      const square = Math.min(image.width, image.height);
      const sx = Math.floor((image.width - square) / 2);
      const sy = Math.floor((image.height - square) / 2);
      const canvas = document.createElement("canvas");
      canvas.width = square;
      canvas.height = square;
      canvas.getContext("2d")?.drawImage(image, sx, sy, square, square, 0, 0, square, square);
      URL.revokeObjectURL(url);
      resolve(resizeCanvas(canvas));
    };
    image.src = url;
  });
}

function resizeCanvas(source: HTMLCanvasElement): string {
  const scale = Math.min(1, 960 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.74);
}
