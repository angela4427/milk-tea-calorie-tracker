# 奶茶热量记录小工具

移动端优先的热量计算器：从 `src/data/drinks.json` 选品牌 / 产品 / 杯型 / 甜度，可加估算小料，看总热量、构成和轻负担建议。

## 本地运行

需要 Node.js（本机若在 `D:\\nodejs`，先把该目录加入 PATH）。

```bash
npm install
npm run dev
```

浏览器打开终端里提示的地址（默认 http://localhost:5173/）。

## 数据

- 目录：`src/data/drinks.json`
- `calories` 为 `null` 时页面显示「暂无精确数据，仅供参考」
- JSON 没有加料字段，珍珠等小料为估算，会在构成里标明

## 文档

- PRD：`docs/superpowers/specs/2026-09-09-milk-tea-calorie-tracker-design.md`
- 扣子人设：`docs/coze/milk-tea-calorie-bot-persona.md`
