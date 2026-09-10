<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  TOPPINGS,
  burdenAdvice,
  cupOptions,
  drinkCalories,
  drinks,
  productsForBrand,
  sweetOptions,
  toppingTotal,
  uniqueBrands,
  type Drink,
} from "./lib/catalog";

const brands = uniqueBrands();
const brand = ref(brands[0] ?? "");
const productName = ref("");
const cupSize = ref("");
const sugar = ref("");
const toppingIds = ref<string[]>([]);

const products = computed(() => productsForBrand(brand.value));

const selected = computed<Drink | null>(() => {
  return products.value.find((d) => d.product === productName.value) ?? null;
});

const cups = computed(() => (selected.value ? cupOptions(selected.value) : []));
const sweets = computed(() => (selected.value ? sweetOptions(selected.value) : []));

function applyDrink(item: Drink) {
  productName.value = item.product;
  cupSize.value = cupOptions(item)[0] ?? item.cupSize;
  sugar.value = sweetOptions(item)[0] ?? item.sugarCondition;
}

watch(
  brand,
  () => {
    const first = products.value[0];
    if (first) applyDrink(first);
    toppingIds.value = [];
  },
  { immediate: true },
);

watch(productName, (name) => {
  const item = products.value.find((d) => d.product === name);
  if (item) applyDrink(item);
});

function toggleTopping(id: string) {
  if (toppingIds.value.includes(id)) {
    toppingIds.value = toppingIds.value.filter((x) => x !== id);
  } else {
    toppingIds.value = [...toppingIds.value, id];
  }
}

const baseKcal = computed(() => {
  if (!selected.value || selected.value.calories === null) return null;
  return drinkCalories(selected.value, cupSize.value, sugar.value);
});

const extraKcal = computed(() => toppingTotal(toppingIds.value));

const totalKcal = computed(() => {
  if (baseKcal.value === null) return null;
  return Math.round((baseKcal.value + extraKcal.value) * 10) / 10;
});

const unknown = computed(() => selected.value?.calories === null);

const selectedToppings = computed(() => TOPPINGS.filter((t) => toppingIds.value.includes(t.id)));

const advice = computed(() => {
  if (!selected.value) {
    return { tone: "unknown" as const, text: "先选一杯奶茶。" };
  }
  return burdenAdvice(selected.value, totalKcal.value, toppingIds.value.length);
});

const budgetRatio = computed(() => {
  if (totalKcal.value === null) return null;
  return Math.min(totalKcal.value / 300, 1.4);
});
</script>

<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">减脂日 · 奶茶额度</p>
      <h1>算这一杯</h1>
      <p class="lead">选品牌和规格，看热量构成。数字来自目录估算，不是医疗建议。</p>
    </header>

    <section class="card" aria-label="点单选择">
      <label class="field">
        <span>品牌</span>
        <select v-model="brand">
          <option v-for="name in brands" :key="name" :value="name">{{ name }}</option>
        </select>
      </label>

      <label class="field">
        <span>产品</span>
        <select v-model="productName">
          <option v-for="item in products" :key="item.product" :value="item.product">
            {{ item.product }}
          </option>
        </select>
      </label>

      <div class="row">
        <label class="field">
          <span>杯型</span>
          <select v-model="cupSize">
            <option v-for="size in cups" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
        <label class="field">
          <span>甜度</span>
          <select v-model="sugar">
            <option v-for="level in sweets" :key="level" :value="level">{{ level }}</option>
          </select>
        </label>
      </div>

      <div class="field">
        <span>加料 <em>估算</em></span>
        <div class="chips" role="group" aria-label="加料">
          <button
            v-for="topping in TOPPINGS"
            :key="topping.id"
            type="button"
            class="chip"
            :class="{ on: toppingIds.includes(topping.id) }"
            @click="toggleTopping(topping.id)"
          >
            {{ topping.name }}
            <small>+{{ topping.kcal }}</small>
          </button>
        </div>
      </div>
    </section>

    <section class="card result" aria-live="polite">
      <p class="eyebrow">总热量</p>
      <template v-if="unknown">
        <h2 class="unknown-title">暂无精确数据，仅供参考</h2>
        <p v-if="selected" class="hint">{{ selected.caloriesText }}</p>
      </template>
      <template v-else>
        <h2 class="kcal">
          约 {{ totalKcal }}
          <small>kcal</small>
        </h2>
        <div class="bar" aria-hidden="true">
          <span :style="{ width: `${Math.min((budgetRatio ?? 0) * 100, 100)}%` }" />
        </div>
        <p class="hint">对照默认额度 300 kcal（按数字合计，加料为估算）</p>
      </template>

      <h3>热量构成</h3>
      <ul class="breakdown">
        <li>
          <span>饮品</span>
          <strong v-if="baseKcal !== null">{{ baseKcal }} kcal</strong>
          <strong v-else>暂无精确数据</strong>
        </li>
        <li v-for="topping in selectedToppings" :key="topping.id">
          <span>{{ topping.name }}（估算）</span>
          <strong>+{{ topping.kcal }} kcal</strong>
        </li>
        <li v-if="selectedToppings.length === 0">
          <span>加料</span>
          <strong>未加</strong>
        </li>
      </ul>
      <p v-if="selected?.note" class="note">{{ selected.note }}</p>
    </section>

    <section class="card advice" :class="advice.tone">
      <p class="eyebrow">轻负担建议</p>
      <p>{{ advice.text }}</p>
    </section>

    <p class="foot">目录 {{ drinks.length }} 款 · 仅作自我管理参考</p>
  </main>
