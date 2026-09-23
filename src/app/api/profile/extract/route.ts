import { NextResponse, type NextRequest } from "next/server";

import { extractProfile } from "@/lib/backend/profile";

// A plain Route Handler forwarding the browser's FormData/File as-is,
// rather than a Server Action — Next.js Server Actions can receive a File,
// but round-tripping it back through the RSC boundary risks quirks a plain
// JSON response doesn't have. The actual backend call lives in
// extractProfile (src/lib/backend/profile.ts), not inlined here.
export const POST = async (request: NextRequest) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  let profile;
  try {
    profile = await extractProfile(formData);
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Failed to extract Profile" },
      { status: 502 },
    );
  }

  return NextResponse.json(profile);
};
