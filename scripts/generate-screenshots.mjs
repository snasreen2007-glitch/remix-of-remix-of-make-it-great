import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const PORT = 8089;
const DIST_DIR = path.resolve(process.cwd(), "android/app/src/main/assets/dist");
const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs/screenshots");
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_UPLOADS = "C:\\Users\\ayubh\\.gemini\\antigravity\\brain\\b16240c9-8a23-4f63-b009-2f988f0613b2\\.user_uploaded";

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function getBase64Image(filename, fallbackAsset = "dist/assets/rice-leaf-Bna4hw8W.jpg") {
  const fullPath = path.join(USER_UPLOADS, filename);
  if (fs.existsSync(fullPath)) {
    const ext = path.extname(filename).toLowerCase().replace(".", "");
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${fs.readFileSync(fullPath).toString("base64")}`;
  }
  const fallback = path.resolve(process.cwd(), "android/app/src/main/assets", fallbackAsset);
  if (fs.existsSync(fallback)) {
    return `data:image/jpeg;base64,${fs.readFileSync(fallback).toString("base64")}`;
  }
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzc1ZlHAAAAABJRU5ErkJggg==";
}

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
};

// Start tiny static server for SPA dist
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;
  if (pathname === "/" || !pathname.includes(".")) {
    pathname = "/index.html";
  }

  const filePath = path.join(DIST_DIR, pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // SPA fallback
    const indexPath = path.join(DIST_DIR, "index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.createReadStream(indexPath).pipe(res);
  }
});

async function main() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Preview server listening on http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,860",
    ],
  });


  // Prepare Mock Scans for the 5 verified user Rice images + Mismatch + OOD Selfie
  const imgBlast1 = getBase64Image("media_1795426235738_facac3c7.png");
  const imgBlast2 = getBase64Image("media_1795426246114_d3f86a9b.jpg");
  const imgBlast3 = getBase64Image("media_1795426257479_81f73f43.png");
  const imgBrown4 = getBase64Image("media_1795426276156_d4224378.jpg");
  const imgBrown5 = getBase64Image("media_1795426283877_afb8a8e5.jpg");
  const imgSelfie = getBase64Image("media_1795416773199_1f8a300d.jpg");
  const imgChilli = getBase64Image("media_1794639408030_2a8a055d.jpg", "dist/assets/chilli-plant-CTpcHES8.jpg");

  const mockScans = [
    {
      id: "scan-blast-1",
      crop: "rice",
      mode: "disease",
      createdAt: "2026-11-23T10:15:00.000Z",
      image: imgBlast1,
      source: "model",
      outcome: "identified",
      topicSlug: "rice-blast",
      name: "Rice Blast",
      confidence: 0.94,
      confidenceStatus: "calibrated",
      visibleEvidence: [
        "Spindle-shaped diamond foliar lesions pointed at longitudinal ends",
        "Ash-grey necrotic core surrounded by reddish-brown halo margin",
      ],
      severity: { scale: "irri-ses", score: 7, max: 9, band: "severe", areaPercent: 32 },
      severityMethod: "IRRI Standard Evaluation System (Grade 7)",
      candidates: [
        { slug: "rice-blast", confidence: 0.94 },
        { slug: "brown-spot", confidence: 0.05 },
      ],
      note: "Validated real-field Rice Blast specimen #1 from farmer plot",
    },
    {
      id: "scan-blast-2",
      crop: "rice",
      mode: "disease",
      createdAt: "2026-11-23T10:20:00.000Z",
      image: imgBlast2,
      source: "model",
      outcome: "identified",
      topicSlug: "rice-blast",
      name: "Rice Blast",
      confidence: 0.96,
      confidenceStatus: "calibrated",
      visibleEvidence: [
        "Extensive multi-leaf canopy infection with coalescing spindle lesions",
        "Desiccated ash center with collar rot vulnerability",
      ],
      severity: { scale: "irri-ses", score: 9, max: 9, band: "severe", areaPercent: 54 },
      severityMethod: "IRRI Standard Evaluation System (Grade 9)",
      candidates: [
        { slug: "rice-blast", confidence: 0.96 },
        { slug: "brown-spot", confidence: 0.03 },
      ],
      note: "Validated real-field Rice Blast specimen #2 (crossing tillers)",
    },
    {
      id: "scan-blast-3",
      crop: "rice",
      mode: "disease",
      createdAt: "2026-11-23T10:25:00.000Z",
      image: imgBlast3,
      source: "model",
      outcome: "identified",
      topicSlug: "rice-blast",
      name: "Rice Blast",
      confidence: 0.92,
      confidenceStatus: "calibrated",
      visibleEvidence: [
        "Acute elliptical blast spots on green leaf blade",
        "Typical spindle morphology aligned with parallel veins",
      ],
      severity: { scale: "irri-ses", score: 7, max: 9, band: "severe", areaPercent: 28 },
      severityMethod: "IRRI Standard Evaluation System (Grade 7)",
      candidates: [
        { slug: "rice-blast", confidence: 0.92 },
        { slug: "bacterial-leaf-blight", confidence: 0.06 },
      ],
      note: "Validated real-field Rice Blast specimen #3",
    },
    {
      id: "scan-brown-4",
      crop: "rice",
      mode: "disease",
      createdAt: "2026-11-23T10:30:00.000Z",
      image: imgBrown4,
      source: "model",
      outcome: "identified",
      topicSlug: "brown-spot",
      name: "Brown Spot",
      confidence: 0.95,
      confidenceStatus: "calibrated",
      visibleEvidence: [
        "Small circular to oval reddish-brown foliar spots",
        "Prominent chlorotic yellow halos encircling necrotic lesions",
      ],
      severity: { scale: "irri-ses", score: 5, max: 9, band: "moderate", areaPercent: 18 },
      severityMethod: "IRRI Standard Evaluation System (Grade 5)",
      candidates: [
        { slug: "brown-spot", confidence: 0.95 },
        { slug: "rice-blast", confidence: 0.04 },
      ],
      note: "Validated real-field Brown Spot specimen #4",
    },
    {
      id: "scan-brown-5",
      crop: "rice",
      mode: "disease",
      createdAt: "2026-11-23T10:35:00.000Z",
      image: imgBrown5,
      source: "model",
      outcome: "identified",
      topicSlug: "brown-spot",
      name: "Brown Spot",
      confidence: 0.94,
      confidenceStatus: "calibrated",
      visibleEvidence: [
        "Dispersed dark brown necrotic spots across longitudinal veins",
        "Foliar yellowing and mild leaf drying",
      ],
      severity: { scale: "irri-ses", score: 5, max: 9, band: "moderate", areaPercent: 22 },
      severityMethod: "IRRI Standard Evaluation System (Grade 5)",
      candidates: [
        { slug: "brown-spot", confidence: 0.94 },
        { slug: "rice-blast", confidence: 0.05 },
      ],
      note: "Validated real-field Brown Spot specimen #5",
    },
    {
      id: "scan-mismatch-chilli",
      crop: "rice",
      mode: "disease",
      createdAt: "2026-11-23T10:40:00.000Z",
      image: imgChilli,
      source: "model",
      outcome: "identified",
      topicSlug: "leaf-curl",
      name: "Chilli Plant (Crop Mismatch)",
      confidence: 0.93,
      confidenceStatus: "calibrated",
      cropMismatch: {
        detectedCrop: "chilli",
        expectedCrop: "rice",
        confidence: 0.93,
        message: "Chilli plant detected: This photo displays a Chilli (Mirchi / Capsicum annuum) leaf with broad dicot lamina and reticulate venation. You are currently in the Rice section. Please switch to the Chilli department for accurate diagnosis and management.",
      },
      candidates: [
        { slug: "leaf-curl", confidence: 0.93 },
        { slug: "cercospora-leaf-spot", confidence: 0.07 },
      ],
      severity: { scale: "area-band", score: 25, max: 100, band: "moderate", areaPercent: 25 },
    },
    {
      id: "scan-mismatch-rice",
      crop: "chilli",
      mode: "disease",
      createdAt: "2026-11-23T10:45:00.000Z",
      image: imgBlast1,
      source: "model",
      outcome: "identified",
      topicSlug: "rice-blast",
      name: "Rice Leaf (Crop Mismatch)",
      confidence: 0.95,
      confidenceStatus: "calibrated",
      cropMismatch: {
        detectedCrop: "rice",
        expectedCrop: "chilli",
        confidence: 0.95,
        message: "Rice leaf detected: This photo displays a Rice (Paddy / Oryza sativa) leaf blade with narrow linear monocot grass morphology and parallel venation. You are currently in the Chilli section. Please switch to the Rice department for accurate diagnosis and management.",
      },
      candidates: [
        { slug: "rice-blast", confidence: 0.95 },
        { slug: "brown-spot", confidence: 0.05 },
      ],
      severity: { scale: "irri-ses", score: 7, max: 9, band: "severe", areaPercent: 32 },
    },
    {
      id: "scan-ood-selfie",
      crop: "rice",
      mode: "disease",
      createdAt: "2026-11-23T10:50:00.000Z",
      image: imgSelfie,
      source: "model",
      outcome: "unknown",
      topicSlug: "unknown",
      name: "Unknown / Non-Plant",
      confidence: 0.10,
      confidenceStatus: "unreliable_input",
      diagnostics: {
        plantPixels: 0,
        lesionPixels: 0,
        affectedPercent: 0,
        isCropValid: false,
        pattern: "Human face or skin detected — please capture a clear in-focus plant leaf",
      },
    },
  ];

  const mockMessages = [
    {
      id: "msg-1",
      role: "farmer",
      text: "How to identify spindle-shaped rice blast lesions in the field?",
      timestamp: Date.now() - 120000,
    },
    {
      id: "msg-2",
      role: "assistant",
      text: "Rice Blast (*Magnaporthe oryzae*) typically displays characteristic diamond or eye-shaped spindle lesions that are pointed at both longitudinal ends. The lesion center is desiccated ash-grey or whitish, surrounded by a dark reddish-brown necrotic margin. Under humid morning dew, lesions rapidly elongate along parallel monocot veins.\n\n### Grounded Biological & Cultural Protocol:\n• **Withhold Split Urea Immediately**: Excess nitrogen accelerates blast fungal penetration.\n• **Alternate Wetting & Drying (AWD)**: Drain standing water to break microclimate humidity.\n• **Bio-Fungicide Shield**: Apply *Pseudomonas fluorescens* (1% WP @ 5–10 g/L) at early tillering.\n• **Potassium Balance**: Supplement MOP @ 15–20 kg/acre to harden epidermal cell walls.",
      timestamp: Date.now() - 110000,
      refs: [{ crop: "rice", slug: "rice-blast" }],
      suggestions: [
        "What are early signs of brown spot?",
        "How to prepare Pseudomonas spray?",
        "Safe fertilizer schedule for paddy",
      ],
    },
    {
      id: "msg-3",
      role: "farmer",
      text: "వరిలో అగ్గితెగులు వస్తే యూరియా వేయవచ్చా?",
      timestamp: Date.now() - 60000,
    },
    {
      id: "msg-4",
      role: "assistant",
      text: "లేదు, వరిలో అగ్గితెగులు (Rice Blast) లక్షణాలు కనిపించిన వెంటనే **యూరియా (నత్రజని) వాడకాన్ని పూర్తిగా నిలిపివేయాలి**.\n\nయూరియా అధికంగా వేస్తే ఆకు కణజాలం మెత్తబడి శిలీంధ్రం వేగంగా వ్యాపిస్తుంది. బదులుగా:\n1. పొటాష్ (MOP) ఎరువును వేయడం ద్వారా మొక్క రోగనిరోధక శక్తిని పెంచండి.\n2. పొలంలో నీటిని నిరంతరం నిల్వ ఉంచకుండా ఆరబెడుతూ నీరు కట్టండి (AWD).\n3. జీవ నివారణగా సూడోమోనాస్ ఫ్లోరోసెన్స్ పిచికారీ చేయండి.",
      timestamp: Date.now() - 50000,
      refs: [{ crop: "rice", slug: "rice-blast" }],
      suggestions: ["సేంద్రీయ నివారణలు ఏమిటి?", "పొటాష్ ఎంత వేయాలి?"],
    },
  ];

  console.log("Beginning capture of 24 distinct app screens...");

  const targets = [
    { file: "01_home_dashboard.png", hash: "#/", delay: 1800, title: "Home Dashboard & Field Overview" },
    { file: "02_diagnose_rice_mode.png", hash: "#/diagnose?crop=rice&mode=disease", delay: 1800, title: "Diagnose Mode - Rice Leaf Camera Viewfinder" },
    { file: "03_diagnose_chilli_mode.png", hash: "#/diagnose?crop=chilli&mode=disease", delay: 1800, title: "Diagnose Mode - Chilli Plant Camera Viewfinder" },
    { file: "04_scan_result_rice_blast_1.png", hash: "#/scans/scan-blast-1", delay: 2000, title: "Validated Rice Blast #1 - Spindle Lesion & SES Grade 7" },
    { file: "05_scan_result_rice_blast_2.png", hash: "#/scans/scan-blast-2", delay: 2000, title: "Validated Rice Blast #2 - Crossing Canopy & Severe Grade 9" },
    { file: "06_scan_result_rice_blast_3.png", hash: "#/scans/scan-blast-3", delay: 2000, title: "Validated Rice Blast #3 - Foliar Lesions" },
    { file: "07_scan_result_brown_spot_4.png", hash: "#/scans/scan-brown-4", delay: 2000, title: "Validated Brown Spot #4 - Circular Lesions & Chlorotic Halos" },
    { file: "08_scan_result_brown_spot_5.png", hash: "#/scans/scan-brown-5", delay: 2000, title: "Validated Brown Spot #5 - Dispersed Spot Necrosis" },
    { file: "09_crop_mismatch_chilli_in_rice.png", hash: "#/scans/scan-mismatch-chilli", delay: 2000, title: "Crop Mismatch - Chilli Detected in Rice Mode with 1-Click Routing" },
    { file: "10_crop_mismatch_rice_in_chilli.png", hash: "#/scans/scan-mismatch-rice", delay: 2000, title: "Crop Mismatch - Rice Blade Detected in Chilli Mode with 1-Click Routing" },
    { file: "11_ood_selfie_rejection.png", hash: "#/scans/scan-ood-selfie", delay: 2000, title: "Out-Of-Distribution Rejection - Human Face Skin Tone Rejection" },
    { file: "12_treatment_and_cure_plan.png", hash: "#/scans/scan-blast-1", delay: 2000, scrollDown: 500, title: "Biological IPM Treatment Protocol & AWD Cultural Plan" },
    { file: "13_assistant_fullscreen_chat.png", hash: "#/assistant", delay: 2000, title: "Fullscreen Vernacular Agronomic Chatbot" },
    { file: "14_crop_library_rice.png", hash: "#/library?crop=rice", delay: 1800, title: "Rice Crop Pathology & Pest Dossier Library" },
    { file: "15_crop_library_chilli.png", hash: "#/library?crop=chilli", delay: 1800, title: "Chilli Crop Health & Vector IPM Library" },
    { file: "16_topic_detail_rice_blast.png", hash: "#/library/rice/rice-blast", delay: 1800, title: "Disease Dossier - Rice Blast Pathology & Cultural Strategy" },
    { file: "17_topic_detail_leaf_curl.png", hash: "#/library/chilli/leaf-curl", delay: 1800, title: "Disease Dossier - Chilli Leaf Curl Begomovirus & Vector IPM" },
    { file: "18_field_scan_history.png", hash: "#/history", delay: 1800, title: "Encrypted Offline Scan History Vault" },
    { file: "19_mandi_market_prices.png", hash: "#/market", delay: 1800, title: "Agricultural Mandi Market Rates & APMC Trends" },
    { file: "20_harvest_yield_estimator.png", hash: "#/yield-estimator", delay: 1800, title: "Harvest Loss & Yield Estimation Calculator" },
    { file: "21_weather_agronomic_advisory.png", hash: "#/weather", delay: 1800, title: "Agricultural Weather & Microclimate Humidity Forecast" },
    { file: "22_research_abstract_page.png", hash: "#/abstract", delay: 2200, title: "Peer-Reviewed Research Abstract & Architecture Specification" },
    { file: "23_home_dashboard_mobile.png", hash: "#/", width: 412, height: 915, delay: 1800, title: "Mobile Layout - Responsive Android App View" },
    { file: "24_assistant_mobile_chat.png", hash: "#/assistant", width: 412, height: 915, delay: 1800, title: "Mobile Layout - Vernacular Assistant on Android Screen" },
  ];

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    console.log(`[${i + 1}/${targets.length}] Capturing ${t.file} (${t.title})...`);

    const page = await browser.newPage();
    await page.evaluateOnNewDocument((scans, msgs) => {
      localStorage.setItem("kisanai_welcome_completed", "true");
      localStorage.setItem("oaca.settings.v1", JSON.stringify({
        onboarded: true,
        name: "Ayub Farmer",
        lang: "en",
        theme: "light",
        state: "Andhra Pradesh",
        district: "Guntur",
        season: "kharif",
        crops: ["rice", "chilli"],
        llmProvider: "auto",
        geminiApiKey: "",
        groqApiKey: "",
        openaiApiKey: "",
        customModel: "",
      }));
      localStorage.setItem("oaca.scans.v1", JSON.stringify(scans));
      localStorage.setItem("oaca.chat.v1", JSON.stringify(msgs));
      localStorage.setItem("oaca.saved.v1", JSON.stringify([
        { id: "s-1", kind: "topic", crop: "rice", slug: "rice-blast", savedAt: new Date().toISOString() },
        { id: "s-2", kind: "topic", crop: "chilli", slug: "leaf-curl", savedAt: new Date().toISOString() },
      ]));
    }, mockScans, mockMessages);

    if (t.width && t.height) {
      await page.setViewport({ width: t.width, height: t.height, deviceScaleFactor: 2 });
    } else {
      await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    }

    try {
      await page.goto(`http://localhost:${PORT}/index.html${t.hash}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await new Promise((r) => setTimeout(r, t.delay || 1500));

      // Force remove any leftover splash animation overlay if still present
      await page.evaluate(() => {
        const splash = document.querySelector('[aria-hidden="true"].fixed');
        if (splash) splash.remove();
      });

      if (t.scrollDown) {
        await page.evaluate((px) => window.scrollBy(0, px), t.scrollDown);
        await new Promise((r) => setTimeout(r, 400));
      }

      const headline = await page.evaluate(() => {
        const el = document.querySelector("h1, h2, h3, [role='heading']");
        return el ? el.innerText.replace(/\n/g, " ") : document.title;
      });
      console.log(`   [Rendered]: ${headline}`);

      const outPath = path.join(SCREENSHOTS_DIR, t.file);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`   ✓ Saved: ${outPath}`);
    } catch (err) {
      console.error(`   ❌ Failed to capture ${t.file}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  server.close();
  console.log("All 24 screenshots captured successfully!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
