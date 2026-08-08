import { requireUser } from "@/lib/session";
import { newId } from "@/lib/ids";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ApiError, fail, ok, readBody } from "@/lib/api";

// ---------------------------------------------------------------------------
// Local file storage (S3-compatible abstraction).
// Accepts base64 data URLs, validates type/size, writes to public/uploads and
// returns a public URL. Swapping this for Cloudinary/S3 is a one-function
// change in production.
// ---------------------------------------------------------------------------

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["application/pdf", ".pdf"],
]);

const schema = z.object({
  dataUrl: z.string().min(50, "No file provided.").max(6 * 1024 * 1024),
  kind: z.enum(["avatar", "attachment"]).default("attachment"),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await readBody(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid upload.", 400);

    const match = parsed.data.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return fail("VALIDATION_ERROR", "Unsupported file format.", 400);
    const mime = match[1];
    const ext = ALLOWED.get(mime);
    if (!ext) return fail("VALIDATION_ERROR", "Only images and PDFs are supported.", 400);

    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > MAX_SIZE) return fail("VALIDATION_ERROR", "File is too large (max 4 MB).", 400);

    const dir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${parsed.data.kind}-${newId()}${ext}`;
    fs.writeFileSync(path.join(dir, filename), buffer);

    return ok({ url: `/uploads/${filename}`, kind: parsed.data.kind, size: buffer.length }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    console.error("upload:", err);
    return fail("INTERNAL", "Something went wrong.", 500);
  }
}
