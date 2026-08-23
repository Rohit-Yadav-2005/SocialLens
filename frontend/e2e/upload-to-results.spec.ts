import { expect, test } from "@playwright/test";

/** The one required end-to-end happy-path test: Upload → Process →
 * Results, driven through the real running Next.js app in a real
 * browser. Backend responses are mocked at the network layer (real
 * upload/extraction/OCR/Gemini behavior is covered by the backend's own
 * test suite) so this test is fast, deterministic, and doesn't need
 * Tesseract or a GEMINI_API_KEY configured to run. */

const DOCUMENT_ID = "e2e-doc-1";

const MOCK_DOCUMENT = {
  id: DOCUMENT_ID,
  filename: "launch-post.pdf",
  original_file_type: "application/pdf",
  file_size: 512,
  status: "processed",
  extraction_method: "native",
  extracted_text: "Just launched our biggest product update yet! #ProductLaunch",
  ocr_confidence: null,
  error_message: null,
  created_at: "2026-08-23T10:00:00Z",
  updated_at: "2026-08-23T10:00:00Z",
};

const MOCK_ANALYSIS = {
  id: "e2e-analysis-1",
  document_id: DOCUMENT_ID,
  overall_score: 84,
  hook_score: 90,
  clarity_score: 88,
  engagement_score: 75,
  cta_score: 60,
  readability_score: 92,
  tone: "professional",
  sentiment: "positive",
  target_audience: "B2B marketers",
  strengths: ["Clear value proposition", "Strong opening hook"],
  weaknesses: ["The call to action could be more specific"],
  recommendations: ["Add a direct link or next step for readers"],
  improved_content: "We just launched our biggest update yet — here's what's new.",
  metrics: {
    word_count: 9,
    char_count: 62,
    sentence_count: 1,
    avg_sentence_length: 9,
    hashtag_count: 1,
    mention_count: 0,
    url_count: 0,
    emoji_count: 0,
    question_count: 0,
    has_cta: false,
    paragraph_count: 1,
    readability_score: 92,
  },
  created_at: "2026-08-23T10:01:00Z",
};

test("upload → process → results (happy path)", async ({ page }) => {
  await page.route("**/api/v1/documents", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({ status: 201, json: MOCK_DOCUMENT });
  });

  await page.route(`**/api/v1/documents/${DOCUMENT_ID}/analyze*`, async (route) => {
    await route.fulfill({ status: 201, json: MOCK_ANALYSIS });
  });

  await page.route(`**/api/v1/documents/${DOCUMENT_ID}`, async (route) => {
    if (route.request().url().includes("/analysis")) return route.fallback();
    await route.fulfill({ status: 200, json: MOCK_DOCUMENT });
  });

  await page.route(`**/api/v1/documents/${DOCUMENT_ID}/analysis`, async (route) => {
    await route.fulfill({ status: 200, json: MOCK_ANALYSIS });
  });

  // --- Upload ---
  await page.goto("/analyze");
  const main = page.getByRole("main");
  await expect(page.getByRole("heading", { name: "Analyze your content" })).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await main.getByRole("button", { name: /upload a pdf, png, or jpg file/i }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "launch-post.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nJust launched our biggest product update yet!"),
  });

  await expect(page.getByText("launch-post.pdf")).toBeVisible();

  // --- Process ---
  await main.getByRole("button", { name: "Analyze Content" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.getByText("Uploading")).toBeVisible();

  // --- Results ---
  await expect(page).toHaveURL(`/analyze/${DOCUMENT_ID}`);
  await expect(page.getByRole("heading", { name: "Analysis results" })).toBeVisible();
  await expect(page.getByText("launch-post.pdf")).toBeVisible();
  await expect(page.getByText("84", { exact: true })).toBeVisible();
  await expect(page.getByText("Clear value proposition")).toBeVisible();
  await expect(
    page.getByText("The call to action could be more specific"),
  ).toBeVisible();
  await expect(
    page.getByText("We just launched our biggest update yet — here's what's new."),
  ).toBeVisible();
});
