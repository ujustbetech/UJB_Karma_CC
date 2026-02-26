import { NextResponse } from "next/server";
import { db } from "@/firebaseConfig";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();
    const mobile = phone?.trim();

    if (!mobile || !otp) {
      return NextResponse.json({ success: false, message: "Missing data" });
    }

    // 🔐 OTP VALIDATION
    const otpRef = doc(db, "otp_verifications", mobile);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return NextResponse.json({ success: false, message: "OTP not found" });
    }

    const data = otpSnap.data();

    if (Date.now() > data.expiry) {
      await deleteDoc(otpRef);
      return NextResponse.json({ success: false, message: "OTP expired" });
    }

    if (data.attempts >= 5) {
      return NextResponse.json({ success: false, message: "Too many attempts" });
    }

    const isMatch = await bcrypt.compare(otp, data.otp);

    if (!isMatch) {
      await updateDoc(otpRef, { attempts: data.attempts + 1 });

      await setDoc(doc(collection(db, "security_logs")), {
        type: "FAILED_OTP",
        phone: mobile,
        time: Date.now(),
      });

      return NextResponse.json({ success: false, message: "Incorrect OTP" });
    }

    await deleteDoc(otpRef);

    // 🔎 FETCH USER FROM usersdetail
    const userQuery = query(
      collection(db, "usersdetail"),
      where("MobileNo", "==", mobile)
    );

    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userDocSnap = userSnapshot.docs[0];
    const userData = userDocSnap.data();
    const ujbCode = userDocSnap.id; // document ID = UJBCode

    // 🌍 IP DETECTION
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "Unknown";

    // 🌍 GEO LOOKUP
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

    // 📱 DEVICE DETECTION
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

    // 🔒 DEVICE LIMIT (Auto revoke oldest, ignore expired)
    const sessionQuery = query(
      collection(db, "user_sessions"),
      where("phone", "==", mobile),
      where("revoked", "==", false)
    );

    const sessionSnap = await getDocs(sessionQuery);

    const activeSessions = sessionSnap.docs
      .map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .filter(session => session.expiry > Date.now());

    if (activeSessions.length >= 3) {
      activeSessions.sort((a, b) => a.createdAt - b.createdAt);

      const oldestSession = activeSessions[0];

      await updateDoc(doc(db, "user_sessions", oldestSession.id), {
        revoked: true,
      });

      await setDoc(doc(collection(db, "security_logs")), {
        type: "AUTO_REVOKE_OLDEST_SESSION",
        phone: mobile,
        revokedSessionId: oldestSession.id,
        time: Date.now(),
      });
    }

    // 🔐 CREATE SESSION
    const sessionId = uuidv4();
    const expiry = Date.now() + 1000 * 60 * 60 * 24 * 180;

    await setDoc(doc(collection(db, "user_sessions"), sessionId), {
      phone: mobile,
      ujbCode,
      name: userData.Name || "",
      type: userData.Type || "",
      ip,
      geo,
      deviceInfo,
      createdAt: Date.now(),
      expiry,
      revoked: false,
    });

    // 📊 LOGIN HISTORY
    await setDoc(doc(collection(db, "login_history")), {
      phone: mobile,
      ujbCode,
      ip,
      geo,
      deviceInfo,
      loginTime: Date.now(),
    });

    // 🔐 CREATE JWT
    const token = jwt.sign(
      { phone: mobile, sessionId, ujbCode },
      process.env.JWT_SECRET,
      { expiresIn: "180d" }
    );

    const response = NextResponse.json({ success: true });

    response.cookies.set("crm_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });

    return response;

  } catch (err) {
    console.error("Verify OTP Error:", err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}