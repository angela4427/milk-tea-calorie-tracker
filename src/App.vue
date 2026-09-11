<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  TOPPINGS,
  burdenAdvice,
  cupOptions,
  drinkCalories,
  drinks,
  productsForBrand,
  selectedSugar,
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
  sugar.value = sweetOptions(item)[0] ?? "";
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

const currentSugar = computed(() => {
  if (!selected.value) return null;
  return selectedSugar(selected.value, sugar.value) ?? null;
});

const baseKcal = computed(() => {
  if (!selected.value) return null;
  return drinkCalories(selected.value, cupSize.value, sugar.value);
});

const extraKcal = computed(() => toppingTotal(toppingIds.value));

const totalKcal = computed(() => {
  if (baseKcal.value === null) return null;
  return Math.round((baseKcal.value + extraKcal.value) * 10) / 10;
});

const unknown = computed(() => selected.value !== null && baseKcal.value === null);

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

const feedbackKey = computed(() => {
  if (!selected.value) return "";
  return [
    "milk-tea-feedback",
    selected.value.brand,
    selected.value.product,
    cupSize.value,
    sugar.value,
  ].join("|");
});

const vote = ref<"up" | "down" | null>(null);

watch(
  feedbackKey,
  (key) => {
    if (!key) {
      vote.value = null;
      return;
    }
    const saved = localStorage.getItem(key);
    vote.value = saved === "up" || saved === "down" ? saved : null;
  },
  { immediate: true },
);

function setVote(next: "up" | "down") {
  const key = feedbackKey.value;
  if (!key) return;
  vote.value = vote.value === next ? null : next;
  if (vote.value) localStorage.setItem(key, vote.value);
  else localStorage.removeItem(key);
}

const showResult = ref(false);
const resultRef = ref<HTMLElement | null>(null);

watch([brand, productName], () => {
  showResult.value = false;
});

async function calculate() {
  showResult.value = true;
  await nextTick();
  resultRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <main class="page">
    <header class="hero">
      <div class="hero-text">
        <p class="eyebrow"><span class="dot" />减脂日 · 奶茶额度</p>
        <h1>奶茶热量追踪</h1>
        <p class="lead">选一选，算出你手里这杯的热量</p>
      </div>
      <div class="hero-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5 8.5h11.5a1 1 0 0 1 1 1V14a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8.5Z"
            stroke="currentColor"
            stroke-width="1.7"
          />
          <path d="M17.5 10h1.2A2.8 2.8 0 0 1 21.5 12.8v0A2.8 2.8 0 0 1 18.7 15.6H17.5" stroke="currentColor" stroke-width="1.7" />
          <path d="M8 4.5c.4 1 .4 1.8 0 2.6M11 4.2c.5 1.1.5 2 0 3M14 4.5c.4 1 .4 1.8 0 2.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
        </svg>
      </div>
    </header>

    <section class="card form-card" aria-label="点单选择">
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
        <div class="field">
          <span>杯型</span>
          <div class="seg" role="radiogroup" aria-label="杯型">
            <button
              v-for="size in cups"
              :key="size"
              type="button"
              class="seg-btn"
              :class="{ on: cupSize === size }"
              :aria-pressed="cupSize === size"
              @click="cupSize = size"
            >
              {{ size }}
            </button>
          </div>
        </div>
        <label class="field">
          <span>糖度</span>
          <select v-model="sugar">
            <option v-for="level in sweets" :key="level" :value="level">{{ level }}</option>
          </select>
        </label>
      </div>

      <div class="field toppings-field">
        <div class="toppings-head">
          <span>加料</span>
          <em>估算</em>
          <small class="multi">可多选</small>
        </div>
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
            <b>+{{ topping.kcal }}</b>
          </button>
        </div>
      </div>

      <button type="button" class="calc-btn" @click="calculate">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <rect x="4" y="3.5" width="16" height="17" rx="3" stroke="currentColor" stroke-width="1.8" />
          <path d="M8 8h8M8 12h2.5M13.5 12H16M8 16h2.5M13.5 16H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        计算热量
      </button>
    </section>

    <section v-if="showResult" ref="resultRef" class="card result" aria-live="polite">
      <p class="eyebrow">总热量</p>
      <template v-if="unknown">
        <h2 class="unknown-title">暂无精确数据，仅供参考</h2>
        <p v-if="currentSugar" class="hint">{{ currentSugar.caloriesText }}</p>
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

    <section v-if="showResult" class="card feedback" aria-label="数据反馈">
      <p class="feedback-q">这个数据准吗？</p>
      <div class="vote" role="group" aria-label="这个数据准吗">
        <button
          type="button"
          class="vote-btn"
          :class="{ on: vote === 'up' }"
          :aria-pressed="vote === 'up'"
          @click="setVote('up')"
        >
          👍 准
        </button>
        <button
          type="button"
          class="vote-btn"
          :class="{ on: vote === 'down' }"
          :aria-pressed="vote === 'down'"
          @click="setVote('down')"
        >
          👎 不准
        </button>
      </div>
    </section>

    <section v-if="showResult" class="card advice" :class="advice.tone">
      <p class="eyebrow">轻负担建议</p>
      <p>{{ advice.text }}</p>
    </section>

    <section class="card about" aria-labelledby="about-title">
      <h2 id="about-title">
        <span class="info-dot" aria-hidden="true">i</span>
        关于本工具
      </h2>
      <dl>
        <div>
          <dt>数据来源</dt>
          <dd>整理自各品牌公开营养成分信息，2026年。</dd>
        </div>
        <div>
          <dt>计算逻辑</dt>
          <dd>基础热量 + 糖度调整 + 杯型系数 + 加料估算。</dd>
        </div>
        <div>
          <dt>免责声明</dt>
          <dd>数据为估算值，仅供参考，实际以品牌官方为准。</dd>
        </div>
        <div>
          <dt>版本</dt>
          <dd>V1.0。</dd>
        </div>
      </dl>
      <p class="about-note">建议使用电脑访问，移动端可能因网络原因加载较慢。</p>
    </section>
  </main>
</template>

<style scoped>
.page {
  background: var(--shell);
  border-radius: 36px;
  padding: 22px 16px 20px;
  box-shadow: var(--shadow);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  padding: 4px 4px 0;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--tea);
  font-weight: 600;
  margin-bottom: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3d8f68;
}

