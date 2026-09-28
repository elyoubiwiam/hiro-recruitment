export type Extracted = { text?: string; fileData?: string; filename: string };

export async function extractFile(file: File): Promise<Extracted> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return { fileData: `data:application/pdf;base64,${btoa(binary)}`, filename: file.name };
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { text: res.value, filename: file.name };
  }
  return { text: await file.text(), filename: file.name };
}
