"use client";

import { forum } from "@/app/fonts";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import Card from "@/components/user-ui/Card";

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputsRef = useRef([]);

  const maskedPhone =
    phone.length === 10
      ? `+91 ${phone.slice(0, 2)}****${phone.slice(6)}`
      : "";

  /* ⏳ Countdown */
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  /* 📲 SEND OTP */
  const sendOTP = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (phone.length !== 10) {
      setError("Enter valid 10 digit mobile number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }

      setStep(2);
      setCountdown(30);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError("Something went wrong");
    }

    setLoading(false);
  };

  /* 🔢 HANDLE OTP INPUT */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }

    if (updated.join("").length === 4) {
      verifyOTP(updated.join(""));
    }
  };

  /* ✅ VERIFY OTP (BACKEND) */
  const verifyOTP = async (enteredOtp) => {
    const finalOtp = enteredOtp || otp.join("");

    if (finalOtp.length !== 4) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: finalOtp }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }

      router.push("/user");
    } catch (err) {
      setError("Verification failed");
    }

    setLoading(false);
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/space.jpeg')" }}
    >
      <div className="relative z-10 w-full max-w-md p-8">
        <Card className="rounded-3xl p-10">

          {/* Header */}
          <div className="text-center mb-10">
            <img
              src="/ujustlogo.png"
              className="w-16 mx-auto mb-6"
              alt="logo"
            />

            <h1 className={`${forum.className} text-5xl text-white tracking-wide`}>
              Welcome Back
            </h1>

            <p className="text-sm text-white/70 mt-3">
              Access your cosmic dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={sendOTP}>
              <label className="block text-sm text-white/80 mb-2">
                Mobile Number
              </label>

              <div className="flex items-center bg-black/40 border border-white/20 rounded-xl focus-within:ring-2 focus-within:ring-orange-400/40 transition">
                <div className="px-4 text-white/70">
                  <Phone size={18} strokeWidth={1.5} />
                </div>

                <span className="text-white/70 pr-2">+91</span>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={10}
                  placeholder="Enter mobile number"
                  className="w-full bg-transparent px-4 py-4 outline-none text-white placeholder:text-white/40"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-8 w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition font-semibold text-white uppercase tracking-wider shadow-lg shadow-orange-500/40 flex items-center justify-center gap-2"
              >
                {loading ? "SENDING..." : "CONTINUE"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <p className="text-center text-sm text-white/70 mb-8">
                Code sent to{" "}
                <span className="text-white font-medium">
                  {maskedPhone}
                </span>
              </p>

              <div className="flex justify-center gap-4 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(e.target.value, index)
                    }
                    className="w-14 h-14 text-center text-xl bg-black/40 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-orange-400 outline-none transition"
                  />
                ))}
              </div>

              <button
                onClick={() => verifyOTP()}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition font-semibold text-white uppercase tracking-wider shadow-lg shadow-orange-500/40"
              >
                {loading ? "VERIFYING..." : "VERIFY & LOGIN"}
              </button>

              <div className="flex justify-between text-sm text-white/60 mt-6 items-center">
                <button
                  onClick={() => setStep(1)}
                  className="hover:text-white transition"
                >
                  Change Number
                </button>

                <button
                  disabled={countdown > 0}
                  onClick={sendOTP}
                  className="flex items-center gap-2 disabled:opacity-40 hover:text-white transition"
                >
                  <RotateCcw size={16} />
                  {countdown > 0
                    ? `Resend in ${countdown}s`
                    : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-white/10">
            <p className="flex items-center justify-center gap-2 text-sm text-white/70">
              <ShieldCheck size={16} strokeWidth={1.5} />
              100% Secure OTP Authentication
            </p>
          </div>

        </Card>
      </div>
    </div>
  );
}