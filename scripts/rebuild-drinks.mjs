import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "src/data/drinks.json");
const oldDrinks = JSON.parse(readFileSync(dest, "utf8"));

function looksLikeSweet(label) {
  return /糖|甜|无糖/.test(label) && !/杯|瓶|ml|差值/.test(label);
}

function parseLabeled(text) {
  const found = [];
  const re = /(\d+(?:\.\d+)?)\s*[（(]([^)）]+)[)）]/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    found.push({ value: Number(match[1]), label: match[2].trim() });
  }
  return found;
}

function transformOld(item) {
  const sweetLabeled = parseLabeled(item.caloriesText).filter((x) => looksLikeSweet(x.label));
  if (sweetLabeled.length >= 2) {
    return {
      brand: item.brand,
      product: item.product,
      cupSize: item.cupSize,
      sugarOptions: sweetLabeled.map((x) => ({
        sugar: x.label,
        calories: x.value,
        caloriesText: `≈${x.value}（${x.label}）；原文：${item.caloriesText}`,
      })),
      note: item.note || "",
    };
  }

  if (/三分糖/.test(item.sugarCondition) && /全糖/.test(item.sugarCondition)) {
    return {
      brand: item.brand,
      product: item.product,
      cupSize: item.cupSize,
      sugarOptions: [
        { sugar: "三分糖", calories: null, caloriesText: item.caloriesText },
        { sugar: "全糖", calories: null, caloriesText: item.caloriesText },
      ],
      note: item.note || "",
    };
  }

  return {
    brand: item.brand,
    product: item.product,
    cupSize: item.cupSize,
    sugarOptions: [
      {
        sugar: item.sugarCondition,
        calories: item.calories,
        caloriesText: item.caloriesText,
      },
    ],
    note: item.note || "",
  };
}

function drink(brand, product, cupSize, levels) {
  return {
    brand,
    product,
    cupSize,
    sugarOptions: levels.map(([sugar, calories]) => ({
      sugar,
      calories,
      caloriesText: calories === null ? "暂无精确数据" : `≈${calories}`,
    })),
    note: "估算值，仅供参考",
  };
}

const heytea = (p, cup, a, b, c) =>
  drink("喜茶", p, cup, [
    ["真0卡糖", a],
    ["少少甜", b],
    ["少甜", c],
  ]);

const nayuki = (p, cup, a, b, c) =>
  drink("奈雪的茶", p, cup, [
    ["不另外加糖", a],
    ["三分糖", b],
    ["标准糖", c],
  ]);

const mixue = (p, cup, a, b, c, d) =>
  drink("蜜雪冰城", p, cup, [
    ["无糖", a],
    ["三分糖", b],
    ["五分糖", c],
    ["全糖", d],
  ]);

const yyd = (p, cup, a, b, c) =>
  drink("一点点", p, cup, [
    ["无糖", a],
    ["少糖", b],
    ["半糖", c],
    ["全糖", Math.round(c * 1.25)],
  ]);

const coco = (p, cup, a, b, c) =>
  drink("CoCo都可", p, cup, [
    ["无糖", a],
    ["微糖", b],
    ["半糖", c],
    ["全糖", Math.round(c * 1.2)],
  ]);

const chabaidao = (p, cup, a, b, c) =>
  drink("茶百道", p, cup, [
    ["无糖", a],
    ["三分糖", b],
    ["标准糖", c],
  ]);

const chagee = (p, cup, a, b, c) =>
  drink("霸王茶姬", p, cup, [
    ["无糖", a],
    ["微糖", b],
    ["少糖", c],
  ]);

const guming = (p, cup, a, b, c) =>
  drink("古茗", p, cup, [
    ["无糖", a],
    ["三分糖", b],
    ["标准糖", c],
  ]);

const hushang = (p, cup, a, b, c) =>
  drink("沪上阿姨", p, cup, [
    ["不另外加糖", a],
    ["三分糖", b],
    ["标准糖", c],
  ]);

const shuyi = (p, cup, a, b, c) =>
  drink("书亦烧仙草", p, cup, [
    ["微糖", a],
    ["少糖", b],
    ["标准糖", c],
  ]);

