import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "ledger-docs");
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

/** Format today as DDMMYYYY, e.g. 28042026 */
function formatDateDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}${mm}${yyyy}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fieldKey = (formData.get("fieldKey") as string) ?? "DOC";
    const ledcd = (formData.get("ledcd") as string) ?? "UNKNOWN";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WEBP, and PDF files are allowed" },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size must be under 10 MB" },
        { status: 400 },
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Build filename: {LEDCD}-{FIELDKEY}-{DDMMYYYY}.{ext}
    // e.g. ACCA1001-AADHAR-28042026.pdf
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const safeLedcd = ledcd.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const safeField = fieldKey.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const dateStr = formatDateDDMMYYYY(new Date());
    const filename = `${safeLedcd}-${safeField}-${dateStr}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Write to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return the public URL path (served by Next.js static file serving)
    const publicUrl = `/uploads/ledger-docs/${filename}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Only allow deleting from our uploads folder
    if (!url.startsWith("/uploads/ledger-docs/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    const filename = path.basename(url);
    const filePath = path.join(UPLOAD_DIR, filename);

    const { unlink } = await import("fs/promises");
    await unlink(filePath).catch(() => {
      // If file doesn't exist, silently ignore
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[upload/delete] error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}