h1 {
  font-size: 28px;
  letter-spacing: -0.03em;
  font-weight: 800;
  line-height: 1.15;
}

.lead,
.hint,
.note {
  color: var(--muted);
  line-height: 1.55;
}

.lead {
  margin-top: 8px;
  font-size: 14px;
}

.hero-icon {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--tea-soft);
  color: var(--tea);
  display: grid;
  place-items: center;
}

.hero-icon svg {
  width: 26px;
  height: 26px;
}

.card {
  background: var(--paper);
  border-radius: 24px;
  padding: 16px 14px 14px;
  box-shadow: 0 4px 16px rgba(60, 48, 30, 0.04);
  margin-bottom: 12px;
}

.form-card {
  padding: 18px 16px 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.field > span,
.toppings-head span {
  font-size: 13px;
  color: #7d776e;
  font-weight: 600;
}

select {
  appearance: none;
  width: 100%;
  min-height: 52px;
  border: 1px solid #f0ebe1;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%238a847a' d='M1 1l5 5 5-5'/%3E%3C/svg%3E") no-repeat right 16px center;
  border-radius: 999px;
  padding: 0 42px 0 18px;
  color: var(--ink);
  font-weight: 700;
  font-size: 16px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.seg {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--track);
  border-radius: 999px;
  padding: 4px;
  min-height: 52px;
}

.seg-btn {
  flex: 1;
  border: 0;
  background: transparent;
  color: #9a9388;
  min-height: 44px;
  border-radius: 999px;
  font-weight: 700;
  padding: 0 10px;
}

.seg-btn.on {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 2px 8px rgba(60, 48, 30, 0.08);
}

.toppings-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toppings-head em {
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  color: #c4a07a;
  background: #f3e6d4;
  border-radius: 999px;
  padding: 2px 8px;
}

.multi {
  margin-left: auto;
  font-size: 12px;
  color: #b0aaa0;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  border: 1px solid #efe8dc;
  background: #fff;
  border-radius: 999px;
  min-height: 42px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);
}

.chip b {
  color: var(--chip-kcal);
  font-weight: 700;
}

.chip.on {
  border-color: var(--tea);
  background: var(--tea-soft);
}

.chip.on b {
  color: var(--tea);
}

.calc-btn {
  width: 100%;
  min-height: 52px;
  margin-top: 6px;
  border: 0;
  border-radius: 999px;
  background: var(--tea);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.calc-btn:active {
  background: var(--tea-deep);
}

.result h2 {
  margin: 4px 0 12px;
}

.kcal {
  font-size: 40px;
  letter-spacing: -0.04em;
  font-weight: 800;
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
  background: var(--track);
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

.feedback-q {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.vote {
  display: flex;
  gap: 10px;
}

.vote-btn {
  flex: 1;
  min-height: 44px;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 999px;
}

.vote-btn.on {
  border-color: var(--tea);
  background: var(--tea-soft);
  color: var(--tea);
}

.about h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  margin-bottom: 4px;
}

.info-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3d8f68;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  font-style: italic;
  display: grid;
  place-items: center;
  line-height: 1;
}

.about dl {
  margin: 0;
}

.about dl > div {
  padding: 12px 0;
}

.about dt {
  font-size: 13px;
  color: #6f6a62;
  margin-bottom: 4px;
}

.about dd {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  font-weight: 600;
}

.about-note {
  margin-top: 4px;
  padding: 10px 12px;
  background: #f3ebdc;
  border-radius: 12px;
  color: #8a7d6a;
  font-size: 12px;
  line-height: 1.5;
}

.advice p:last-child {
  line-height: 1.6;
  font-size: 15px;
}

.advice.light {
  background: var(--tea-soft);
}

.advice.heavy,
.advice.unknown {
  background: var(--warn-soft);
}
</style>
