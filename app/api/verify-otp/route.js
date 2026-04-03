import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { serverEnv } from "@/lib/config/serverEnv";
import {
  buildUserSessionRecord,
  getUserSessionCookieOptions,
} from "@/lib/auth/userSessionWorkflow.mjs";

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();
    const mobile = phone?.trim();

    if (!mobile || !otp) {
      return NextResponse.json({ success: false, message: "Missing data" });
    }

    const otpRef = adminDb.collection("otp_verifications").doc(mobile);
    const otpSnap = await otpRef.get();

    if (!otpSnap.exists()) {
      return NextResponse.json({ success: false, message: "OTP not found" });
    }

    const data = otpSnap.data();

    if (Date.now() > data.expiry) {
      await otpRef.delete();
      return NextResponse.json({ success: false, message: "OTP expired" });
    }

    if (data.attempts >= 5) {
      return NextResponse.json({ success: false, message: "Too many attempts" });
    }

    const isMatch = await bcrypt.compare(otp, data.otp);

    if (!isMatch) {
      await otpRef.update({ attempts: data.attempts + 1 });

      await adminDb.collection("security_logs").add({
        type: "FAILED_OTP",
        phone: mobile,
        time: Date.now(),
      });

      return NextResponse.json({ success: false, message: "Incorrect OTP" });
    }

    await otpRef.delete();

    const userSnapshot = await adminDb
      .collection("usersdetail")
      .where("MobileNo", "==", mobile)
      .get();

    if (userSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userDocSnap = userSnapshot.docs[0];
    const userData = userDocSnap.data();
    const ujbCode = userDocSnap.id;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "Unknown";

    let geo = {
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      isp: "Unknown",
    };

    try {
      if (ip !== "Unknown" && ip !== "::1") {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoRes.json();

        if (geoData.status === "success") {
          geo = {
            country: geoData.country,
            region: geoData.regionName,
            city: geoData.city,
            isp: geoData.isp,
          };
        }
      }
    } catch {
      console.log("Geo lookup failed");
    }

    const userAgent = req.headers.get("user-agent") || "";

    const deviceInfo = {
      type: /mobile/i.test(userAgent)
        ? "Mobile"
        : /tablet/i.test(userAgent)
        ? "Tablet"
        : "Desktop",
      os: /android/i.test(userAgent)
        ? "Android"
        : /iphone|ipad|ipod/i.test(userAgent)
        ? "iOS"
        : /windows/i.test(userAgent)
        ? "Windows"
        : /mac/i.test(userAgent)
        ? "MacOS"
        : /linux/i.test(userAgent)
        ? "Linux"
        : "Unknown",
      browser: /chrome/i.test(userAgent)
        ? "Chrome"
        : /safari/i.test(userAgent) && !/chrome/i.test(userAgent)
        ? "Safari"
        : /firefox/i.test(userAgent)
        ? "Firefox"
        : /edge/i.test(userAgent)
        ? "Edge"
        : "Unknown",
    };

    const sessionSnap = await adminDb
      .collection("user_sessions")
      .where("phone", "==", mobile)
      .where("revoked", "==", false)
      .get();

    const activeSessions = sessionSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .filter((session) => session.expiry > Date.now());

    if (activeSessions.length >= 3) {
      activeSessions.sort((a, b) => a.createdAt - b.createdAt);

      const oldestSession = activeSessions[0];

      await adminDb.collection("user_sessions").doc(oldestSession.id).update({
        revoked: true,
      });

      await adminDb.collection("security_logs").add({
        type: "AUTO_REVOKE_OLDEST_SESSION",
        phone: mobile,
        revokedSessionId: oldestSession.id,
        time: Date.now(),
      });
    }

    const sessionId = uuidv4();
    const sessionRecord = buildUserSessionRecord({
      phone: mobile,
      ujbCode,
      userData,
      ip,
      geo,
      deviceInfo,
      now: Date.now(),
    });

    await adminDb.collection("user_sessions").doc(sessionId).set(sessionRecord);

    await adminDb.collection("login_history").add({
      phone: mobile,
      ujbCode,
      ip,
      geo,
      deviceInfo,
      loginTime: Date.now(),
    });

    const token = jwt.sign(
      { phone: mobile, sessionId, ujbCode },
      serverEnv.jwtSecret,
      { expiresIn: "180d" }
    );

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      "crm_token",
      token,
      getUserSessionCookieOptions(serverEnv.isProduction)
    );

    return response;
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
