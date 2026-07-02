/**
 * Xuất các "section" con (mỗi cái 1 trang) trong 1 container ra PDF — chạy ngầm,
 * không đổi giao diện đang xem.
 */
export async function exportSectionsToPdf(
  container: HTMLElement,
  sectionSelector: string,
  filename: string,
) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  const sections = Array.from(container.querySelectorAll<HTMLElement>(sectionSelector));
  let pdf: InstanceType<typeof jsPDF> | null = null;
  for (const sec of sections) {
    const canvas = await html2canvas(sec, { scale: 2, backgroundColor: "#F7F9FC", useCORS: true });
    const img = canvas.toDataURL("image/png");
    const w = canvas.width, h = canvas.height;
    const orientation = w > h ? "landscape" : "portrait";
    if (!pdf) pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
    else pdf.addPage([w, h], orientation);
    pdf.addImage(img, "PNG", 0, 0, w, h);
  }
  pdf?.save(filename);
}

/**
 * Xuất nhiều "trang" ra 1 file PDF. Trước mỗi trang gọi beforeEach(i) (vd đổi tab),
 * đợi render rồi chụp phần tử do getEl() trả về.
 */
export async function exportMultiPagePdf(
  getEl: () => HTMLElement | null,
  pages: number,
  beforeEach: (i: number) => void,
  filename: string,
) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  let pdf: InstanceType<typeof jsPDF> | null = null;
  for (let i = 0; i < pages; i++) {
    beforeEach(i);
    // đợi React re-render tab mới
    await new Promise((r) => setTimeout(r, 450));
    const el = getEl();
    if (!el) continue;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#F7F9FC", useCORS: true });
    const img = canvas.toDataURL("image/png");
    const w = canvas.width, h = canvas.height;
    const orientation = w > h ? "landscape" : "portrait";
    if (!pdf) pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
    else pdf.addPage([w, h], orientation);
    pdf.addImage(img, "PNG", 0, 0, w, h);
  }
  pdf?.save(filename);
}

/** Xuất một phần tử ra PDF khổ A4 (canh giữa, fit theo bề rộng) — dùng cho poster in. */
export async function exportElementToA4Pdf(el: HTMLElement, filename: string) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210, pageH = 297;
  const ratio = canvas.height / canvas.width;
  let w = pageW, h = pageW * ratio;
  if (h > pageH) { h = pageH; w = pageH / ratio; }
  pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
  pdf.save(filename);
}

// Xuất một phần tử DOM ra file PDF (client-only).
export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
  ]);

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#F7F9FC",
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(filename);
}
