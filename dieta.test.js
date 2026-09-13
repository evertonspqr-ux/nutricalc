// Minimal behavior tests for client-side NutriCalc helpers.
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const path = require("path");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const designCss = fs.readFileSync(path.join(__dirname, "nutricalc-design.css"), "utf8");
const script = html.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<\/body>/)[1];
const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id))
      elements.set(id, {
        classList: { add() {}, remove() {}, toggle() {} },
        style: {},
        value: "",
        textContent: "",
        innerHTML: "",
        appendChild() {},
        addEventListener() {},
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
      });
    return elements.get(id);
  },
  createElement() {
    return {
      className: "",
      textContent: "",
      value: "",
      type: "",
      appendChild() {},
      addEventListener() {},
      setAttribute() {},
      removeAttribute() {},
      classList: { add() {}, remove() {}, toggle() {} },
    };
  },
  querySelectorAll() {
    return [];
  },
};
const context = {
  document,
  localStorage: {
    getItem() {
      return null;
    },
    setItem() {},
  },
  alert() {},
  console,
  Date,
  JSON,
  structuredClone,
  Blob: function () {},
  URL: {
    createObjectURL() {
      return "";
    },
    revokeObjectURL() {},
  },
};
[
  "pSex",
  "pAge",
  "pWeight",
  "pHeight",
  "pActivity",
  "pGoal",
  "pMealCount",
  "pPreferences",
  "pPregnancy",
  "pEatingDisorder",
  "pAllergy",
  "pRenalHepatic",
].forEach((id) => {
  context[id] = document.getElementById(id);
});
context.window = context;
vm.createContext(context);
vm.runInContext(script, context);
const h = context.NutriCalcHelpers;

