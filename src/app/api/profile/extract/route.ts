import { NextResponse, type NextRequest } from "next/server";

import { getBackendAuthToken } from "@/lib/backend/client";
import { getEnvVar } from "@/lib/utils";

const backendUrl = getEnvVar("BACKEND_URL");

// A plain Route Handler forwarding the browser's FormData/File as-is via
// native fetch, rather than a Server Action — Next.js Server Actions can
// receive a File, but round-tripping it through axios (used by
// src/lib/backend/client.ts) to another server risks multipart quirks that
// native fetch's FormData support doesn't have.
export const POST = async (request: NextRequest) => {
  let token: string;
  try {
    token = await getBackendAuthToken();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${backendUrl}/profile/extract`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to extract Profile" },
        { status: 502 },
      );
    }

    const profile = await response.json();
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to extract Profile from upload", error);
    return NextResponse.json(
      { error: "Failed to reach the backend" },
      { status: 502 },
    );
  }
};
