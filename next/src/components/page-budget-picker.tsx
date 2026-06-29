"use client";

import { useStore } from "@/lib/store";

/**
 * Pages budget picker — sits next to the editor's format / charcount row.
 *
 * Default value is "自动" (auto), which keeps the previous behaviour:
 * content drives quantity, no upper bound (per SHARED_DESIGN_DIRECTIVES).
 * Picking a number injects a `<USER_HARD_CONSTRAINTS>` block above the
 * project rules (see convert/route.ts), so the cap wins over the
 * "no upper limit" project rule. Picking "自动" again reverts cleanly
 * (sends undefined ⇒ identical to pre-feature prompt).
 *
 * Persisted via zustand persist middleware at `store.pageBudget`.
 */
const PAGE_BUDGETS: Array<{ value: number | undefined; label: string }> = [
  { value: undefined, label: "自动 · 内容驱动" },
  { value: 4, label: "≤ 4 页" },
  { value: 6, label: "≤ 6 页" },
  { value: 8, label: "≤ 8 页" },
  { value: 10, label: "≤ 10 页" },
  { value: 12, label: "≤ 12 页" },
  { value: 16, label: "≤ 16 页" },
  { value: 20, label: "≤ 20 页" },
];

export function PageBudgetPicker() {
  const pageBudget = useStore((s) => s.pageBudget);
  const setPageBudget = useStore((s) => s.setPageBudget);

  const title =
    pageBudget
      ? `当前规则: 输出硬上限 ${pageBudget} 页 · 覆盖项目默认的"内容驱动"规则`
      : `当前规则: 内容驱动数量 / 没有上限（项目默认）`;

  return (
    <label
      className="inline-flex shrink-0 items-center gap-1.5"
      title={title}
    >
      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
        页数上限
      </span>
      <select
        value={pageBudget === undefined ? "" : String(pageBudget)}
        onChange={(e) => {
          const v = e.target.value;
          setPageBudget(v === "" ? undefined : Number(v));
        }}
        className="cursor-pointer rounded-full border bg-transparent px-2 py-0.5 text-[10.5px] outline-none transition-colors hover:border-[var(--ink)]/30"
        style={{
          borderColor: pageBudget !== undefined ? "var(--coral)" : "var(--line)",
          color: pageBudget !== undefined ? "var(--coral)" : "var(--ink-soft)",
          fontWeight: pageBudget !== undefined ? 600 : 400,
        }}
      >
        {PAGE_BUDGETS.map((opt) => (
          <option key={String(opt.value)} value={opt.value === undefined ? "" : String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