assert.ok(h, "NutriCalcHelpers must be exposed for deterministic calculations");
assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      h.normalizeMealNames(["Café", "  ", "Almoço personalizado"]),
    ),
  ),
  [
    "Café",
    "Lanche da manhã",
    "Almoço personalizado",
    "Lanche da tarde",
    "Jantar",
    "Ceia",
  ],
  "custom meal names must preserve valid names and restore defaults for blank or missing names",
);
assert.match(
  html,
  /<meta\s+name="description"[\s\S]*?content="[^"]+"/,
  "page needs an SEO meta description",
);
assert.match(
  html,
  /mailto:atlasforcomsoc@gmail\.com/,
  "page must expose the official support email as a mailto contact",
);
assert.match(
  html,
  /NutriCalc\s*[—-]\s*por Atlas/,
  "page must identify the product signature",
);
assert.match(
  html,
  /top \+ \(compact \? 18 : height - 4\)/,
  "compact PDF overview cards must reserve a separate baseline for notes",
);
assert.match(
  html,
  /class="md:col-span-2 safety-advisory"/,
  "health safety guidance must be displayed without collecting conditions",
);
assert.doesNotMatch(
  html,
  /id="pPregnancy"|id="pEatingDisorder"|id="pAllergy"|id="pRenalHepatic"/,
  "the profile must not retain condition flags",
);
assert.match(
  html,
  /<th scope="col" class="p-2">Alimento<\/th>/,
  "meal table columns must expose scoped headers",
);
assert.match(
  html,
  /<th scope="row" class="p-2">\$\{escapeHtml\(i.name\)\}<\/th>/,
  "food cells must be row headers for screen readers",
);
assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      h.normalizeFood({
        name: "Iogurte",
        portionG: 170,
        kcal: 102,
        carb: 12,
        prot: 8.5,
        fat: 3.4,
        fiber: 0,
      }),
    ),
  ),
  {
    name: "Iogurte",
    kcal: 60,
    carb: 7.06,
    prot: 5,
    fat: 2,
    fiber: 0,
    sodium: 0,
  },
  "label nutrition must normalize to 100 g",
);
assert.doesNotMatch(
  html,
  /onclick="(?:removeItem|editFood|deleteFood)\('\$\{(?:i|f)\.id\}'\)"/,
  "untrusted IDs must never be interpolated into executable event-handler attributes",
);
assert.match(
  html,
  /id="clearDataButton"/,
  "app must provide a local-data deletion control",
);
assert.match(
  html,
  /localStorage\.removeItem\("nutriCalcV1"\)/,
  "data deletion must remove the local state key",
);
assert.match(
  html,
  /integrity="sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO\/SWXgMjoVqcKyIIWOLk"/,
  "jsPDF must have a pinned integrity hash",
);
assert.match(
  html,
  /tesseract\.js@5\.1\.1/,
  "OCR library must use an exact pinned version",
);
assert.strictEqual(h.requiresProfessionalReview({ age: 17 }), true);
assert.strictEqual(
  h.requiresProfessionalReview({ age: 30, pregnancy: true }),
  false,
);
assert.strictEqual(h.requiresProfessionalReview({ age: 30 }), false);
assert.strictEqual(h.goalLabel("maintain"), "Manutenção");
assert.strictEqual(h.goalLabel("lose"), "Redução de peso");
assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      h.sanitizeProfile({
        sex: "female",
        age: 30,
        weight: 60,
        height: 165,
        activity: 1.55,
        goal: "maintain",
        mealCount: 5,
        preferences: "",
        pregnancy: true,
      }),
    ),
  ),
  {
    sex: "female",
    age: 30,
    weight: 60,
    height: 165,
    activity: 1.55,
    goal: "maintain",
    mealCount: 5,
    preferences: "",
  },
  "legacy health-condition flags must be discarded from local profile data",
);
assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      h.sanitizeCustomFood(
        {
          id: "x');alert(1)//",
          name: "Pão",
          kcal: 250,
          carb: 50,
          prot: 8,
          fat: 3,
          fiber: 4,
          sodium: 300,
        },
        "custom-safe",
      ),
    ),
  ),
  {
    id: "custom-safe",
    name: "Pão",
    kcal: 250,
    carb: 50,
    prot: 8,
    fat: 3,
    fiber: 4,
    sodium: 300,
  },
  "untrusted food IDs must be replaced by a safe generated identifier",
);
assert.strictEqual(
  h.sanitizeCustomFood(
    {
      id: "custom-safe",
      name: "Pão",
      kcal: 250,
      carb: 50,
      prot: 8,
      fat: 3,
      fiber: 4,
      sodium: "<img onerror=alert(1)>",
    },
    "custom-safe",
  ),
  null,
  "catalog import must reject non-numeric sodium instead of rendering it",
);
assert.strictEqual(
  h.sanitizeCatalogImport({ foods: Array.from({ length: 501 }, () => ({ name: "Pão", kcal: 250, carb: 50, prot: 8, fat: 3, fiber: 4, sodium: 300 })) }),
  null,
  "catalog import must reject more than 500 foods",
);
assert.strictEqual(
  h.sanitizeCatalogImport({ foods: "not-an-array" }),
  null,
  "catalog import must reject malformed schemas",
);
const estimate = h.estimatePlan({
  sex: "female",
  age: 30,
  weight: 60,
  height: 165,
  activity: 1.55,
  goal: "maintain",
});
assert.strictEqual(estimate.kcal, 2046);
assert.deepStrictEqual(JSON.parse(JSON.stringify(estimate.macros)), {
  protein: 102,
  carbs: 256,
  fat: 68,
});
assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      h.parseNutritionLabel(
        `INFORMAÇÃO NUTRICIONAL\nPorção de 30 g (2 colheres de sopa)\nValor energético 120 kcal\nCarboidratos 18 g\nProteínas 3,5 g\nGorduras totais 4 g\nFibra alimentar 2,1 g`,
      ),
    ),
  ),
  { portionG: 30, kcal: 120, carb: 18, prot: 3.5, fat: 4, fiber: 2.1 },
  "Brazilian nutrition-label text must prefill editable catalog values",
);
assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      h.parseNutritionLabel(
        `INFORMACAO NUTRICIONAL\nPORCAO 50g (2 fatias)\nValor energetico\n137 kcal = 577 kJ\nCarboidratos\n25\nProteinas\n5,3\nGorduras totais\n1,9\nFibra alimentar\n1,1\nSodio\n171 mg`,
      ),
    ),
  ),
  {
    portionG: 50,
    kcal: 137,
    carb: 25,
    prot: 5.3,
    fat: 1.9,
    fiber: 1.1,
    sodium: 171,
  },
  "OCR parser must recover values when a photo breaks nutrition rows across lines or omits gram units",
);
assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      h.parseNutritionLabel(
        `INFORMACAO NUTRICIONAL\nPORCAO 50 g\nValor energetico 137 kcal 7\nCarboidratos 259 8\nProteinas 7 11\nGorduras totais 1,9 4\nFibra alimentar 3,1 12\nSodio 171 mg 7`,
      ),
    ),
  ),
  { portionG: 50, kcal: 137, fat: 1.9, fiber: 3.1, sodium: 171 },
  "OCR parser must refuse ambiguous right-column values instead of prefilling unsafe nutrition data",
);
const hostileWeekly = h.migrateWeeklyPlanner({
  weeklyMeals: [
    [[{ id: "meal-1", name: "<img src=x onerror=alert(1)>", qty: "</td><img src=x onerror=alert(1)>", kcal: 100, carb: 10, prot: 2, fat: 1, fiber: 1 }], [], [], [], [], []],
    [], [], [], [], [], []
  ],
});
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(hostileWeekly.weeklyMeals[0][0])),
  [],
  "weekly local state must discard meal items with non-numeric values before rendering",
);
const legacyMeals = [
  [
    {
      id: "legacy-rice",
      name: "Arroz",
      qty: 120,
      kcal: 156,
      carb: 34,
      prot: 3,
      fat: 0.4,
      fiber: 2,
    },
  ],
  [],
  [],
  [],
  [],
  [],
];
const weeklyState = h.migrateWeeklyPlanner({
  meals: legacyMeals,
  activeMeal: 2,
});
assert.strictEqual(
  weeklyState.weeklyMeals.length,
  7,
  "weekly planner must always contain seven days",
);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(weeklyState.weeklyMeals[0][0])),
  legacyMeals[0],
  "legacy meals must migrate to Segunda without loss",
);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(weeklyState.weeklyMeals[1][0])),
  [],
  "other migrated days must start empty",
);
assert.strictEqual(weeklyState.activeDay, 0, "migration must select Segunda");
assert.strictEqual(
  weeklyState.activeMeal,
  2,
  "migration must retain the active meal",
);
const shopping = h.buildWeeklyShoppingList([
  [[{ name: "Arroz", qty: 100 }]],
  [
    [
      { name: "Arroz", qty: 50 },
      { name: "Banana", qty: 80 },
    ],
  ],
  [],
  [],
  [],
  [],
  [],
]);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(shopping)),
  [
    { name: "Arroz", qty: 150 },
    { name: "Banana", qty: 80 },
  ],
  "weekly shopping must aggregate quantities across days",
);
const overview = h.buildWeeklyOverview([
  [[{ kcal: 150, prot: 8, carb: 20 }]],
  [
    [
      { kcal: 100, prot: 2, carb: 25 },
      { kcal: 80, prot: 1, carb: 18 },
    ],
  ],
  [],
  [],
  [],
  [],
  [],
]);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(overview.slice(0, 2))),
  [
    { items: 1, kcal: 150, prot: 8, carb: 20 },
    { items: 2, kcal: 180, prot: 3, carb: 43 },
  ],
  "weekly overview must provide compact daily totals for the PDF cover",
);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(h.getOcrImagePlan(4000, 3000))),
  { width: 1800, height: 1350 },
  "OCR preparation must downscale large label photos",
);
assert.strictEqual(
  h.getOcrImagePlan(10000, 10000),
  null,
  "OCR preparation must reject images above the decoded pixel limit",
);
assert.match(html, /MAX_OCR_IMAGE_BYTES/, "OCR selection must cap image file size before previewing");
assert.match(html, /accept="image\/jpeg,image\/png,image\/webp"/, "OCR picker must only offer reviewed raster formats");
assert.doesNotMatch(
  html,
  /bibliotecas de PDF e OCR são carregadas[\s\S]{0,80}quando\s+você\s+usa esses recursos/,
  "privacy notice must not claim jsPDF loads only on demand",
);
assert.doesNotMatch(
  html,
  /\s(?:onclick|oninput|onchange)=/,
  "CSP-compatible UI must use event listeners instead of inline event handlers",
);
assert.match(html, /MAX_IMPORT_BYTES = 1024 \* 1024/, "catalog import must cap file size at 1 MB");
assert.match(html, /MAX_STORED_STATE_BYTES/, "persisted local state must have a size cap");
assert.match(html, /baixados precisam ser apagados manualmente/, "deletion copy must disclose downloaded files");

console.log("NutriCalc helper tests passed");
