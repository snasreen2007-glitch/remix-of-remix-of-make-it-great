import { describe, expect, it } from "vitest";
import { assessPixels } from "../features/crop-care/services/quality";

describe("Out-Of-Distribution (OOD) Non-Plant & Face Rejection", () => {
  it("rejects synthetic human face / skin tone images", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // Simulate human skin tone: R ~ 180, G ~ 125, B ~ 85
    for (let i = 0; i < W * H; i++) {
      pixels[i * 4] = 180 + (i % 5);
      pixels[i * 4 + 1] = 125 + (i % 4);
      pixels[i * 4 + 2] = 85 + (i % 3);
      pixels[i * 4 + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
    expect(leafCheck?.tip).toContain("Human face or skin detected");
  });

  it("rejects diverse South-Asian skin tones under warm lighting", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // Warm South-Asian skin tone: R ~ 155, G ~ 118, B ~ 85
    for (let i = 0; i < W * H; i++) {
      pixels[i * 4] = 155 + (i % 7);
      pixels[i * 4 + 1] = 118 + (i % 5);
      pixels[i * 4 + 2] = 85 + (i % 4);
      pixels[i * 4 + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
    expect(leafCheck?.tip).toContain("Human face or skin detected");
  });

  it("rejects non-plant indoor room / furniture without leaf chlorophyll", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // Simulate grey/white wall and brown floor with natural texture but without chlorophyll
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const noise = (x * 7 + y * 13) % 40;
        pixels[i] = 130 + noise;
        pixels[i + 1] = 125 + noise;
        pixels[i + 2] = 120 + noise;
        pixels[i + 3] = 255;
      }
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
  });

  it("rejects indoor painted walls with decorative carvings", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // 85% uniform painted cream wall, 15% greyish metallic vine shape
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      if (i < W * H * 0.85) {
        pixels[idx] = 215; // wall R
        pixels[idx + 1] = 210; // wall G
        pixels[idx + 2] = 200; // wall B
      } else {
        pixels[idx] = 110; // decor carving
        pixels[idx + 1] = 120;
        pixels[idx + 2] = 105;
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
    expect(leafCheck?.tip).toContain("Indoor wall decoration");
  });

  it("accepts genuine green botanical crop leaves", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // Simulate vibrant plant leaf with natural sensor noise and hundreds of distinct green hues
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      const r = 30 + ((i * 37) % 50);
      const g = 130 + ((i * 73) % 100);
      const b = 25 + ((i * 19) % 40);
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(true);
    expect(report.greenShare).toBeGreaterThan(0.70);
  });

  it("accepts diseased rice leaves with brown spots & necrotic lesions without misclassifying as human skin", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // Simulate rice leaf with pale leaf blade and dark brown spot lesions
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      const isSpot = (i % 7 === 0 || i % 13 === 0);
      if (isSpot) {
        // Brown necrotic lesion: R~110, G~65, B~30
        pixels[idx] = 110 + (i % 8);
        pixels[idx + 1] = 65 + (i % 6);
        pixels[idx + 2] = 30 + (i % 4);
      } else {
        // Pale chlorotic/green rice blade: R~90, G~125, B~45
        pixels[idx] = 90 + (i % 10);
        pixels[idx + 1] = 125 + (i % 12);
        pixels[idx + 2] = 45 + (i % 8);
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(true);
    expect(leafCheck?.tip).not.toContain("Human face");
    expect(leafCheck?.tip).not.toContain("Drawing or cartoon");
  });

  it("accepts crop leaves held by a farmer's fingers in the field", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // 25% farmer's fingers holding leaf, 75% green/chlorotic crop leaf
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      if (i < W * H * 0.25) {
        // Human finger/hand tone
        pixels[idx] = 175 + (i % 5);
        pixels[idx + 1] = 120 + (i % 4);
        pixels[idx + 2] = 80 + (i % 3);
      } else {
        // Crop leaf
        pixels[idx] = 45 + (i % 15);
        pixels[idx + 1] = 135 + (i % 20);
        pixels[idx + 2] = 35 + (i % 10);
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(true);
    expect(leafCheck?.tip).not.toContain("Human face");
  });

  it("strictly rejects casual person portraits with clothing and hair", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // 15% face skin, 35% black/brown hair, 50% blue/grey clothing & room
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      if (i < W * H * 0.15) {
        // Human face skin: R~170, G~125, B~85
        pixels[idx] = 170 + (i % 4);
        pixels[idx + 1] = 125 + (i % 4);
        pixels[idx + 2] = 85 + (i % 4);
      } else if (i < W * H * 0.50) {
        // Dark hair / dark clothes: R~40, G~35, B~30
        pixels[idx] = 40 + (i % 5);
        pixels[idx + 1] = 35 + (i % 5);
        pixels[idx + 2] = 30 + (i % 5);
      } else {
        // Blue shirt / room background: R~50, G~80, B~140
        pixels[idx] = 50 + (i % 6);
        pixels[idx + 1] = 80 + (i % 6);
        pixels[idx + 2] = 140 + (i % 6);
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
    expect(leafCheck?.tip).toContain("Human face or skin detected");
  });

  it("strictly rejects dim/low-light indoor human faces and selfies with dark room background", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // Dim indoor lighting selfie: skin R ~ 65, G ~ 50, B ~ 42; dark room R ~ 35, G ~ 40, B ~ 48
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      if (i < W * H * 0.45) {
        // Human face skin in dim lighting
        pixels[idx] = 65 + (i % 6);
        pixels[idx + 1] = 50 + (i % 4);
        pixels[idx + 2] = 42 + (i % 3);
      } else {
        // Dark room ambient background
        pixels[idx] = 35 + (i % 5);
        pixels[idx + 1] = 40 + (i % 5);
        pixels[idx + 2] = 48 + (i % 6);
      }
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
  });

  it("strictly rejects wooden desks, furniture, and leather without chlorophyll", () => {
    const W = 64;
    const H = 64;
    const pixels = new Uint8ClampedArray(W * H * 4);

    // Brown wood grain: R~140, G~90, B~55 (brown/tan but NO leaf chlorophyll)
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      pixels[idx] = 140 + (i % 8);
      pixels[idx + 1] = 90 + (i % 6);
      pixels[idx + 2] = 55 + (i % 4);
      pixels[idx + 3] = 255;
    }

    const report = assessPixels(pixels, W, H);
    expect(report.ok).toBe(false);
    const leafCheck = report.checks.find((c) => c.id === "leaf");
    expect(leafCheck?.pass).toBe(false);
  });
});