const added = [
  heytea("烤黑糖波波", "标准杯", 220, 280, 330),
  heytea("芝芝莓莓", "标准杯", 210, 270, 320),
  heytea("满杯红柚", "标准杯", 70, 110, 150),
  heytea("烤汤圆鲜牛乳", "标准杯", 240, 300, 360),
  heytea("椰椰芒芒", "标准杯", 180, 230, 280),

  nayuki("霸气芝士草莓", "标准杯", 240, 300, 360),
  nayuki("霸气芒果", "标准杯", 200, 260, 320),
  nayuki("鸭屎香柠檬茶", "标准杯", 40, 80, 130),
  nayuki("草莓脏脏茶", "标准杯", 260, 320, 380),
  nayuki("霸气葡萄", "标准杯", 180, 230, 290),

  mixue("珍珠奶茶", "标准杯", 220, 280, 330, 390),
  mixue("满杯百香果", "标准杯", 70, 120, 160, 210),
  mixue("芋圆葡萄", "标准杯", 160, 210, 250, 300),
  mixue("冰醇豆乳", "标准杯", 140, 180, 220, 260),
  mixue("草莓摇摇奶昔", "标准杯", 200, 260, 310, 360),

  yyd("阿萨姆奶茶", "中杯", 160, 200, 250),
  yyd("四季春茶", "中杯", 10, 50, 90),
  yyd("柠檬养乐多", "中杯", 90, 130, 170),
  yyd("珍珠奶绿", "中杯", 180, 230, 280),
  yyd("蜂蜜绿", "中杯", 80, 120, 160),

  coco("奶茶", "大杯", 220, 280, 340),
  coco("茉莉绿茶", "大杯", 15, 70, 130),
  coco("金桔柠檬", "大杯", 40, 90, 150),
  coco("都可可可", "大杯", 260, 320, 380),
  coco("布丁奶茶", "大杯", 280, 340, 400),

  chabaidao("杨枝甘露", "中杯", 220, 270, 320),
  chabaidao("豆乳米麻薯", "中杯", 200, 250, 300),
  chabaidao("超级杯水果茶", "中杯", 80, 130, 180),
  chabaidao("豆乳玉麒麟", "中杯", 170, 220, 270),
  chabaidao("多肉车厘", "中杯", 110, 150, 200),

  chagee("桂馥兰香", "中杯", 90, 115, 140),
  chagee("花田月下", "中杯", 100, 125, 150),
  chagee("万里木兰", "中杯", 85, 110, 135),
  chagee("青青糯山", "中杯", 140, 165, 190),
  chagee("山野栀子", "中杯", 95, 120, 145),

  guming("超A草莓酪酪", "中杯", 180, 230, 280),
  guming("芋泥牛乳", "中杯", 210, 260, 310),
  guming("超级杯杨枝甘露", "中杯", 230, 280, 330),
  guming("青提爆汁", "中杯", 70, 110, 160),
  guming("柠檬养乐多", "中杯", 90, 130, 180),

  hushang("血糯米奶茶", "标准杯", 220, 270, 320),
  hushang("芋泥波波", "标准杯", 240, 290, 340),
  hushang("杨枝甘露", "标准杯", 210, 260, 310),
  hushang("超级杯水果茶", "标准杯", 90, 140, 190),
  hushang("手打柠檬茶", "标准杯", 35, 80, 130),

  shuyi("原味烧仙草", "标准杯", 160, 200, 250),
  shuyi("芋圆烧仙草", "标准杯", 220, 270, 320),
  shuyi("椰果烧仙草", "标准杯", 180, 230, 280),
  shuyi("黑糖珍珠鲜牛乳", "标准杯", 250, 300, 360),
  shuyi("芒果烧仙草", "标准杯", 200, 250, 300),
];

const migrated = oldDrinks.map(transformOld);
const existingKeys = new Set(migrated.map((d) => `${d.brand}::${d.product}`));
const uniqueAdded = added.filter((d) => !existingKeys.has(`${d.brand}::${d.product}`));
const next = [...migrated, ...uniqueAdded];

const oldProductCount = oldDrinks.length;
const oldSugarSlots = oldDrinks.length;
const newProductCount = next.length;
const newSugarSlots = next.reduce((n, d) => n + d.sugarOptions.length, 0);
const migratedSugarSlots = migrated.reduce((n, d) => n + d.sugarOptions.length, 0);
const splitCount = migrated.filter((d) => d.sugarOptions.length > 1).length;

writeFileSync(dest, `${JSON.stringify(next, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      oldProducts: oldProductCount,
      oldSugarSlots,
      afterMigrateProducts: migrated.length,
      afterMigrateSugarSlots: migratedSugarSlots,
      splitProducts: splitCount,
      addedProducts: uniqueAdded.length,
      totalProducts: newProductCount,
      totalSugarSlots: newSugarSlots,
      perBrand: Object.fromEntries(
        [...new Set(next.map((d) => d.brand))].map((b) => [
          b,
          next.filter((d) => d.brand === b).length,
        ]),
      ),
    },
    null,
    2,
  ),
);
