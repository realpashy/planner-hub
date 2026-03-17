# RTL layout rules (Arabic UI)

- When the app language is RTL (Arabic), align **titles and labels to the right**, and place **icons immediately to their left** (e.g. `flex items-center justify-end gap-2`).
- In horizontal value rows (like bar charts or lists), keep **labels on the right** and **numbers/percentages on the left**, using `flex-row-reverse` and, where needed, `direction: ltr` only on the numeric span.
- In action rows that show a title/metadata and an amount (e.g. "آخر عمليات هذا الشهر"), render the **title/meta block on the right** and the **amount on the left**, again via `flex-row-reverse` plus an LTR wrapper for the numeric value.
- For controls that combine text and chevrons (like selects), when `dir="rtl"` is active, the **chevron should appear on the left and the text on the right**; use `rtl:flex-row-reverse` or an equivalent approach.

