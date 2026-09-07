import { NextResponse } from "next/server";
import {
  getSecurityPostureSummary,
  getSecurityControls,
  getSecurityEvents,
} from "@/lib/security-events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const posture = getSecurityPostureSummary();
    const controls = getSecurityControls();
    const events = getSecurityEvents(50);

    return NextResponse.json(
      {
        success: true,
        data: {
          posture,
          controls,
          events,
          generated_at: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("Security events API error:", error?.message);
    return NextResponse.json(
      { success: false, error: "Internal server error retrieving security posture" },
      { status: 500 }
    );
  }
}
