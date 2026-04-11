import { expect, test } from "@playwright/test";

function seedPlannerHubStorage() {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  window.localStorage.setItem("planner_hub_theme", "dark");
  document.documentElement.classList.add("dark");

  window.localStorage.setItem(
    "planner_hub_data",
    JSON.stringify({
      settings: { language: "ar", theme: "dark" },
      tags: [],
      events: [
        {
          id: "event-1",
          date: todayIso,
          time: "11:00",
          title: "اجتماع متابعة",
          icon: "📅",
        },
      ],
      tasks: [
        {
          id: "task-1",
          date: todayIso,
          text: "مراجعة أولويات اليوم",
          completed: false,
          isWeekly: false,
        },
        {
          id: "task-2",
          date: todayIso,
          text: "إغلاق مهمة متأخرة",
          completed: false,
          isWeekly: false,
          deadline: todayIso,
        },
      ],
      habits: [
        {
          id: "planner-habit-1",
          name: "شرب الماء",
          completedDates: [],
        },
      ],
      notes: [],
    }),
  );

  window.localStorage.setItem(
    "planner_hub_budget_v2",
    JSON.stringify({
      settings: { currency: "ILS", monthlyLimit: 12000, rolloverEnabled: false },
      categories: [],
      transactions: [
        {
          id: "budget-1",
          type: "expense",
          title: "مصروف تسويق",
          amount: 800,
          date: todayIso,
          subcategoryId: "marketing",
          note: "",
        },
      ],
      bills: [],
      debts: [],
      savingsGoals: [],
      recurringTemplates: [],
    }),
  );

  window.localStorage.setItem(
    "planner_hub_cashflow_v2",
    JSON.stringify({
      settings: {
        currency: "ILS",
        balanceMode: "split",
        bankBalance: 15000,
        cashOnHand: 1800,
      },
      transactions: [
        {
          id: "cash-income",
          type: "income",
          amount: 4200,
          date: todayIso,
          category: "daily_sales",
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
        },
      ],
      upcomingPayments: [
        {
          id: "payment-1",
          name: "دفعة مورد",
          category: "suppliers",
          amount: 1250,
          dueDate: tomorrowIso,
          status: "pending",
          recurringMonthly: false,
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
        },
      ],
      partners: [],
      lastUpdated: today.toISOString(),
    }),
  );

  window.localStorage.setItem(
    "planner_hub_habits_v1",
    JSON.stringify({
      habits: [
        {
          id: "habit-1",
          name: "رياضة خفيفة",
          category: "movement",
          type: "duration",
          trackingMode: "check",
          target: 15,
          unit: "دقيقة",
          emoji: "🏃",
          reminderTime: "08:00",
          createdAt: today.toISOString(),
          updatedAt: today.toISOString(),
        },
      ],
      logs: [],
      moods: [{ date: todayIso, mood: "steady" }],
      lastUpdated: today.toISOString(),
    }),
  );
}

test.describe("shared dashboard shell", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(seedPlannerHubStorage);

    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "dashboard-user",
            email: "tester@example.com",
            displayName: "ضياء",
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

    await page.route("**/api/dashboard/ai", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            headline: "اليوم يحتاج تركيزًا ذكيًا",
            summary: "لديك مهمتان مفتوحتان وعادة واحدة تحتاج تثبيتًا مبكرًا.",
            bestNextAction: {
              type: "planner",
              label: "ابدأ بمراجعة أولويات اليوم",
              targetId: "task-1",
            },
            bullets: ["راجع أولويات اليوم", "ثبّت عادة الرياضة قبل الظهر", "انتبه لدفعة المورد غدًا"],
            generatedAt: new Date().toISOString(),
            source: "fallback",
          },
        }),
      });
    });
  });

  test("renders the Lumina Noir desktop shell and premium dashboard", async ({ page }) => {
    await page.goto("/");

    const sidebar = page.getByTestId("desktop-shell-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "الرئيسية" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "المخطط الأسبوعي" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "الميزانية الشهرية" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "الإعدادات" })).toBeVisible();

    await expect(page.getByTestId("global-topbar-search")).toBeVisible();
    await expect(page.getByRole("heading", { name: /مرحبًا/ })).toBeVisible();
    await expect(page.getByText("نبض اليوم", { exact: true })).toBeVisible();
    await expect(page.getByText("التدفق الزمني لليوم", { exact: true })).toBeVisible();
    await expect(page.getByText("الوحدات الأساسية", { exact: true })).toBeVisible();
    await expect(page.getByText("مساعد الذكاء", { exact: true })).toBeVisible();

    await expect(page.getByTestId("mobile-bottom-nav")).toBeHidden();

    await page.getByRole("button", { name: "طي الشريط الجانبي" }).click();
    await expect(page.getByTestId("desktop-shell-sidebar")).toHaveAttribute("data-collapsed", "true");

    await page.getByRole("button", { name: "توسيع الشريط الجانبي" }).click();
    await expect(page.getByTestId("desktop-shell-sidebar")).toHaveAttribute("data-collapsed", "false");
  });

  test("renders the mobile bottom navigation and routes into settings", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByTestId("mobile-bottom-nav")).toBeVisible();
    await expect(page.getByTestId("desktop-shell-sidebar")).toBeHidden();

    await page.getByTestId("mobile-bottom-nav").getByRole("link", { name: "الإعدادات" }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole("heading", { name: "إعدادات Planner Hub" })).toBeVisible();
  });

  test("keeps the light theme on the warm Lumina Noir palette instead of raw white", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("button-theme-toggle").evaluate((element: HTMLButtonElement) => element.click());

    const themeVars = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        background: styles.getPropertyValue("--background").trim(),
        card: styles.getPropertyValue("--card").trim(),
        border: styles.getPropertyValue("--border").trim(),
      };
    });

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    expect(themeVars.background).toBe("34 22% 92%");
    expect(themeVars.card).toBe("38 27% 95%");
    expect(themeVars.border).toBe("28 12% 78%");
  });
});
