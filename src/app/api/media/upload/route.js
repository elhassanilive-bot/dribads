import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthorizedUser } from "@/lib/dribads/api-auth";

const BUCKET = "dribads-media";
const MAX_SIZE_BYTES = 25 * 1024 * 1024;

function isAllowedMime(type) {
  return typeof type === "string" && (type.startsWith("image/") || type.startsWith("video/"));
}

function createStoragePath(filename = "file") {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `ads/${stamp}-${rand}-${safeName}`;
}

let bucketReady = false;

async function ensureBucket(supabase) {
  if (bucketReady) return;

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  const exists = (buckets || []).some((bucket) => bucket.name === BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE_BYTES,
      allowedMimeTypes: ["image/*", "video/*"],
    });
    if (createError && !String(createError.message || "").toLowerCase().includes("already")) {
      throw createError;
    }
  }

  bucketReady = true;
}

export async function POST(request) {
  try {
    const auth = await getAuthorizedUser(request);
    if (auth.error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!isAllowedMime(file.type)) {
      return NextResponse.json({ error: "file must be image/video" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "file too large (max 25MB)" }, { status: 400 });
    }

    await ensureBucket(supabase);

    const arrayBuffer = await file.arrayBuffer();
    const storagePath = createStoragePath(file.name);

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || "Upload failed" }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = publicData?.publicUrl || "";

    return NextResponse.json(
      {
        url: publicUrl,
        path: storagePath,
        bucket: BUCKET,
        mime: file.type,
        size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/media/upload error", error);
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}
