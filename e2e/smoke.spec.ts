import { expect, test, type Page } from "@playwright/test";

// Runs against the seeded sample user (npm run db:seed).
async function signIn(page: Page) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@mail.com");
  await page.getByLabel("Senha").fill("aura1234");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/hoje$/);
}

const shot = (page: Page, name: string) =>
  process.env.E2E_SCREENSHOTS
    ? page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/${test.info().project.name}-${name}.png`, fullPage: true })
    : undefined;

test("redirects to sign in when signed out", async ({ page }) => {
  await page.goto("/hoje");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByText("Fique perto do que importa.")).toBeVisible();
  await shot(page, "entrar");
});

test("core screens render", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("heading", { name: /, Ana\.$/ })).toBeVisible();
  await expect(page.getByText(/tarefas · \d+ de metas/)).toBeVisible();
  await shot(page, "hoje");

  // Missed-task prompt: the suggestion follows the reason.
  await page.getByRole("button", { name: "O que atrapalhou?" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Não deu para concluir/)).toBeVisible();
  await dialog.getByRole("radio", { name: "Imprevisto" }).click();
  await expect(dialog.getByText("Mover para sábado")).toBeVisible();
  await dialog.getByRole("radio", { name: "Muito cansado" }).click();
  await expect(dialog.getByText("Mover para amanhã de manhã")).toBeVisible();
  await expect(dialog.getByText(/Terceira vez/)).toBeVisible();
  await shot(page, "tarefa-perdida");
  await page.keyboard.press("Escape");

  await page.goto("/semana");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("–");
  await shot(page, "semana");

  await page.goto("/metas");
  await expect(page.getByText("Aprender piano").first()).toBeVisible();
  await shot(page, "metas");

  await page.getByRole("link", { name: /Aprender piano/ }).first().click();
  await expect(page.getByText("perdidas, 7 dias").first()).toBeVisible();
  await shot(page, "meta-detalhe");

  await page.goto("/refletir");
  await expect(page.getByText("Choveu")).toBeVisible();
  await shot(page, "refletir");

  await page.goto("/refletir/escrever");
  await expect(page.getByText("O QUE ESTÁ NA SUA CABEÇA?")).toBeVisible();
  await shot(page, "escrever");
});

// Goal → Task → Miss → Reflection → Adjustment. Mutates the seed, so it runs last and only once.
test("answering a missed task closes the loop", async ({ page }) => {
  test.skip(test.info().project.name !== "desktop", "runs once");
  await signIn(page);

  // Reflect on the metronome miss: the journal opens pre-filled with task, goal and reason.
  const metronome = page.locator("div", { hasText: /^Praticar com metrônomo/ }).filter({
    has: page.getByRole("button", { name: "O que atrapalhou?" }),
  });
  await metronome.getByRole("button", { name: "O que atrapalhou?" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("radio", { name: "Imprevisto" }).click();
  await dialog.getByRole("button", { name: "Refletir sobre isso" }).click();
  await expect(page).toHaveURL(/\/refletir\/escrever\?ciclo=/);
  // The sheet eases out and keeps its text for a moment; wait for it to be gone before looking at the page.
  await expect(dialog).toBeHidden();
  await expect(page.getByText("O QUE ATRAPALHOU?")).toBeVisible();
  await expect(page.getByText("Motivo: Imprevisto").first()).toBeVisible();
  await page.getByLabel("Título").fill("Semana corrida");
  await page.locator("textarea").first().fill("Uma reunião surgiu cedo.");
  await page.getByRole("button", { name: "Salvar" }).last().click();
  await expect(page).toHaveURL(/\/refletir$/);
  await expect(page.getByText("Semana corrida")).toBeVisible();

  // Accept the suggestion: the task moves to the coming Saturday and leaves today.
  await page.goto("/hoje");
  await metronome.getByRole("button", { name: "O que atrapalhou?" }).click();
  await expect(dialog.getByText("Mover para sábado")).toBeVisible(); // the reason was kept
  await dialog.getByRole("button", { name: "Aceitar" }).click();
  await expect(dialog).toBeHidden();
  await expect(metronome).toHaveCount(0); // it still shows in the RECENTE feed as a past miss

  // Create a task linked to a goal.
  await page.getByRole("button", { name: "+ Nova tarefa" }).click();
  const editor = page.getByRole("dialog", { name: "Nova tarefa" });
  await editor.getByLabel("Título").fill("Revisar o capítulo 4");
  await editor.getByLabel("Meta").selectOption({ label: "Ler 12 livros" });
  await editor.getByRole("button", { name: "Criar tarefa" }).click();
  await expect(page.getByText("Revisar o capítulo 4")).toBeVisible();
});
