import chilliField from "@/assets/chilli-field.jpg";
import chilliPlant from "@/assets/chilli-plant.jpg";
import riceField from "@/assets/rice-field.jpg";
import riceLeaf from "@/assets/rice-leaf.jpg";
import type { Lang } from "./i18n";

export type CropKey = "rice" | "chilli";
export type Mode = "disease" | "pest";
type L10n = { en: string; hi?: string; te?: string; ta?: string; kn?: string; mr?: string };

export type Topic = {
  slug: string;
  crop: CropKey;
  kind: Mode;
  name: L10n;
  scientific: string;
  summary: L10n;
  parts: string[];
  symptoms: string[];
  causes: string[];
  identify: string[];
  lookalikes: string;
  severityNote: string;
  immediate: string[];
  cultural: string[];
  prevention: { title: string; body: string }[];
  monitoring: string[];
  getHelp: string;
};

export type Crop = {
  key: CropKey;
  name: L10n;
  description: L10n;
  field: string;
  closeup: string;
  photoGuide: { disease: string[]; pest: string[] };
  stages: { name: string; watch: string }[];
  weeklyChecks: string[];
};

export const crops: Crop[] = [
  {
    key: "rice",
    name: { en: "Rice", hi: "धान", te: "వరి" },
    description: {
      en: "Leaves, neck and panicle problems change quickly between stages. Note the crop stage with every check.",
      hi: "पत्ती, गर्दन और बाली की समस्याएँ अवस्था के साथ जल्दी बदलती हैं। हर जाँच में फ़सल की अवस्था लिखें।",
      te: "ఆకు, మెడ, కంకి సమస్యలు దశల మధ్య త్వరగా మారుతాయి. ప్రతి పరిశీలనలో పంట దశను గమనించండి.",
    },
    field: riceField,
    closeup: riceLeaf,
    photoGuide: {
      disease: ["Leaf symptoms — fill the frame with one affected leaf", "Neck or panicle symptoms at heading", "Keep a healthy leaf nearby for comparison"],
      pest: ["Insects at the base of the plant near the water", "Dead central shoots or white, empty panicles", "Folded leaves or galls in place of the central leaf"],
    },
    stages: [
      { name: "Nursery", watch: "Yellowing seedlings, uneven growth, early leaf spots." },
      { name: "Tillering", watch: "Leaf spots, dead central shoots, onion-like galls." },
      { name: "Panicle initiation", watch: "Spots spreading on upper leaves, planthoppers at the base." },
      { name: "Flowering", watch: "Neck lesions, white or empty panicles." },
      { name: "Grain filling", watch: "Discoloured grain, hopperburn patches, lodging." },
    ],
    weeklyChecks: [
      "Walk a zig-zag path through the field, not only along the bund.",
      "Look at leaves from 10 hills for spots with pale centres.",
      "Part the plants and look at the base for brown insects.",
      "Check for dried central shoots or pale, empty panicles.",
      "Note water level, recent weather and crop stage.",
    ],
  },
  {
    key: "chilli",
    name: { en: "Chilli", hi: "मिर्च", te: "మిరప" },
    description: {
      en: "Many chilli problems start small — under a leaf or on a single fruit. A few minutes each week goes a long way.",
      hi: "मिर्च की कई समस्याएँ छोटी शुरू होती हैं — पत्ती के नीचे या एक फल पर। हर हफ़्ते कुछ मिनट की जाँच बहुत काम आती है।",
      te: "మిరప సమస్యలు చాలా వరకు చిన్నగా మొదలవుతాయి — ఆకు కింద లేదా ఒక కాయపై. వారానికి కొన్ని నిమిషాల పరిశీలన ఎంతో ఉపయోగం.",
    },
    field: chilliField,
    closeup: chilliPlant,
    photoGuide: {
      disease: ["Leaf symptoms — top and underside of one affected leaf", "Fruit symptoms — spots, rings or soft patches", "Curled growing tips, photographed from above"],
      pest: ["Leaf undersides where insects gather", "Curled or silvered young leaves at the tip", "Sticky residue or black sooty film"],
    },
    stages: [
      { name: "Nursery", watch: "Damping off, weak seedlings, early curling." },
      { name: "Establishment", watch: "Wilting after transplant, gaps in rows." },
      { name: "Vegetative", watch: "Curling or mottled new leaves, small insects under leaves." },
      { name: "Flowering", watch: "Flower drop during heat or water stress, thrips in flowers." },
      { name: "Fruiting", watch: "Dark sunken spots or soft patches on fruit, twig die-back." },
    ],
    weeklyChecks: [
      "Turn over leaves on 5–10 plants and look for insects or eggs.",
      "Look for curling, mottling or unusually small new leaves.",
      "Check fruit for dark, sunken or soft spots.",
      "Feel the soil — both waterlogging and dryness stress chilli.",
    ],
  },
];

const generalImmediate = [
  "Check at least 10 plants across the field, not only the one in the photo.",
  "Note when you first saw the problem and whether it is spreading.",
];

