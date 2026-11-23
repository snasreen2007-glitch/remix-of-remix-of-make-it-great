import { describe, expect, it } from "vitest";
import { assessPixels } from "../features/crop-care/services/quality";
import { computeVenationAnisotropy } from "../features/crop-care/services/vision";

describe("Rice Pathology & Real-World Foliar Evaluation Suite", () => {
  const W = 64;
  const H = 64;
  const total = W * H;

  it("identifies healthy rice tillering canopy with dense overlapping leaves", () => {
    const pixels = new Uint8ClampedArray(total * 4);
    // 85% healthy green foliage, 15% field soil/shadow
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      if (i < total * 0.85) {
        // Vibrant rice canopy chlorophyll
        pixels[idx] = 35 + (i % 15);
        pixels[idx + 1] = 140 + (i % 25);
        pixels[idx + 2] = 30 + (i % 12);
      } else {
        // Field shadow / mud background
        pixels[idx] = 45 + (i % 10);
        pixels[idx + 1] = 42 + (i % 8);
        pixels[idx + 2] = 32 + (i % 6);
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(true);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(true);
    expect(report.greenShare).toBeGreaterThanOrEqual(0.70);
  });

  it("identifies rice blast leaf with spindle-shaped lesions and ash centers", () => {
    const pixels = new Uint8ClampedArray(total * 4);
    // 65% green rice blade, 25% necrotic brown halo, 10% ash-grey spindle core
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      if (i < total * 0.65) {
        // Green blade
        pixels[idx] = 45 + (i % 12);
        pixels[idx + 1] = 135 + (i % 18);
        pixels[idx + 2] = 38 + (i % 10);
      } else if (i < total * 0.90) {
        // Necrotic brown halo: R~115, G~65, B~28
        pixels[idx] = 115 + (i % 8);
        pixels[idx + 1] = 65 + (i % 6);
        pixels[idx + 2] = 28 + (i % 4);
      } else {
        // Ash-grey core: R~130, G~130, B~128
        pixels[idx] = 130 + (i % 4);
        pixels[idx + 1] = 130 + (i % 4);
        pixels[idx + 2] = 128 + (i % 4);
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(true);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(true);
  });

  it("identifies bacterial leaf blight with wavy marginal yellow-to-straw stripes", () => {
    const pixels = new Uint8ClampedArray(total * 4);
    // 60% green leaf center, 40% marginal yellow/straw necrotic lesions
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const isMargin = x < 18 || x > 46;
        if (isMargin) {
          // Yellow-to-straw desiccated margin
          pixels[i] = 160 + (x % 10);
          pixels[i + 1] = 145 + (y % 10);
          pixels[i + 2] = 65 + (x % 6);
        } else {
          // Green leaf blade
          pixels[i] = 40 + (x % 8);
          pixels[i + 1] = 138 + (y % 12);
          pixels[i + 2] = 35 + (x % 6);
        }
        pixels[i + 3] = 255;
      }
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(true);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(true);
  });

  it("identifies brown spot disease with circular brown lesions and chlorotic halos", () => {
    const pixels = new Uint8ClampedArray(total * 4);
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      const isSpot = (i % 9 === 0);
      const isHalo = (i % 9 === 1);
      if (isSpot) {
        // Brown necrotic spot
        pixels[idx] = 105 + (i % 8);
        pixels[idx + 1] = 60 + (i % 6);
        pixels[idx + 2] = 26 + (i % 4);
      } else if (isHalo) {
        // Chlorotic yellow halo
        pixels[idx] = 150 + (i % 10);
        pixels[idx + 1] = 145 + (i % 10);
        pixels[idx + 2] = 50 + (i % 8);
      } else {
        // Healthy leaf tissue
        pixels[idx] = 48 + (i % 10);
        pixels[idx + 1] = 136 + (i % 14);
        pixels[idx + 2] = 38 + (i % 8);
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(true);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(true);
  });

  it("strictly rejects dim human selfies under indoor artificial lighting", () => {
    const pixels = new Uint8ClampedArray(total * 4);
    // Dim selfie: 40% facial skin, 30% black hair, 30% dark room shadows
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      if (i < total * 0.40) {
        // Dim South Asian skin tone: R~62, G~48, B~38
        pixels[idx] = 62 + (i % 6);
        pixels[idx + 1] = 48 + (i % 4);
        pixels[idx + 2] = 38 + (i % 3);
      } else if (i < total * 0.70) {
        // Dark hair
        pixels[idx] = 25 + (i % 4);
        pixels[idx + 1] = 24 + (i % 4);
        pixels[idx + 2] = 24 + (i % 4);
      } else {
        // Dark indoor background with cyan-grey tint
        pixels[idx] = 32 + (i % 4);
        pixels[idx + 1] = 38 + (i % 4);
        pixels[idx + 2] = 42 + (i % 4);
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
  });

  it("strictly rejects random household objects and furniture without plant foliage", () => {
    const pixels = new Uint8ClampedArray(total * 4);
    // Blue jeans / clothing fabric
    for (let i = 0; i < total; i++) {
      const idx = i * 4;
      pixels[idx] = 45 + (i % 8);
      pixels[idx + 1] = 68 + (i % 10);
      pixels[idx + 2] = 120 + (i % 15);
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
  });

  it("discriminates Rice Blast spindle lesions from Brown Spot circular lesions via ash-to-brown ratio", () => {
    // Blast leaf simulation: 65% green blade, 15% brown halo, 20% grey-white ash necrotic core
    let blastAsh = 0;
    let blastBrown = 0;
    for (let i = 0; i < total; i++) {
      let r8 = 45;
      let g8 = 135;
      let b8 = 38;
      if (i > total * 0.65 && i <= total * 0.80) {
        // Brown halo
        r8 = 115;
        g8 = 65;
        b8 = 28;
      } else if (i > total * 0.80) {
        // Ash necrotic core
        r8 = 135;
        g8 = 135;
        b8 = 128;
      }
      const diffRg = Math.abs(r8 - g8);
      const diffGb = Math.abs(g8 - b8);
      if (diffRg < 40 && diffGb < 55 && r8 > 100 && g8 > 100 && b8 > 80) blastAsh++;
      if (r8 > 45 && g8 < r8 * 0.95 && b8 < r8 * 0.85 && r8 > b8 * 1.15) blastBrown++;
    }
    const blastAshRatio = blastAsh / Math.max(1, blastBrown);
    expect(blastAshRatio).toBeGreaterThanOrEqual(0.40);

    // Brown Spot leaf simulation: 70% green blade, 25% dense brown necrotic spots, 5% chlorotic halo, minimal ash
    let bsAsh = 0;
    let bsBrown = 0;
    for (let i = 0; i < total; i++) {
      let r8 = 45;
      let g8 = 135;
      let b8 = 38;
      if (i > total * 0.70 && i <= total * 0.95) {
        // Dense dark brown spot
        r8 = 105;
        g8 = 55;
        b8 = 24;
      } else if (i > total * 0.95) {
        // Chlorotic yellow halo
        r8 = 145;
        g8 = 140;
        b8 = 45;
      }
      const diffRg = Math.abs(r8 - g8);
      const diffGb = Math.abs(g8 - b8);
      if (diffRg < 40 && diffGb < 55 && r8 > 100 && g8 > 100 && b8 > 80) bsAsh++;
      if (r8 > 45 && g8 < r8 * 0.95 && b8 < r8 * 0.85 && r8 > b8 * 1.15) bsBrown++;
    }
    const bsAshRatio = bsAsh / Math.max(1, bsBrown);
    expect(bsAshRatio).toBeLessThan(0.35);
    expect(bsBrown).toBeGreaterThan(500);
  });

  it("measures high directional venation anisotropy on parallel monocot rice blade", () => {
    const pixels = new Uint8ClampedArray(total * 4);
    // Monocot blade with vertical parallel veins (high vertical gradient variation)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const vein = (x % 4 === 0) ? 25 : 0;
        pixels[i] = 40 + vein;
        pixels[i + 1] = 145 + vein;
        pixels[i + 2] = 35;
        pixels[i + 3] = 255;
      }
    }

    const { venationAnisotropy, gradRatio } = computeVenationAnisotropy(pixels, W, H);
    expect(venationAnisotropy).toBeGreaterThanOrEqual(1.65);
    expect(gradRatio).toBeGreaterThanOrEqual(1.65);
  });

  it("measures low isotropic gradient distribution on reticulate net-veined dicot chilli leaf", () => {
    const pixels = new Uint8ClampedArray(total * 4);
    // Dicot leaf with branching net veins in all directions (isotropic gradient)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const netVein = ((x + y) % 6 === 0 || (x - y + 100) % 6 === 0) ? 20 : 0;
        pixels[i] = 45 + netVein;
        pixels[i + 1] = 135 + netVein;
        pixels[i + 2] = 38;
        pixels[i + 3] = 255;
      }
    }

    const { venationAnisotropy, gradRatio } = computeVenationAnisotropy(pixels, W, H);
    expect(venationAnisotropy).toBeLessThanOrEqual(1.45);
    expect(gradRatio).toBeLessThanOrEqual(1.35);
  });
});

