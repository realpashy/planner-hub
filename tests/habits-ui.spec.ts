import { expect, test } from "@playwright/test";

test("habits form select keeps premium contrast and AI locked card stays visible", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("planner_hub_theme", "dark");
    document.documentElement.classList.add("dark");
  });

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "test-user",
          email: "tester@example.com",
          displayName: "Tester",
          role: "user",
        },
      }),
    });
  });

  await page.route("**/api/data", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route("**/api/habits/coach", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          headline: "ابدأ بخطوة صغيرة اليوم",
          overview: "يكفي أن تثبت عادة واحدة مبكرًا حتى يبقى اليوم متماسكًا.",
          momentumLabel: "هادئ لكن ثابت",
          encouragement: "أنت قريب من يوم جيد",
          winCondition: "أنهِ عادة واحدة أساسية قبل الظهر.",
          watchOut: "لا تحاول ضغط كل العادات في آخر اليوم.",
          actions: ["ابدأ بعادة الماء", "ثبّت عادة الحركة", "راجع التذكير المفتوح"],
          focusHabits: ["شرب الماء"],
          generatedAt: new Date().toISOString(),
        },
      }),
    });
  });

  await page.goto("/habits");

  await expect(page.getByRole("main").getByText("متتبع العادات", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "إضافة عادة" }).first().click();

  const typeTrigger = page.getByTestId("habit-type-select-trigger");
  await expect(typeTrigger).toBeVisible();
  await typeTrigger.click();

  const durationOption = page.getByText("مدة", { exact: true });
  const durationHint = page.getByText("وقت أو جلسة يومية", { exact: true });

  await expect(durationOption).toBeVisible();
  await expect(durationHint).toBeVisible();

  const hintColor = await durationHint.evaluate((node) => window.getComputedStyle(node).color);
  expect(hintColor).toBe("rgb(255, 255, 255)");

  await durationOption.hover();
  await page.waitForTimeout(120);

  const optionColor = await durationOption.evaluate((node) => window.getComputedStyle(node).color);
  expect(optionColor).toBe("rgb(0, 0, 0)");

  const hoveredHintColor = await durationHint.evaluate((node) => window.getComputedStyle(node).color);
  expect(hoveredHintColor).toBe("rgb(255, 255, 255)");

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "إلغاء" }).click();

  await page.getByRole("tab", { name: "المدرب الذكي" }).click();
  const lockedCard = page.getByTestId("habits-ai-locked-card");
  await expect(lockedCard).toBeVisible();
  await expect(lockedCard.getByRole("button", { name: "تُفتح مع Plus لاحقًا" })).toBeVisible();
});