export const topics: Topic[] = [
  {
    slug: "rice-blast", crop: "rice", kind: "disease",
    name: { en: "Rice Blast", hi: "धान का ब्लास्ट (झोंका) रोग", te: "అగ్గి తెగులు" },
    scientific: "Magnaporthe oryzae (Pyricularia oryzae)",
    summary: {
      en: "A fungal disease that causes eye-shaped leaf spots and can rot the panicle neck, leaving empty grain.",
      hi: "एक फफूंद रोग जिससे पत्तियों पर आँख के आकार के धब्बे बनते हैं और बाली की गर्दन सड़ सकती है।",
      te: "ఆకులపై కంటి ఆకారపు మచ్చలు కలిగించి, కంకి మెడను కుళ్ళబెట్టి గింజలను తాలుగా చేసే శిలీంధ్ర వ్యాధి.",
    },
    parts: ["Leaf", "Collar", "Node", "Neck / panicle"],
    symptoms: ["Spindle or eye-shaped spots with grey-white centres and brown edges", "Spots join together and dry whole leaves in severe cases", "Neck turns dark brown to black; the panicle breaks or stays white and empty"],
    causes: ["A fungus spread by wind-borne spores", "Long dew periods, high humidity and cool nights", "Excess nitrogen fertiliser makes plants more susceptible"],
    identify: ["Look for pointed, eye-shaped spots — not round ones", "At heading, check the neck just below the panicle", "Patches often appear after several cool, humid nights"],
    lookalikes: "Brown spot lesions are rounder with a yellow halo. Nutrient stress can also discolour leaves.",
    severityNote: "Rice leaf diseases are rated on the IRRI Standard Evaluation System (SES) 0–9 scale.",
    immediate: [...generalImmediate, "Hold back further nitrogen top-dressing until you have advice.", "If necks are affected near flowering, contact your agricultural officer quickly."],
    cultural: ["Use balanced fertiliser and split nitrogen doses", "Keep bunds free of grassy weeds that can host the fungus"],
    prevention: [
      { title: "Resistant varieties", body: "Ask your local office which blast-tolerant varieties suit your district and season." },
      { title: "Balanced nitrogen", body: "Avoid heavy nitrogen in one dose; split applications as advised." },
      { title: "Clean seed", body: "Use healthy, certified seed from a trusted source." },
    ],
    monitoring: ["Check leaves weekly from tillering onward", "Check necks closely from heading to grain filling", "Watch closely after cool nights with heavy dew"],
    getHelp: "Neck symptoms near flowering can cause heavy loss — seek local advice the same week.",
  },
  {
    slug: "brown-spot", crop: "rice", kind: "disease",
    name: { en: "Brown Spot", hi: "भूरा धब्बा रोग", te: "గోధుమ రంగు మచ్చ తెగులు" },
    scientific: "Bipolaris oryzae (Cochliobolus miyabeanus)",
    summary: {
      en: "A fungal disease that leaves oval brown spots on leaves and grain, often worse where soil is poor.",
      hi: "एक फफूंद रोग जो पत्तियों और दानों पर अंडाकार भूरे धब्बे छोड़ता है, कमज़ोर मिट्टी में ज़्यादा होता है।",
      te: "ఆకులు, గింజలపై అండాకార గోధుమ మచ్చలు కలిగించే శిలీంధ్ర వ్యాధి; సారం తక్కువ నేలల్లో ఎక్కువ.",
    },
    parts: ["Leaf", "Leaf sheath", "Grain husk"],
    symptoms: ["Small oval brown spots, often with a grey centre and yellow halo", "Many spots can make whole leaves look rusty", "Dark spots or discolouration on grain husks"],
    causes: ["A seed-borne fungus", "Nutrient-poor soils and water stress", "Warm, humid weather"],
    identify: ["Spots are round to oval, not pointed like blast", "Look at older leaves first", "Check grain husks later in the season"],
    lookalikes: "Early blast lesions and potassium deficiency can look similar in photos.",
    severityNote: "Rated on the IRRI SES 0–9 scale by the share of leaf area affected.",
    immediate: [...generalImmediate, "Review fertiliser and water history with your agricultural officer."],
    cultural: ["Correct soil nutrient problems based on a soil test", "Avoid drought stress during the crop"],
    prevention: [
      { title: "Healthy seed", body: "Use clean, certified seed; the fungus can carry over on seed." },
      { title: "Soil health", body: "A soil test helps you correct deficiencies that make plants weaker." },
      { title: "Field hygiene", body: "Remove infected stubble and weeds after harvest." },
    ],
    monitoring: ["Check older leaves every week", "Watch fields with poor soil or uneven water more closely"],
    getHelp: "If spots cover large parts of leaves across the field, ask about soil health and next steps.",
  },
  {
    slug: "bacterial-leaf-blight", crop: "rice", kind: "disease",
    name: { en: "Bacterial Leaf Blight", hi: "जीवाणु पत्ती झुलसा", te: "బ్యాక్టీరియా ఆకు ఎండు తెగులు" },
    scientific: "Xanthomonas oryzae pv. oryzae",
    summary: {
      en: "A bacterial disease that dries leaves from the tip and edges, spreading quickly with water and wind.",
      hi: "एक जीवाणु रोग जो पत्तियों को सिरे और किनारों से सुखाता है, पानी और हवा से तेज़ी से फैलता है।",
      te: "ఆకులను కొన మరియు అంచుల నుండి ఎండబెట్టే బ్యాక్టీరియా వ్యాధి; నీరు, గాలితో వేగంగా వ్యాపిస్తుంది.",
    },
    parts: ["Leaf blade", "Whole seedling (kresek)"],
    symptoms: ["Water-soaked yellow streaks starting at the leaf tip or edges", "Lesions have wavy margins and turn straw-coloured or grey-white", "Young plants may wilt and die (kresek)", "Milky droplets of bacterial ooze in the early morning"],
    causes: ["Bacteria spread through irrigation water, rain splash and wounds", "Storms, flooding and high nitrogen favour the disease"],
    identify: ["Start at the leaf tip and follow the edge for wavy yellow lesions", "Look for ooze droplets early in the morning", "Cut a leaf and dip the end in clear water — cloudy streams suggest bacteria"],
    lookalikes: "Nutrient deficiency and drought can dry leaf tips without wavy, water-soaked edges.",
    severityNote: "Rated on the IRRI SES 0–9 scale by lesion area.",
    immediate: [...generalImmediate, "Avoid moving water from affected plots to healthy ones.", "Hold back extra nitrogen until you have advice."],
    cultural: ["Drain the field briefly where advised", "Avoid clipping seedling tips when the disease is present"],
    prevention: [
      { title: "Resistant varieties", body: "Ask which blight-tolerant varieties are recommended locally." },
      { title: "Water management", body: "Avoid flowing irrigation water from infected fields into healthy ones." },
      { title: "Clean up", body: "Remove infected stubble, straw and weeds after harvest." },
    ],
    monitoring: ["Inspect after storms and heavy rain", "Check leaf tips and edges weekly"],
    getHelp: "Kresek in young plants or rapid spread after a storm needs prompt local advice.",
  },
  {
    slug: "tungro", crop: "rice", kind: "disease",
    name: { en: "Tungro", hi: "टुंग्रो रोग", te: "టుంగ్రో వైరస్ తెగులు" },
    scientific: "Rice tungro bacilliform virus + Rice tungro spherical virus",
    summary: {
      en: "A virus disease spread by green leafhoppers that turns leaves yellow-orange and stunts plants.",
      hi: "हरे फुदके से फैलने वाला वायरस रोग जो पत्तियों को पीला-नारंगी कर पौधों को बौना कर देता है।",
      te: "పచ్చ దీపపు పురుగుల ద్వారా వ్యాపించే వైరస్ వ్యాధి; ఆకులను పసుపు-నారింజ రంగుకు మార్చి మొక్కలను పొట్టిగా చేస్తుంది.",
    },
    parts: ["Leaf", "Whole plant"],
    symptoms: ["Yellow to orange leaves, starting from the tip", "Stunted plants with fewer tillers", "Patchy spread in the field"],
    causes: ["Two viruses spread by the green leafhopper (Nephotettix virescens)", "Infected stubble and volunteer plants keep the virus around"],
    identify: ["Look for yellow-orange discolouration with stunting", "Check for small green leafhoppers on leaves", "Infected plants often appear in patches"],
    lookalikes: "Nitrogen or zinc deficiency also cause yellowing, but usually without patchy stunting.",
    severityNote: "Rated on the IRRI SES 0–9 scale using stunting and leaf discolouration.",
    immediate: [...generalImmediate, "Remove clearly infected hills early and bury them away from the field."],
    cultural: ["Plant at the same time as neighbours to break the leafhopper cycle", "Remove volunteer plants and stubble"],
    prevention: [
      { title: "Synchronous planting", body: "Planting with neighbours reduces leafhopper build-up." },
      { title: "Resistant varieties", body: "Ask which tungro-tolerant varieties suit your area." },
      { title: "Clean fallow", body: "Remove stubble and volunteer rice between seasons." },
    ],
    monitoring: ["Look for leafhoppers weekly in the early crop", "Watch for patches of yellow-orange plants"],
    getHelp: "Tungro cannot be cured in infected plants — get advice early to protect the rest of the field.",
  },
  {
    slug: "brown-planthopper", crop: "rice", kind: "pest",
    name: { en: "Brown Planthopper", hi: "भूरा फुदका", te: "సుడి దోమ (గోధుమ దోమ)" },
    scientific: "Nilaparvata lugens",
    summary: {
      en: "Small brown insects that feed at the base of rice plants and can cause circular patches of drying (hopperburn).",
      hi: "छोटे भूरे कीट जो पौधे के आधार पर रस चूसते हैं और गोल-गोल सूखे धब्बे (हॉपरबर्न) बना सकते हैं।",
      te: "వరి మొక్క అడుగున రసం పీల్చి, పొలంలో గుండ్రని ఎండిన మడులు (సుడి) కలిగించే చిన్న గోధుమ పురుగులు.",
    },
    parts: ["Stem base", "Whole plant"],
    symptoms: ["Brown insects clustered at the base of plants near the water", "Plants yellow then dry in circular patches (hopperburn)", "Sticky honeydew and black sooty mould on lower parts"],
    causes: ["Excess nitrogen and dense planting", "Continuous standing water and humid canopy"],
    identify: ["Part the plants and look at the base", "Tap a few hills over water — count insects that fall", "Look for circular patches of dried plants"],
    lookalikes: "Water stress or stem borer damage also dries plants, but without insects at the base.",
    severityNote: "Damage is judged from visible drying (hopperburn) and insect numbers at the base.",
    immediate: [...generalImmediate, "Drain the field for a few days where advised to reduce humidity at the base.", "Count insects on 10 hills and share the count with your agricultural officer."],
    cultural: ["Avoid excess nitrogen", "Leave alleyways in the crop where locally recommended for air movement"],
    prevention: [
      { title: "Balanced fertiliser", body: "Too much nitrogen makes plants attractive to planthoppers." },
      { title: "Spacing", body: "Avoid very dense planting that keeps the base humid." },
      { title: "Protect natural enemies", body: "Spiders and mirid bugs eat planthoppers; avoid unnecessary sprays." },
    ],
    monitoring: ["Check plant bases weekly from tillering", "Inspect more often during humid weather"],
    getHelp: "Hopperburn spreads fast — get local advice as soon as patches appear.",
  },
  {
    slug: "yellow-stem-borer", crop: "rice", kind: "pest",
    name: { en: "Yellow Stem Borer", hi: "पीला तना छेदक", te: "కాండం తొలుచు పురుగు" },
    scientific: "Scirpophaga incertulas",
    summary: {
      en: "Caterpillars bore into rice stems, killing the central shoot or leaving white, empty panicles.",
      hi: "इल्लियाँ तने में घुसकर बीच की पत्ती सुखा देती हैं या सफ़ेद, खाली बालियाँ छोड़ती हैं।",
      te: "గొంగళి పురుగులు కాండంలోకి తొలిచి, మధ్య మొవ్వును ఎండబెట్టడం లేదా తెల్ల కంకులు కలిగిస్తాయి.",
    },
    parts: ["Stem", "Central shoot", "Panicle"],
    symptoms: ["Dead heart — the central shoot dries and pulls out easily", "White ear — panicles stay white and empty", "Small holes near the stem base", "Egg masses covered with buff hairs near leaf tips"],
    causes: ["Moths lay eggs on leaves; larvae bore into stems", "Stubble left after harvest carries the pest over"],
    identify: ["Pull a dried central shoot — it comes out easily", "Look for small holes and frass on the stem", "Check leaf tips for hairy egg masses"],
    lookalikes: "Rodents and water stress can also cause dried tillers.",
    severityNote: "Rated by the share of dead hearts or white ears in the hills checked.",
    immediate: [...generalImmediate, "Collect and destroy egg masses you find on leaves.", "Pull out and destroy dead hearts."],
    cultural: ["Clip seedling tips before transplanting where advised to remove egg masses", "Plough in stubble after harvest"],
    prevention: [
      { title: "Destroy stubble", body: "Ploughing stubble after harvest removes hibernating larvae." },
      { title: "Timely planting", body: "Plant at the time recommended for your district." },
      { title: "Traps for monitoring", body: "Pheromone or light traps show when moths are active." },
    ],
    monitoring: ["Count dead hearts on 10 hills during tillering", "Check for white ears at heading"],
    getHelp: "If dead hearts or white ears are common across the field, ask for local guidance.",
  },
  {
    slug: "leaf-folder", crop: "rice", kind: "pest",
    name: { en: "Leaf Folder", hi: "पत्ती लपेटक", te: "ఆకు ముడత పురుగు" },
    scientific: "Cnaphalocrocis medinalis",
    summary: {
      en: "Caterpillars fold rice leaves lengthwise and scrape the green tissue inside, leaving white streaks.",
      hi: "इल्लियाँ पत्तियों को लंबाई में मोड़कर अंदर का हरा भाग खुरचती हैं, जिससे सफ़ेद धारियाँ बनती हैं।",
      te: "గొంగళి పురుగులు ఆకులను పొడవుగా మడిచి లోపలి పచ్చని భాగాన్ని గీకి తెల్లని చారలు మిగులుస్తాయి.",
    },
    parts: ["Leaf"],
    symptoms: ["Leaves folded lengthwise into tubes", "White, papery streaks where green tissue is scraped", "A green caterpillar inside the fold"],
    causes: ["Moths lay eggs on leaves", "High nitrogen and shade favour the pest"],
    identify: ["Open a folded leaf and look for the caterpillar", "Count damaged leaves on a few hills"],
    lookalikes: "Some leaf diseases cause white streaks but leaves are not folded.",
    severityNote: "Rated by the share of damaged leaves, especially the top leaves near flowering.",
    immediate: [...generalImmediate, "Count damaged leaves on 10 hills, focusing on the top leaves."],
    cultural: ["Avoid excess nitrogen", "Remove grassy weeds from bunds"],
    prevention: [
      { title: "Balanced nitrogen", body: "Lush, dark-green crops attract more moths." },
      { title: "Protect natural enemies", body: "Many wasps and spiders attack leaf folders." },
    ],
    monitoring: ["Check top leaves weekly from tillering to flowering"],
    getHelp: "Damage to the top leaves near flowering matters most — ask for advice if it is widespread.",
  },
  {
    slug: "gall-midge", crop: "rice", kind: "pest",
    name: { en: "Gall Midge", hi: "गॉल मिज", te: "ఉల్లికోడు" },
    scientific: "Orseolia oryzae",
    summary: {
      en: "A small fly whose larvae turn the central leaf into a hollow tube (silver or onion shoot) that never bears a panicle.",
      hi: "एक छोटी मक्खी जिसकी इल्ली बीच की पत्ती को खोखली नली (प्याज़ जैसी पत्ती) बना देती है, जिसमें बाली नहीं आती।",
      te: "చిన్న ఈగ; దాని పిల్ల పురుగు మధ్య ఆకును ఉల్లికాడ లాంటి గొట్టంగా మారుస్తుంది, దానికి కంకి రాదు.",
    },
    parts: ["Central shoot", "Tiller"],
    symptoms: ["Silvery-white or pale green tube in place of the central leaf (onion shoot)", "Affected tillers do not produce panicles", "Plants may produce extra tillers"],
    causes: ["Adult midges lay eggs on young plants", "Cloudy, humid weather and late planting favour the pest", "Volunteer rice and grassy weeds host the pest"],
    identify: ["Look for tubular, onion-like shoots during tillering", "Count affected tillers on a few hills"],
    lookalikes: "Few other problems produce the distinctive onion-shaped tube.",
    severityNote: "Rated by the share of tillers with silver shoots.",
    immediate: [...generalImmediate, "Count silver shoots on 10 hills and share the count with your agricultural officer."],
    cultural: ["Plant early in the recommended window", "Remove volunteer rice and grassy weeds"],
    prevention: [
      { title: "Resistant varieties", body: "Ask about gall-midge-tolerant varieties for your district." },
      { title: "Timely planting", body: "Late-planted crops often suffer more." },
    ],
    monitoring: ["Check for silver shoots weekly during tillering"],
    getHelp: "If many tillers show silver shoots, ask for local guidance on management.",
  },
  {
    slug: "leaf-curl", crop: "chilli", kind: "disease",
    name: { en: "Leaf Curl", hi: "पत्ती मरोड़ रोग", te: "ఆకు ముడత తెగులు" },
    scientific: "Chilli leaf curl virus (begomovirus), spread by whitefly",
    summary: {
      en: "Leaves curl, pucker and stay small; plants become stunted with few fruits. Often linked to whitefly-spread virus.",
      hi: "पत्तियाँ मुड़ती, सिकुड़ती और छोटी रहती हैं; पौधे बौने और कम फल वाले हो जाते हैं। अक्सर सफ़ेद मक्खी से फैले वायरस से जुड़ा।",
      te: "ఆకులు ముడుచుకుని, ముడతలు పడి చిన్నవిగా ఉంటాయి; మొక్కలు పొట్టిగా, తక్కువ కాయలతో ఉంటాయి. తెల్లదోమ వ్యాపించే వైరస్‌తో సంబంధం.",
    },
    parts: ["Young leaves", "Growing tip", "Whole plant"],
    symptoms: ["Upward or downward curling and puckering of leaves", "Small, thick, pale leaves at the tip", "Stunted, bushy plants with few flowers and fruits"],
    causes: ["Virus spread by whitefly (Bemisia tabaci)", "Thrips and mites can cause similar curling (the 'murda' complex)", "Infected seedlings and weeds carry the virus"],
    identify: ["Check the youngest leaves at the growing tip", "Turn leaves over and look for whitefly, thrips or mites", "Note whether affected plants are scattered or in patches"],
    lookalikes: "Thrips cause upward curl, mites cause downward curl; herbicide drift and water stress can also distort leaves.",
    severityNote: "Commonly rated on a 0–4 leaf curl symptom scale.",
    immediate: [...generalImmediate, "Pull out clearly infected young plants and remove them from the field.", "Check leaf undersides for whitefly."],
    cultural: ["Raise seedlings under insect-proof net", "Plant border rows of a tall crop where locally advised", "Keep the field and bunds weed-free"],
    prevention: [
      { title: "Healthy seedlings", body: "Raise seedlings under net so they start virus-free." },
      { title: "Early removal", body: "Removing infected plants early limits spread." },
      { title: "Monitor whitefly", body: "Yellow sticky traps show when whitefly numbers rise." },
    ],
    monitoring: ["Check growing tips twice a week in the first two months", "Use yellow sticky traps to monitor whitefly"],
    getHelp: "Virus-infected plants don't recover — get local advice early to protect healthy plants.",
  },
  {
    slug: "cercospora-leaf-spot", crop: "chilli", kind: "disease",
    name: { en: "Cercospora Leaf Spot", hi: "सर्कोस्पोरा पत्ती धब्बा", te: "సెర్కోస్పోరా ఆకు మచ్చ తెగులు" },
    scientific: "Cercospora capsici",
    summary: {
      en: "A fungal disease causing round 'frog-eye' spots with pale centres; leaves yellow and drop.",
      hi: "एक फफूंद रोग जिसमें हल्के बीच वाले गोल 'मेंढक-आँख' धब्बे बनते हैं; पत्तियाँ पीली होकर गिरती हैं।",
      te: "లేత మధ్యభాగంతో గుండ్రని 'కప్ప కన్ను' మచ్చలు కలిగించే శిలీంధ్ర వ్యాధి; ఆకులు పసుపుగా మారి రాలిపోతాయి.",
    },
    parts: ["Leaf", "Stem", "Fruit stalk"],
    symptoms: ["Round spots with a light grey centre and dark brown edge", "Leaves turn yellow and fall early", "Spots may appear on stems and fruit stalks"],
    causes: ["A fungus surviving on crop debris and seed", "Warm, humid weather and leaf wetness"],
    identify: ["Look for the frog-eye pattern on older leaves", "Check fallen leaves for the same spots"],
    lookalikes: "Bacterial leaf spot is smaller and greasy-looking without a pale centre.",
    severityNote: "Rated by the share of leaf area with spots.",
    immediate: [...generalImmediate, "Remove heavily spotted leaves and fallen debris."],
    cultural: ["Avoid overhead irrigation", "Space plants for airflow"],
    prevention: [
      { title: "Crop rotation", body: "Avoid growing chilli in the same plot season after season." },
      { title: "Clean field", body: "Remove crop debris after harvest." },
    ],
    monitoring: ["Check older leaves weekly in humid weather"],
    getHelp: "If leaf drop is heavy, ask for locally verified advice.",
  },
  {
    slug: "bacterial-leaf-spot", crop: "chilli", kind: "disease",
    name: { en: "Bacterial Leaf Spot", hi: "जीवाणु पत्ती धब्बा", te: "బ్యాక్టీరియా ఆకు మచ్చ తెగులు" },
    scientific: "Xanthomonas spp.",
    summary: {
      en: "A bacterial disease causing small water-soaked spots that turn dark and may cause leaf drop and scabby fruit.",
      hi: "एक जीवाणु रोग जिसमें छोटे पानीदार धब्बे काले हो जाते हैं; पत्तियाँ गिर सकती हैं और फल खुरदुरे हो सकते हैं।",
      te: "చిన్న నీటి మచ్చలు నల్లగా మారే బ్యాక్టీరియా వ్యాధి; ఆకులు రాలడం, కాయలపై గరుకు మచ్చలు రావచ్చు.",
    },
    parts: ["Leaf", "Fruit"],
    symptoms: ["Small water-soaked spots that turn dark brown", "Spots may have a yellow halo and join together", "Raised, scabby spots on fruit", "Leaf drop in wet weather"],
    causes: ["Bacteria carried on seed and crop debris", "Spread by rain splash and handling wet plants"],
    identify: ["Look for small, greasy-looking dark spots", "Check fruit for raised scabs"],
    lookalikes: "Cercospora spots are larger with pale centres.",
    severityNote: "Rated by the share of leaf area with spots.",
    immediate: [...generalImmediate, "Avoid working in the crop while leaves are wet."],
    cultural: ["Avoid overhead irrigation", "Remove infected debris"],
    prevention: [
      { title: "Clean seed", body: "Use healthy, certified seed." },
      { title: "Rotation", body: "Rotate away from chilli, tomato and capsicum." },
    ],
    monitoring: ["Check after rain for new spots"],
    getHelp: "If spots spread quickly after rain, ask for local advice.",
  },
  {
    slug: "powdery-mildew", crop: "chilli", kind: "disease",
    name: { en: "Powdery Mildew", hi: "चूर्णिल आसिता (पाउडरी मिल्ड्यू)", te: "బూడిద తెగులు" },
    scientific: "Leveillula taurica",
    summary: {
      en: "A fungal disease with white powdery growth under leaves and yellow patches on top, causing leaf drop.",
      hi: "पत्तियों के नीचे सफ़ेद पाउडर जैसी परत और ऊपर पीले धब्बे; पत्तियाँ गिरने लगती हैं।",
      te: "ఆకుల కింద తెల్లని పొడి లాంటి పెరుగుదల, పైన పసుపు మచ్చలు; ఆకులు రాలిపోతాయి.",
    },
    parts: ["Leaf (underside)"],
    symptoms: ["White to grey powdery patches on the leaf underside", "Pale yellow patches on the upper surface", "Older leaves drop first"],
    causes: ["A fungus favoured by dry days and cool, humid nights", "Dense canopy"],
    identify: ["Turn leaves over and look for white powder", "Check older leaves first"],
    lookalikes: "Mite damage and nutrient deficiency can yellow leaves without powder underneath.",
    severityNote: "Rated by the share of leaf area affected.",
    immediate: [...generalImmediate, "Remove heavily affected older leaves."],
    cultural: ["Space plants for airflow", "Avoid excess nitrogen"],
    prevention: [
      { title: "Airflow", body: "Good spacing reduces humidity in the canopy." },
      { title: "Clean field", body: "Remove infected debris after harvest." },
    ],
    monitoring: ["Check leaf undersides weekly, especially in the cool season"],
    getHelp: "Heavy leaf drop during fruiting needs prompt local advice.",
  },
  {
    slug: "anthracnose", crop: "chilli", kind: "disease",
    name: { en: "Anthracnose", hi: "एन्थ्रेक्नोज़ (फल सड़न)", te: "కాయ కుళ్ళు తెగులు (ఆంత్రాక్నోస్)" },
    scientific: "Colletotrichum spp.",
    summary: {
      en: "A fungal disease that causes sunken dark spots on ripening fruit and can dry twigs from the tip (die-back).",
      hi: "एक फफूंद रोग जो पकते फलों पर धँसे काले धब्बे बनाता है और टहनियों को सिरे से सुखा सकता है।",
      te: "పండుతున్న కాయలపై లోతైన నల్ల మచ్చలు కలిగించి, కొమ్మలను కొన నుండి ఎండబెట్టే (డై-బ్యాక్) శిలీంధ్ర వ్యాధి.",
    },
    parts: ["Fruit", "Twig tips"],
    symptoms: ["Sunken, circular dark spots on fruit", "Rings of tiny black dots inside the spots", "Twigs dry from the tip downward (die-back)"],
    causes: ["A seed-borne fungus that survives on debris", "Warm, wet weather and rain splash"],
    identify: ["Check ripening fruit after rain", "Look for rings of black dots in the spots", "Check twig tips for die-back"],
    lookalikes: "Sunscald and insect damage can leave similar marks on fruit.",
    severityNote: "Rated by the share of fruit or fruit area affected.",
    immediate: [...generalImmediate, "Pick and remove infected fruit from the field.", "Prune dried twig tips."],
    cultural: ["Harvest ripe fruit promptly", "Avoid overhead irrigation"],
    prevention: [
      { title: "Clean seed", body: "Use seed from healthy fruit or certified sources." },
      { title: "Field hygiene", body: "Remove infected fruit and debris." },
      { title: "Rotation", body: "Avoid continuous chilli in the same plot." },
    ],
    monitoring: ["Inspect fruit weekly during wet weather"],
    getHelp: "If many fruits show spots during a wet spell, get advice before harvest decisions.",
  },
  {
    slug: "thrips", crop: "chilli", kind: "pest",
    name: { en: "Thrips", hi: "थ्रिप्स", te: "తామర పురుగులు" },
    scientific: "Scirtothrips dorsalis",
    summary: {
      en: "Tiny slender insects that rasp young leaves and buds, causing upward curling and silvery scars.",
      hi: "बहुत छोटे पतले कीट जो कोमल पत्तियों और कलियों को खुरचते हैं, जिससे पत्तियाँ ऊपर मुड़ती हैं और चाँदी जैसे निशान बनते हैं।",
      te: "లేత ఆకులు, మొగ్గలను గీకే చిన్న సన్నని పురుగులు; ఆకులు పైకి ముడుచుకుని వెండి రంగు గీతలు ఏర్పడతాయి.",
    },
    parts: ["Young leaves", "Buds", "Flowers", "Fruit"],
    symptoms: ["Leaves curl upward with rolled edges", "Silvery streaks and scars on leaves and fruit", "Tiny yellowish insects in buds and young leaves"],
    causes: ["Dry, warm weather favours thrips", "Nearby host crops and weeds"],
    identify: ["Tap a shoot over white paper and look for moving specks", "Use blue sticky traps to monitor"],
    lookalikes: "Mites cause downward curling; virus leaf curl causes puckering and stunting.",
    severityNote: "Judged by the share of plants with curled young leaves.",
    immediate: [...generalImmediate, "Tap shoots over white paper to confirm thrips are present."],
    cultural: ["Keep the field weed-free", "Avoid water stress"],
    prevention: [
      { title: "Sticky traps", body: "Blue sticky traps help you notice when numbers rise." },
      { title: "Weed control", body: "Weeds near the field shelter thrips." },
    ],
    monitoring: ["Check young leaves twice a week in dry weather"],
    getHelp: "If curling spreads across the field, ask for approved local control advice.",
  },
  {
    slug: "mites", crop: "chilli", kind: "pest",
    name: { en: "Mites", hi: "माइट (पीली माइट)", te: "నల్లి (పసుపు నల్లి)" },
    scientific: "Polyphagotarsonemus latus",
    summary: {
      en: "Almost invisible mites that make leaves curl downward, narrow and bronze underneath.",
      hi: "लगभग अदृश्य माइट जो पत्तियों को नीचे की ओर मोड़ती, पतला करती और नीचे से ताँबई बनाती हैं।",
      te: "కంటికి దాదాపు కనిపించని నల్లులు; ఆకులను కిందికి ముడిచి, సన్నగా, కింది వైపు రాగి రంగుగా మారుస్తాయి.",
    },
    parts: ["Young leaves", "Growing tip"],
    symptoms: ["Leaves curl downward and become narrow and thick", "Bronze or shiny underside", "Long leaf stalks and stunted tips"],
    causes: ["Hot, dry weather", "Spread by wind, workers and tools"],
    identify: ["Use a hand lens to look under young leaves", "Note downward rather than upward curling"],
    lookalikes: "Thrips cause upward curling; virus causes puckering.",
    severityNote: "Judged by the share of plants with downward-curled tips.",
    immediate: [...generalImmediate, "Use a hand lens to confirm mites under young leaves."],
    cultural: ["Avoid water stress", "Remove heavily affected tips"],
    prevention: [
      { title: "Clean tools", body: "Mites travel on hands and tools between plants." },
      { title: "Healthy seedlings", body: "Start with mite-free transplants." },
    ],
    monitoring: ["Check growing tips weekly in hot, dry spells"],
    getHelp: "Mites build up quickly — ask for approved local advice if many tips are affected.",
  },
  {
    slug: "whitefly", crop: "chilli", kind: "pest",
    name: { en: "Whitefly", hi: "सफ़ेद मक्खी", te: "తెల్ల దోమ" },
    scientific: "Bemisia tabaci",
    summary: {
      en: "Tiny white flying insects under leaves that weaken plants and spread leaf curl virus.",
      hi: "पत्तियों के नीचे छोटे सफ़ेद उड़ने वाले कीट जो पौधों को कमज़ोर करते हैं और पत्ती मरोड़ वायरस फैलाते हैं।",
      te: "ఆకుల కింద ఉండే చిన్న తెల్లని ఎగిరే పురుగులు; మొక్కలను బలహీనపరచి, ఆకు ముడత వైరస్‌ను వ్యాపింపజేస్తాయి.",
    },
    parts: ["Leaf underside"],
    symptoms: ["Tiny white insects fly up when leaves are disturbed", "Yellowing leaves", "Sticky honeydew and black sooty mould"],
    causes: ["Warm, dry weather", "Nearby host crops and weeds"],
    identify: ["Shake a plant gently and watch for white insects", "Use yellow sticky traps to monitor"],
    lookalikes: "Aphids are larger and do not fly when disturbed.",
    severityNote: "Judged by insect counts per leaf and trap catches.",
    immediate: [...generalImmediate, "Check leaf undersides on 10 plants and note how many whiteflies you see."],
    cultural: ["Remove weeds that host whitefly", "Remove crop residues after harvest"],
    prevention: [
      { title: "Yellow sticky traps", body: "Show when whitefly numbers rise." },
      { title: "Net nursery", body: "Raising seedlings under net reduces early virus spread." },
    ],
    monitoring: ["Check leaf undersides weekly", "Watch trap catches"],
    getHelp: "Because whitefly spreads virus, ask for local advice early when numbers rise.",
  },
  {
    slug: "aphids", crop: "chilli", kind: "pest",
    name: { en: "Aphids", hi: "माहू (एफ़िड)", te: "పేను బంక" },
    scientific: "Aphis gossypii, Myzus persicae",
    summary: {
      en: "Soft-bodied insects that cluster on tender shoots, curl leaves and leave sticky honeydew.",
      hi: "कोमल शरीर वाले कीट जो कोमल टहनियों पर झुंड में रहते हैं, पत्तियाँ मोड़ते हैं और चिपचिपा पदार्थ छोड़ते हैं।",
      te: "లేత కొమ్మలపై గుంపులుగా ఉండి, ఆకులను ముడిచి, జిగట తేనె బంకను వదిలే మెత్తని పురుగులు.",
    },
    parts: ["Tender shoots", "Leaf underside", "Flowers"],
    symptoms: ["Clusters of small green, yellow or black insects", "Curled, distorted young leaves", "Sticky honeydew, sooty mould, ants on plants"],
    causes: ["Cool, dry weather and lush growth", "Excess nitrogen"],
    identify: ["Look under young leaves and on shoots", "Ants moving up plants often point to aphids"],
    lookalikes: "Whitefly fly when disturbed; aphids mostly stay put.",
    severityNote: "Judged by the share of shoots with colonies.",
    immediate: [...generalImmediate, "Check whether ladybird beetles are already feeding on colonies."],
    cultural: ["Avoid excess nitrogen", "Remove heavily infested shoots"],
    prevention: [
      { title: "Natural enemies", body: "Ladybird beetles and lacewings feed on aphids." },
      { title: "Balanced fertiliser", body: "Lush growth attracts aphids." },
    ],
    monitoring: ["Check tender shoots weekly"],
    getHelp: "If colonies spread fast, ask for approved local advice.",
  },
  {
    slug: "nitrogen-deficiency", crop: "chilli", kind: "disease",
    name: {
      en: "Nitrogen Deficiency",
      hi: "नाइट्रोजन की कमी",
      te: "నత్రజని లోపం",
      ta: "நைட்ரஜன் குறைபாடு",
      kn: "ಸಾರಜನಕ ಕೊರತೆ",
      mr: "नायट्रोजन कमतरता"
    },
    scientific: "Nutritional Stress (N)",
    summary: {
      en: "General chlorosis where older bottom leaves turn pale yellow while new growth remains small and pale green.",
      hi: "पुरानी निचली पत्तियां पीली पड़ जाती हैं और पौधे का विकास रुक जाता है।",
      te: "మొక్క క్రింది పాత ఆకులు పసుపు రంగులోకి మారుతాయి, మొక్క పెరుగుదల మందగిస్తుంది.",
      ta: "பழைய கீழ் இலைகள் வெளிர் மஞ்சளாக மாறி, பயிரின் வளர்ச்சி குறைகிறது.",
      kn: "ಹಳೆಯ ಕೆಳ ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತವೆ ಮತ್ತು ಸಸ್ಯದ ಬೆಳವಣಿಗೆ ಕುಂಠಿತಗೊಳ್ಳುತ್ತದೆ.",
      mr: "जुनी खालची पाने पिवळी पडतात आणि झाडाची वाढ खुंटते."
    },
    parts: ["Lower leaves", "Older foliage", "Canopy"],
    symptoms: ["Uniform chlorosis of older leaves starting from leaf tip", "Stunted vegetative growth and thin stems", "Early leaf drop in severe cases"],
    causes: ["Leaching due to excessive rain or irrigation", "Low organic matter", "Under-fertilization"],
    identify: ["Inspect bottom canopy: yellowing starts strictly on mature leaves, not new flushes"],
    lookalikes: "Waterlogging causes sudden uniform yellowing; root rot shows wilted yellow leaves.",
    severityNote: "Evaluated by percentage of lower canopy chlorosis.",
    immediate: ["Avoid excessive irrigation that leaches soil nutrients", "Soil application of balanced urea or neem-coated urea in splits", "Foliar spray of 1% water-soluble urea (10g/L) for quick recovery"],
    cultural: ["Apply well-decomposed FYM (Farm Yard Manure)", "Maintain split nitrogen application: 50% basal, 25% at 30 DAT, 25% at 60 DAT"],
    prevention: [
      { title: "Split Application", body: "Never apply all nitrogen at once; split across 3 vegetative stages." },
      { title: "Organic Manure", body: "Incorporate 10 tonnes/ha FYM before transplanting." }
    ],
    monitoring: ["Scout lower canopy weekly for early pale-green discoloration"],
    getHelp: "Conduct soil testing through your local Krishi Vigyan Kendra (KVK).",
  },
  {
    slug: "potassium-deficiency", crop: "chilli", kind: "disease",
    name: {
      en: "Potassium Deficiency",
      hi: "पोटेशियम की कमी",
      te: "పొటాషియం లోపం",
      ta: "பொட்டாசியம் குறைபாடு",
      kn: "ಪೊಟ್ಯಾಸಿಯಮ್ ಕೊರತೆ",
      mr: "पोटॅशियम कमतरता"
    },
    scientific: "Nutritional Stress (K)",
    summary: {
      en: "Marginal leaf scorch where margins of older leaves turn yellow and then brown/necrotic as if burnt.",
      hi: "पत्तियों के किनारे पीले होकर झुलस जाते हैं (मार्जिनल स्कोर्च)।",
      te: "ఆకుల అంచులు పసుపుపచ్చగా మారి, మాడిపోయినట్లుగా ఎండిపోతాయి.",
      ta: "இலைகளின் ஓரங்கள் எரிந்தது போல் கருகிப் போகும்.",
      kn: "ಎಲೆಗಳ ಅಂಚುಗಳು ಒಣಗಿ ಸುಟ್ಟಂತೆ ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತವೆ.",
      mr: "पानांच्या कडा करपल्यासारख्या पिवळ्या व तपकिरी होतात."
    },
    parts: ["Leaf margins", "Older leaves", "Fruits"],
    symptoms: ["Marginal chlorosis progressing into brown necrotic scorch", "Leaves curl upwards or downwards with scorched tips", "Poor fruit set, small thin-walled chilli pods"],
    causes: ["Sandy soils with low cation exchange capacity", "Imbalanced heavy nitrogen or calcium application"],
    identify: ["Classic marginal leaf firing on older leaves while center of leaf blade remains green"],
    lookalikes: "Salt toxicity or pesticide burn also scorches margins but affects all leaf ages at once.",
    severityNote: "Judged by percentage of leaf margin necrosis.",
    immediate: ["Foliar spray of 1% Potassium Nitrate (13-0-45) or Potassium Sulphate (10g/L)", "Soil application of Muriate of Potash (MOP) or SOP based on soil test"],
    cultural: ["Balance N:K ratio (1:1 or 1:1.2 in chilli) for sturdy fruit walls"],
    prevention: [
      { title: "Basal Potash", body: "Apply 50% of recommended potash at planting and 50% at flowering." },
      { title: "Organic mulching", body: "Retain soil moisture to facilitate potassium uptake." }
    ],
    monitoring: ["Examine older leaf margins during early fruit development"],
    getHelp: "Consult local agricultural extension for balanced NPK fertilization.",
  },
  {
    slug: "magnesium-deficiency", crop: "chilli", kind: "disease",
    name: {
      en: "Magnesium Deficiency",
      hi: "मैग्नीशियम की कमी",
      te: "మెగ్నీషియం లోపం",
      ta: "மெக்னீசியம் குறைபாடு",
      kn: "ಮೆಗ್ನೀಸಿಯಮ್ ಕೊರತೆ",
      mr: "मॅग्नेशियम कमतरता"
    },
    scientific: "Nutritional Stress (Mg)",
    summary: {
      en: "Distinct interveinal chlorosis on mature leaves where veins remain dark green while tissue between veins turns yellow.",
      hi: "पत्तियों की नसों के बीच का हिस्सा पीला पड़ता है, जबकि नसें हरी रहती हैं।",
      te: "ఆకు ఈనెలు పచ్చగా ఉండి, ఈనెల మధ్య భాగం పసుపు రంగులోకి మారుతుంది.",
      ta: "இலை நரம்புகள் பச்சையாகவும், நரம்புகளுக்கு இடைப்பட்ட பகுதி மஞ்சளாகவும் மாறும்.",
      kn: "ಎಲೆಯ ನಾಳಗಳು ಹಸಿರಾಗಿದ್ದು, ನಾಳಗಳ ನಡುವಿನ ಭಾಗ ಹಳದಿಯಾಗುತ್ತದೆ.",
      mr: "पानांच्या शिरा हिरव्या राहून शिरांमधील भाग पिवळा पडतो."
    },
    parts: ["Middle and lower leaves", "Interveinal tissue"],
    symptoms: ["Interveinal chlorosis on older and middle canopy leaves", "Green herringbone pattern of veins", "In severe deficiency, leaves turn reddish-purple or drop"],
    causes: ["Acidic or very sandy soils", "High potassium or ammonium fertilizer hindering Mg absorption"],
    identify: ["Clear contrast between dark green veins and bright yellow interveinal tissue"],
    lookalikes: "Iron deficiency shows identical pattern but strictly on the youngest top leaves.",
    severityNote: "Calculated from interveinal chlorotic area on mature foliage.",
    immediate: ["Foliar spray of 0.5% to 1.0% Magnesium Sulphate (Epsom salt, 5-10g/L)", "Repeat after 12-14 days if symptoms persist"],
    cultural: ["Apply dolomite lime to acidic soils during field preparation"],
    prevention: [
      { title: "Soil Amendment", body: "Apply 25 kg/ha Magnesium Sulphate in basal fertilizer." }
    ],
    monitoring: ["Check middle leaves during heavy flowering and fruiting"],
    getHelp: "Confirm with soil pH test; acidic soils require liming.",
  },
  {
    slug: "calcium-deficiency", crop: "chilli", kind: "disease",
    name: {
      en: "Calcium Deficiency (Tip Burn)",
      hi: "कैल्शियम की कमी (टिप बर्न)",
      te: "కాల్షియం లోపం (చిగురు మాడటం)",
      ta: "கால்சியம் குறைபாடு",
      kn: "ಕ್ಯಾಲ್ಸಿಯಂ ಕೊರತೆ",
      mr: "कॅल्शियम कमतरता"
    },
    scientific: "Nutritional Stress (Ca)",
    summary: {
      en: "Deformed, cupped new leaves with necrotic margins and blossom-end rot on developing chilli fruits.",
      hi: "नई पत्तियां विकृत हो जाती हैं और फलों के निचले सिरे पर सड़न (ब्लॉसम एंड रॉट) होती है।",
      te: "కొత్తగా వచ్చే లేత ఆకులు ముడుచుకుపోయి, కాయల చివర కుళ్ళు లేదా మచ్చలు ఏర్పడతాయి.",
      ta: "புதிய இலைகள் சுருங்கி, காய்களின் முனைப்பகுதி அழுகும்.",
      kn: "ಹೊಸ ಎಲೆಗಳು ವಿರೂಪಗೊಂಡು, ಕಾಯಿಗಳ ತುದಿಯಲ್ಲಿ ಕೊಳೆತ ಉಂಟಾಗುತ್ತದೆ.",
      mr: "नवीन पाने वाकडी होतात आणि मिरचीच्या टोकावर काळे डाग पडून सडतात."
    },
    parts: ["Growing tips", "Youngest leaves", "Developing pods"],
    symptoms: ["Hooking and cupping of young emerging leaves", "Necrotic tip burn on tender foliage", "Sunken water-soaked lesions at blossom end of chilli pods"],
    causes: ["Fluctuating soil moisture restricting calcium mobility", "High salinity or excess potassium/magnesium"],
    identify: ["Inspect young growing tip and developing fruits; older leaves look normal"],
    lookalikes: "Anthracnose fruit rot shows circular concentric rings; blossom end rot is non-fungal at fruit tip.",
    severityNote: "Assessed by proportion of young tips or fruits showing necrosis.",
    immediate: ["Foliar spray of 0.2% Calcium Nitrate or chelated Calcium (2g/L)", "Ensure uniform, regular irrigation to maintain continuous calcium transport"],
    cultural: ["Avoid allowing soil to alternate between bone dry and waterlogged"],
    prevention: [
      { title: "Soil Calcium", body: "Apply gypsum or lime based on soil test." },
      { title: "Consistent Watering", body: "Drip irrigation prevents transpiration shocks that trigger tip burn." }
    ],
    monitoring: ["Monitor young flush and fruit blossom ends weekly"],
    getHelp: "Check irrigation uniformity and soil salinity.",
  },
  {
    slug: "hispa", crop: "rice", kind: "pest",
    name: {
      en: "Rice Hispa",
      hi: "धान का हिस्पा (कांटा कीट)",
      te: "వరి ఇస్పా (ముళ్ల పురుగు)",
      ta: "இலை வண்டு (ஹிஸ்பா)",
      kn: "ಭತ್ತದ ಹಿಸ್ಪಾ ಮುಳ್ಳು ಕೀಟ",
      mr: "भातावरील हिस्पा (काटेरी भुंगा)"
    },
    scientific: "Dicladispa armigera",
    summary: {
      en: "Small spiny black beetles whose grubs mine inside leaves and adults scrape green tissue, leaving characteristic parallel white streaks.",
      hi: "छोटे कांटेदार काले भृंग जिनके ग्रब पत्तियों के अंदर सुरंग बनाते हैं और वयस्क हरी परत खुरचते हैं, जिससे समानांतर सफेद धारियाँ बन जाती हैं।",
      te: "నల్లటి ముళ్ల రెక్కల పురుగులు; వీటి పిల్ల పురుగులు ఆకు పొరల మధ్య సొరంగాలు చేసి, పెద్ద పురుగులు ఆకు పచ్చదనాన్ని గోకి సమాంతర తెల్ల చారలను ఏర్పరుస్తాయి."
    },
    parts: ["Leaf blade", "Upper canopy leaves"],
    symptoms: [
      "White parallel streaks along the veins caused by adult scraping",
      "Blister-like clear translucent mines in leaves where grubs feed internally",
      "Damaged leaves dry up, giving the field a withered, burnt appearance in severe attacks"
    ],
    causes: [
      "Spiny black adults laying eggs inside tender leaf tissue",
      "Warm and humid weather with intermittent sunshine after rain",
      "Staggered planting and excessive nitrogenous fertilizer application"
    ],
    identify: [
      "Look for shiny blue-black beetles covered with sharp spines (approx. 5 mm long)",
      "Check leaves for long parallel white epidermal scratches",
      "Hold damaged leaves against sunlight to spot grubs inside the leaf mines"
    ],
    lookalikes: "Leaf folder rolls the leaf with silk threads; Hispa leaves parallel scrape lines without leaf-folding.",
    severityNote: "Rated on IRRI SES scale by percentage of scraped leaf area.",
    immediate: [
      ...generalImmediate,
      "Clip the top 2-3 inches of leaf tips where adults lay eggs before transplanting.",
      "Sweep infested fields with insect nets early in the morning to destroy clustered adults."
    ],
    cultural: [
      "Avoid staggered plantings in adjacent fields to break the multiplication cycle.",
      "Remove wild grasses (Echinochloa, Leersia) on field bunds which harbor hispa between seasons."
    ],
    prevention: [
      { title: "Bund Sanitation", body: "Keep field borders clean of grassy hosts before planting." },
      { title: "Leaf Tip Clipping", body: "Clip seedling tips to destroy initial egg batches before transplanting." }
    ],
    monitoring: ["Scout weekly during tillering for adult beetles and white scraped streaks."],
    getHelp: "If >1 adult beetle or >2 damaged leaves per hill are found during tillering, seek KVK advisory immediately."
  },
  {
    slug: "downy-mildew", crop: "rice", kind: "disease",
    name: {
      en: "Downy Mildew (Crazy Top)",
      hi: "मृदुरोमिल आसिता (क्रेज़ी टॉप)",
      te: "డౌనీ మిల్డో (వెర్రి మొలక తెగులు)",
      ta: "சாம்பல் பூஞ்சை நோய்",
      kn: "ಬೂದಿ ರೋಗ",
      mr: "केवडा रोग"
    },
    scientific: "Sclerophthora macrospora",
    summary: {
      en: "An oomycete water-mold disease causing leaf chlorosis, severe twisting, and leafy proliferation of the panicle (crazy top).",
      hi: "एक जल-फफूंद रोग जिससे पत्तियां पीली पड़ जाती हैं, अत्यधिक मुड़ जाती हैं और बाली के स्थान पर पत्तियों का गुच्छा (क्रेज़ी टॉप) बन जाता है।",
      te: "ఆకులు పసుపుబారి, మెలికలు తిరిగి, కంకి స్థానంలో ఆకుల గుత్తి ఏర్పడే (క్రేజీ టాప్) శిలీంధ్ర వ్యాధి."
    },
    parts: ["Leaf blade", "Flag leaf", "Panicle head"],
    symptoms: [
      "Chlorotic yellow mottling and white specks along veins on young leaves",
      "Stunted growth with thick, leathery, twisted or spiral leaves",
      "Crazy Top: Panicle is transformed into a cluster of small leaf-like structures with no grain set"
    ],
    causes: [
      "Infection by swimming zoospores in submerged seedlings under floodwater",
      "Prolonged waterlogging or flooded nurseries in low-lying fields"
    ],
    identify: [
      "Check for twisted flag leaves and bushy, leaf-like malformed panicles",
      "Occurs predominantly in fields with a history of early-season flooding"
    ],
    lookalikes: "Rice Tungro virus (causes orange-yellowing but panicle does not turn into leafy shoots).",
    severityNote: "Assessed by the percentage of hills showing crazy top malformation.",
    immediate: [
      ...generalImmediate,
      "Drain submerged nursery beds or fields promptly after heavy rains.",
      "Rogue out and destroy malformed crazy-top plants to prevent soil oospore buildup."
    ],
    cultural: [
      "Raise nursery seedbeds on elevated ground above flood levels.",
      "Ensure laser land leveling to eliminate standing water pockets."
    ],
    prevention: [
      { title: "Raised Nursery", body: "Avoid low-lying nurseries prone to monsoon flooding." },
      { title: "Clean Drainage", body: "Maintain proper field drainage channels to prevent stagnant water." }
    ],
    monitoring: ["Inspect low-lying areas of the field after torrential rain and floods."],
    getHelp: "If malformed panicles appear in patches, consult your local agricultural officer."
  },
  {
    slug: "bacterial-leaf-streak", crop: "rice", kind: "disease",
    name: {
      en: "Bacterial Leaf Streak (BLS)",
      hi: "जीवाणु पत्ती धारी रोग",
      te: "బ్యాక్టీరియా ఆకు చారల తెగులు",
      ta: "பாக்டீரியல் இலைக் கோடு நோய்",
      kn: "ಬ್ಯಾಕ್ಟೀರಿಯಲ್ ಎಲೆ ಪಟ್ಟಿ ರೋಗ",
      mr: "जिवाणूजन्य पानांवरील रेषा रोग"
    },
    scientific: "Xanthomonas oryzae pv. oryzicola",
    summary: {
      en: "A bacterial foliar disease producing narrow, interveinal translucent water-soaked streaks with tiny amber exudate beads.",
      hi: "एक जीवाणु रोग जो पत्तियों की नसों के बीच संकरी, पारभासी पानीदार धारियाँ और पीले गोंद जैसी बूँदें बनाता है।",
      te: "ఆకు ఈనెల మధ్య సన్నని, నీటితో తడిసిన పారదర్శక చారలను మరియు చిన్న పసుపు రంగు జిగురు చుక్కలను ఏర్పరిచే బ్యాక్టీరియా వ్యాధి."
    },
    parts: ["Leaf blade", "Interveinal tissue"],
    symptoms: [
      "Narrow, dark-green to translucent water-soaked streaks strictly confined between veins",
      "Lesions turn brownish-yellow and coalesce, forming large patches",
      "Tiny yellow or amber-colored resinous bacterial beads on the streak surface"
    ],
    causes: [
      "Bacterial invasion through stomata and mechanical leaf wounds",
      "High temperatures (28-34°C), high humidity, and monsoon wind-rain storms"
    ],
    identify: [
      "Hold the leaf up to light: BLS streaks are translucent and confined strictly between leaf veins",
      "Different from BLB: BLB starts from the leaf margin/tip with wavy edges; BLS starts within the blade between veins"
    ],
    lookalikes: "Bacterial Leaf Blight (wavy margin-running lesions, not straight interveinal streaks); Rice Hispa (surface scraping).",
    severityNote: "Rated on IRRI SES 0–9 scale by affected foliar area.",
    immediate: [
      ...generalImmediate,
      "Avoid applying additional urea top-dressing during active streak expansion.",
      "Drain excess standing water to reduce microclimate humidity."
    ],
    cultural: [
      "Balance nitrogen fertilizer with adequate potassium applications.",
      "Avoid handling or weeding crops when foliage is wet with dew or rain."
    ],
    prevention: [
      { title: "Certified Seed", body: "Use certified pathogen-free seeds from trusted sources." },
      { title: "Split Nitrogen", body: "Avoid excess nitrogen in a single dose; use leaf color charts (LCC)." }
    ],
    monitoring: ["Inspect middle leaves weekly following windy rainstorms."],
    getHelp: "If interveinal streaks coalesce into widespread foliar browning, consult the nearest KVK."
  },
  {
    slug: "rice-healthy",
    crop: "rice",
    kind: "disease",
    name: {
      en: "Healthy Rice Canopy",
      hi: "स्वस्थ धान की पत्तियाँ",
      te: "ఆరోగ్యకరమైన వరి పైరు",
      ta: "ஆரோக்கியமான நெற்பயிர்",
      kn: "ಆರೋಗ್ಯಕರ ಭತ್ತದ ಬೆಳೆ",
      mr: "निरोगी भाताचे पीक"
    },
    scientific: "Oryza sativa L. (Healthy Foliage)",
    summary: {
      en: "No active disease lesions or insect feeding scars detected. Foliar chlorophyll levels and canopy vigor are optimal.",
      hi: "कोई सक्रिय रोग या कीट के लक्षण नहीं पाए गए। पत्तियों में हरापन और वानस्पतिक वृद्धि सामान्य है।",
      te: "ఎటువంటి తెగుళ్లు లేదా కీటకాల లక్షణాలు లేవు. ఆకుల పచ్చదనం మరియు పెరుగుదల ఆరోగ్యకరంగా ఉన్నాయి.",
      ta: "எந்த நோய்க்கூறுகளோ அல்லது பூச்சி தாக்குதலோ இல்லை. பயிரின் பசுமையும் வளர்ச்சியும் சிறப்பாக உள்ளது.",
      kn: "ಯಾವುದೇ ರೋಗ ಅಥವಾ ಕೀಟ ಬಾಧೆ ಕಂಡುಬಂದಿಲ್ಲ. ಎಲೆಗಳ ಹಸಿರು ಮತ್ತು ಬೆಳೆ ಬೆಳವಣಿಗೆ ಉತ್ತಮವಾಗಿದೆ.",
      mr: "कोणतीही कीड किंवा रोगाची लक्षणे आढळलेली नाहीत. पानांचा हिरवेगारपणा आणि वाढ उत्तम आहे."
    },
    parts: ["Leaves", "Canopy", "Tillers"],
    symptoms: [
      "Uniform green foliar coloration across blade",
      "Absence of necrotic lesions, chlorotic halos or brown spots",
      "Erect leaf habit with clear venation"
    ],
    causes: ["Optimal agronomic conditions and balanced nutrient management."],
    identify: [
      "Clear green foliage without lesions, spots, or marginal scorch",
      "Healthy tillering and active photosynthetic surface"
    ],
    lookalikes: "None. Baseline healthy physiological standard.",
    severityNote: "IRRI SES Score 0 (Completely healthy).",
    immediate: [
      "Maintain regular field water depth (2–5 cm) during active tillering.",
      "Continue standard scouting routine twice a week."
    ],
    cultural: [
      "Follow balanced N:P:K fertilization; do not apply excessive urea.",
      "Keep field borders clean of alternative weed hosts."
    ],
    prevention: [
      { title: "Split Nitrogen", body: "Use Leaf Color Chart (LCC) to guide urea applications." },
      { title: "Water Management", body: "Practice alternate wetting and drying (AWD) after panicle initiation." }
    ],
    monitoring: ["Inspect hill bases weekly for early planthopper buildup."],
    getHelp: "Continue standard good agricultural practices (GAP)."
  },
  {
    slug: "chilli-healthy",
    crop: "chilli",
    kind: "disease",
    name: {
      en: "Healthy Chilli Plant",
      hi: "स्वस्थ मिर्च का पौधा",
      te: "ఆరోగ్యకరమైన మిరప మొక్క",
      ta: "ஆரோக்கியமான மிளகாய் செடி",
      kn: "ಆರೋಗ್ಯಕರ ಮೆಣಸಿನಕಾಯಿ ಗಿಡ",
      mr: "निरोगी मिरचीचे रोप"
    },
    scientific: "Capsicum annuum L. (Healthy Foliage)",
    summary: {
      en: "Foliage shows clear lamina expansion with no upward or downward curling, necrotic spotting, or vector feeding marks.",
      hi: "पत्तियों में कोई मरोड़िया, धब्बे या रस चूसक कीटों के निशान नहीं हैं। पौधे का विकास सामान्य है।",
      te: "ఆకులలో ముడుత, మచ్చలు లేదా రసం పీల్చే పురుగుల ఆనవాళ్లు లేవు. మొక్క పెరుగుదల బాగుంది.",
      ta: "இலைகளில் சுருட்டலோ, புள்ளிகளோ அல்லது பூச்சி சேதமோ இல்லை. செடியின் வளர்ச்சி சீராக உள்ளது.",
      kn: "ಎಲೆಗಳಲ್ಲಿ ಯಾವುದೇ ಸುರುಟು, ಚುಕ್ಕೆ ಅಥವಾ ಕೀಟ ಬಾಧೆ ಇಲ್ಲ. ಗಿಡದ ಬೆಳವಣಿಗೆ ಸಮೃದ್ಧವಾಗಿದೆ.",
      mr: "पानांवर कोणताही चुरडा-मुरडा, डाग किंवा रस शोषणाऱ्या किडींचे नुकसान नाही. रोपाची वाढ निरोगी आहे."
    },
    parts: ["Leaves", "Shoots", "Terminal buds"],
    symptoms: [
      "Smooth, fully expanded leaf lamina without cupping",
      "Vibrant green tissue free of chlorotic mosaic or necrotic halos",
      "Healthy active apical shoot growth"
    ],
    causes: ["Good nursery management, vector exclusion, and balanced foliar nutrition."],
    identify: [
      "Flat, broad leaves with natural glossy surface",
      "No webbing underneath leaves or silvering on upper surface"
    ],
    lookalikes: "None. Healthy physiological standard.",
    severityNote: "Severity Score 0 (Completely healthy).",
    immediate: [
      "Maintain adequate root zone moisture without water stagnation.",
      "Install yellow and blue sticky traps (10/acre) for preventive monitoring."
    ],
    cultural: [
      "Apply balanced basal fertilizer; avoid excessive nitrogen that attracts sucking pests.",
      "Maintain border crops like maize or sorghum as vector barriers."
    ],
    prevention: [
      { title: "Sticky Traps", body: "Install yellow and blue sticky traps early to catch thrips and whiteflies before colonies establish." },
      { title: "Neem Spray", body: "Preventive neem oil spray (10,000 ppm @ 1 ml/L) helps repel incoming vector pests." }
    ],
    monitoring: ["Scout terminal buds and underside of upper leaves twice weekly for minute sucking pests."],
    getHelp: "Keep following Integrated Pest Management (IPM) guidelines."
  },
];

