import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/adminRequestAuth.mjs";
import { hasAdminAccess } from "@/lib/auth/accessControl";
import { getAdminStorageBucket } from "@/lib/firebase/firebaseAdmin";

export async function POST(req) {
  const auth = requireAdminSession(req, hasAdminAccess);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const bucket = getAdminStorageBucket();
  if (!bucket) {
    return NextResponse.json({ message: "Storage is not configured." }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");

    if (!file || !userId) {
      return NextResponse.json({ message: "Missing file or userId" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `birthdayImages/${userId}/${Date.now()}_${file.name}`;
    const storageFile = bucket.file(fileName);

    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make the file public or get a signed URL
    // For this project, we usually use public URLs if the bucket allows, 
    // or we can just return the path and handle it.
    // However, the user wants to show it on the client, so a public URL is best.
    
    await storageFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Failed to upload image" }, { status: 500 });
  }
}
