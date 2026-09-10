import drinksJson from "../data/drinks.json";

export type Drink = {
  brand: string;
  product: string;
  calories: number | null;
  caloriesText: string;
  sugarCondition: string;
  cupSize: string;
  note: string;
};

export type Topping = {
  id: string;
  name: string;
  kcal: number;
};

export type LabeledCalorie = {
  label: string;
  value: number;
};

export const drinks = drinksJson as Drink[];

/** JSON 没有加料字段，这里用常见小料估算，展示时标明估算。 */
export const TOPPINGS: Topping[] = [
  { id: "pearl", name: "珍珠", kcal: 90 },
  { id: "coconut", name: "椰果", kcal: 40 },
  { id: "cheese", name: "奶盖", kcal: 100 },
  { id: "pudding", name: "布丁", kcal: 60 },
  { id: "taro", name: "芋圆", kcal: 70 },
];

export function uniqueBrands(): string[] {
  return [...new Set(drinks.map((d) => d.brand))];
}

export function productsForBrand(brand: string): Drink[] {
  return drinks.filter((d) => d.brand === brand);
}

export function parseLabeledCalories(text: string): LabeledCalorie[] {
  const found: LabeledCalorie[] = [];
  const re = /(\d+(?:\.\d+)?)\s*[（(]([^)）]+)[)）]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    found.push({ value: Number(match[1]), label: match[2].trim() });
  }
  return found;
}

function looksLikeCup(label: string): boolean {
  return /杯|瓶|ml|ML|装/.test(label);
}

function looksLikeSweet(label: string): boolean {
  return /糖|甜|无糖/.test(label);
}

export function cupOptions(item: Drink): string[] {
  const options = new Set<string>();
  for (const part of item.cupSize.split("/")) {
    const trimmed = part.trim();
    if (trimmed) options.add(trimmed);
  }
  for (const labeled of parseLabeledCalories(item.caloriesText)) {
    if (looksLikeCup(labeled.label)) options.add(labeled.label);
  }
  return [...options];
}

export function sweetOptions(item: Drink): string[] {
  const options = new Set<string>();
  if (item.sugarCondition.trim()) options.add(item.sugarCondition);
  for (const labeled of parseLabeledCalories(item.caloriesText)) {
    if (looksLikeSweet(labeled.label)) options.add(labeled.label);
  }
  return [...options];
}

function labelMatches(option: string, label: string): boolean {
  return option === label || option.includes(label) || label.includes(option);
}

export function drinkCalories(
  item: Drink,
  cupSize: string,
  sugarCondition: string,
): number | null {
  const labeled = parseLabeledCalories(item.caloriesText);

  const sweetHit = labeled.find(
    (entry) => looksLikeSweet(entry.label) && labelMatches(sugarCondition, entry.label),
  );
  if (sweetHit) return sweetHit.value;

  const cupHit = labeled.find(
    (entry) => looksLikeCup(entry.label) && labelMatches(cupSize, entry.label),
  );
  if (cupHit) return cupHit.value;

  return item.calories;
}

export function toppingTotal(ids: string[]): number {
  return TOPPINGS.filter((t) => ids.includes(t.id)).reduce((sum, t) => sum + t.kcal, 0);
}

export function lighterAlternatives(item: Drink, current: number | null): Drink[] {
  const sameBrand = productsForBrand(item.brand).filter((d) => d.product !== item.product);
  const numbered = sameBrand.filter((d): d is Drink & { calories: number } => d.calories !== null);
  numbered.sort((a, b) => a.calories - b.calories);
  if (current === null) return numbered.slice(0, 2);
  return numbered.filter((d) => d.calories < current).slice(0, 2);
}

export type Advice = {
  tone: "unknown" | "light" | "ok" | "heavy";
  text: string;
};

export function burdenAdvice(
  item: Drink,
  total: number | null,
  toppingCount: number,
): Advice {
  if (total === null) {
    return {
      tone: "unknown",
      text: "暂无精确数据，仅供参考。建议改选目录里有明确热量的饮品，或先少糖、不加料。",
    };
  }

  const alts = lighterAlternatives(item, total);
  const altText =
    alts.length > 0
      ? `同品牌更轻的选择：${alts.map((d) => `${d.product}（约 ${d.calories} kcal）`).join("、")}。`
      : "";

  if (total <= 120) {
    return {
      tone: "light",
      text: `这杯负担很轻，适合额度所剩不多的时候。${toppingCount ? "若还想再轻一点，可以去掉加料。" : ""}`,
    };
  }

  if (total <= 250) {
    return {
      tone: "ok",
      text: `中等负担。今天如果还要再喝，优先无糖茶底、少加料。${altText}`,
    };
  }

  return {
    tone: "heavy",
    text: `负担偏高，按上限计会较快吃满 300 kcal 奶茶额度。可先去掉加料${toppingCount ? "" : "、选更低糖度"}。${altText}`,
  };
}
