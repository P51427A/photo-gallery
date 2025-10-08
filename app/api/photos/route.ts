import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const runtime = "nodejs"; // ensure Node runtime

export async function GET() {
  const folder = process.env.CLOUDINARY_FOLDER || "gallery";

  // Search latest images in the folder
  const res = await cloudinary.search
    .expression(`folder:${folder} AND resource_type:image`)
    .sort_by("created_at", "desc")
    .max_results(200)
    .execute();

  const photos = (res.resources || []).map((r: any) => ({
    id: r.public_id,
    src: r.secure_url,
    width: r.width,
    height: r.height,
    title: r.public_id.split("/").pop(),
    tags: r.tags || [],
    takenAt: r.created_at,
  }));

  return NextResponse.json({ photos });
}