describe("Square Viewfinder Reticle Cropping Geometry", () => {
  it("calculates exact center square coordinates for 16:9 video in 4:3 container", () => {
    const vw = 1280;
    const vh = 720;
    const containerW = 400;
    const containerH = 300;

    // object-cover scale factor:
    const scale = Math.min(vw / containerW, vh / containerH); // min(3.2, 2.4) = 2.4
    expect(scale).toBe(2.4);

    // Container center (200, 150)
    const rcx = 200;
    const rcy = 150;

    const vidCx = (vw / 2) + (rcx - containerW / 2) * scale;
    const vidCy = (vh / 2) + (rcy - containerH / 2) * scale;

    expect(vidCx).toBe(640);
    expect(vidCy).toBe(360);

    // A 240x240 on-screen reticle
    const reticleSize = 240;
    const cropSize = reticleSize * scale; // 240 * 2.4 = 576 px
    expect(cropSize).toBe(576);

    const sx = Math.max(0, Math.min(vw - cropSize, Math.floor(vidCx - cropSize / 2)));
    const sy = Math.max(0, Math.min(vh - cropSize, Math.floor(vidCy - cropSize / 2)));

    expect(sx).toBe(640 - 288); // 352
    expect(sy).toBe(360 - 288); // 72
    expect(sx + cropSize).toBeLessThanOrEqual(vw);
    expect(sy + cropSize).toBeLessThanOrEqual(vh);
  });
});
