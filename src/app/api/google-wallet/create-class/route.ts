import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleServiceAccount } from "@/lib/google-service-account";

const auth = new google.auth.GoogleAuth({
  credentials: getGoogleServiceAccount(),
  scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
});

const wallet = google.walletobjects({ version: "v1", auth });

export async function POST(req: Request) {
  try {
    const { issuerId, classSuffix } = await req.json();

    const classId = `${issuerId}.${classSuffix}`;

    // Try to fetch class first
    try {
      await wallet.genericclass.get({ resourceId: classId });
      return NextResponse.json({ message: "Class already exists", classId });
    } catch (err: any) {
      if (err.code !== 404) throw err;
    }

    // Create new class
    const newClass = {
      id: classId,
      reviewStatus: "UNDER_REVIEW", // required
      // Add your class details here
      issuerName: "Your Business Name",
      hexBackgroundColor: "#4285f4",
    };

    const response = await wallet.genericclass.insert({ requestBody: newClass });
    return NextResponse.json({ message: "Class created", response: response.data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
