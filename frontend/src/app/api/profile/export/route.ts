import { NextResponse, type NextRequest } from "next/server";

import { exportProfileDocx } from "@/lib/backend/profile";
import type { Profile } from "@/types/profile";

export const POST = async (request: NextRequest) => {
  let profile: Profile;
  try {
    profile = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const result = await exportProfileDocx(profile);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to export Profile" },
        { status: 502 },
      );
    }

    return new NextResponse(result.data, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": result.filename
          ? `attachment; filename="${result.filename}"`
          : "attachment",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
};