export function getCrop(key: string): Crop | undefined {
  return crops.find((crop) => crop.key === key);
}

export function getTopic(crop: string, slug: string): Topic | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  // 1. Exact match with crop
  const exact = topics.find((topic) => topic.crop === crop && topic.slug === cleanSlug);
  if (exact) return exact;

  // 2. Normalize prefixes within the same crop (e.g. rice-blast vs blast, chilli-thrips vs thrips)
  const normSlug = cleanSlug.replace(/^(rice|chilli)-/, "");
  return topics.find((topic) => 
    topic.crop === crop && (topic.slug === normSlug || topic.slug === `${crop}-${normSlug}`)
  );
}

export function findTopicGlobal(slug: string): Topic | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim();
  const normSlug = cleanSlug.replace(/^(rice|chilli)-/, "");
  return topics.find((topic) => 
    topic.slug === cleanSlug || 
    topic.slug === normSlug || 
    topic.slug === `rice-${normSlug}` || 
    topic.slug === `chilli-${normSlug}`
  );
}

export function topicsFor(crop: CropKey, kind?: Mode): Topic[] {
  return topics.filter((topic) => topic.crop === crop && (!kind || topic.kind === kind));
}

export function l(lang: Lang, value?: L10n | null): string {
  if (!value) return "";
  return value[lang] ?? value.en ?? "";
}

