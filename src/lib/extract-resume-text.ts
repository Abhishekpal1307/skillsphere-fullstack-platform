// Client-side text extraction for PDF / DOCX / TXT resumes.
// Keeps the binary off the server: we send only extracted text to the edge function.

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type === "text/plain") {
    return await file.text();
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return await extractPdf(file);
  }
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return await extractDocx(file);
  }
  if (name.endsWith(".doc")) {
    throw new Error("Legacy .doc files are not supported — please export as PDF or .docx.");
  }
  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT resume.");
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Use a worker URL bundled with pdfjs-dist v4
  // @ts-expect-error - vite resolves the ?url import
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  const max = Math.min(pdf.numPages, 10); // cap pages to keep payload small
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: { str?: string }) => ("str" in it ? it.str : "")).filter(Boolean);
    out += strings.join(" ") + "\n";
  }
  return out.trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value || "").trim();
}