</template>

<style scoped>
.page {
  padding: 28px 0 8px;
}

.hero {
  margin-bottom: 20px;
}

.eyebrow {
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--tea);
  font-weight: 600;
  margin-bottom: 8px;
}

h1 {
  font-size: 32px;
  letter-spacing: -0.03em;
  font-weight: 700;
}

.lead,
.hint,
.note,
.foot {
  color: var(--muted);
  line-height: 1.55;
}

.lead {
  margin-top: 8px;
  font-size: 15px;
}

.card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px 16px 16px;
  box-shadow: var(--shadow);
  margin-bottom: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.field:last-child {
  margin-bottom: 0;
}

.field span {
  font-size: 13px;
  color: var(--muted);
}

.field em {
  font-style: normal;
  margin-left: 6px;
  font-size: 11px;
  color: #a2835a;
}

select {
  appearance: none;
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--line);
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2366756c' d='M1 1l5 5 5-5'/%3E%3C/svg%3E") no-repeat right 14px center;
  border-radius: 14px;
  padding: 0 40px 0 14px;
  color: var(--ink);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 999px;
  min-height: 42px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chip small {
  color: var(--muted);
}

.chip.on {
  border-color: var(--tea);
  background: var(--tea-soft);
  color: var(--tea);
}

.result h2 {
  margin: 4px 0 12px;
}

.kcal {
  font-size: 44px;
  letter-spacing: -0.04em;
  font-weight: 700;
}

.kcal small {
  font-size: 16px;
  color: var(--muted);
  font-weight: 500;
  margin-left: 4px;
}

.unknown-title {
  font-size: 22px;
  line-height: 1.35;
  margin: 4px 0 8px;
}

.bar {
  height: 8px;
  background: #efe6d8;
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 8px;
}

.bar span {
  display: block;
  height: 100%;
  background: var(--tea);
  border-radius: 99px;
}

h3 {
  margin: 18px 0 8px;
  font-size: 14px;
}

.breakdown {
  list-style: none;
  margin: 0;
  padding: 0;
}

.breakdown li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  font-size: 15px;
}

.breakdown li:last-child {
  border-bottom: 0;
}

.note {
  margin-top: 10px;
  font-size: 13px;
}

.advice p:last-child {
  line-height: 1.6;
  font-size: 15px;
}

.advice.light {
  background: var(--tea-soft);
  border-color: #cfe3d7;
}

.advice.heavy,
.advice.unknown {
  background: var(--warn-soft);
  border-color: #edd4c4;
}

.foot {
  text-align: center;
  font-size: 12px;
  margin-top: 8px;
}

@media (min-width: 760px) {
  #app {
    max-width: 430px;
  }
}
</style>