export function searchTopics(query: string, filters: { crop?: CropKey; kind?: Mode } = {}): Topic[] {
  const q = query.trim().toLowerCase();
  return topics.filter((topic) => {
    if (filters.crop && topic.crop !== filters.crop) return false;
    if (filters.kind && topic.kind !== filters.kind) return false;
    if (!q) return true;
    const haystack = [topic.name.en, topic.name.hi, topic.name.te, topic.scientific, topic.summary.en, ...topic.symptoms, ...topic.parts]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export const insights = [
  { crop: "rice" as CropKey, slug: "rice-blast", title: "Early signs of rice blast", body: "Eye-shaped spots with grey centres, often after cool, dewy nights." },
  { crop: "chilli" as CropKey, slug: "leaf-curl", title: "Common chilli leaf problems", body: "Upward curl, downward curl and puckering each point to a different cause." },
  { crop: "rice" as CropKey, slug: "brown-planthopper", title: "Recognising pest damage", body: "Circular drying patches can mean planthoppers at the base of plants." },
  { crop: "chilli" as CropKey, slug: "whitefly", title: "Why early detection matters", body: "Whitefly spreads leaf curl virus — catching it early protects healthy plants." },
];

export const contentNotice =
  "Prototype guidance written for this app. It has not yet been matched to ICAR, ANGRAU or PJTSAU records — check with your local agricultural officer before acting.";
