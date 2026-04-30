"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import {
  auth,
  googleProvider,
  microsoftProvider,
} from "@/services/adminLoginFirebaseService";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "@/services/adminLoginFirebaseService";

function ProviderButton({
  label,
  onClick,
  disabled,
  loading,
  icon,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
        {icon}
      </span>
      <span>{loading ? "Please wait..." : label}</span>
    </button>
  );
}

function validateEmail(value) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
    String(value || "").trim()
  );
}

function buildAdminSessionApiError(status, message) {
  if (status === 404) {
    return "Admin session API is unavailable. Restart the app and verify the current server includes /api/admin/session routes.";
  }

  return message || "Admin login failed. Please verify your access configuration.";
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 3.2 14.6 2.3 12 2.3 6.7 2.3 2.3 6.7 2.3 12S6.7 21.7 12 21.7c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.2H12Z"
      />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" fill="#F25022" />
      <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
      <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
      <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const res = await fetch("/api/admin/session/validate", {
          credentials: "include",
        });

        if (res.ok) {
          router.replace("/admin/orbiters");
          return;
        }

        if (res.status === 404) {
          setStatus({
            type: "error",
            message: buildAdminSessionApiError(res.status),
          });
        }
      } catch {
        // No active admin session.
      }
    };

    checkAdminSession();
  }, [router]);

  const anyBusy = useMemo(
    () => Boolean(loadingProvider || passwordSubmitting || resetSubmitting),
    [loadingProvider, passwordSubmitting, resetSubmitting]
  );

  const finishAdminLogin = async (user) => {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/admin/session/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success) {
      await signOut(auth).catch(() => {});
      throw new Error(buildAdminSessionApiError(res.status, data?.message));
    }

    router.replace("/admin/orbiters");
  };

  const clearMessages = () => {
    setStatus({ type: "", message: "" });
    setFieldErrors({});
  };

  const handleProviderLogin = async (providerName, provider) => {
    if (anyBusy) return;

    clearMessages();
    setLoadingProvider(providerName);

    try {
      const result = await signInWithPopup(auth, provider);
      await finishAdminLogin(result.user);
    } catch (error) {
      const errorCode = error?.code || "";

      if (
        errorCode === "auth/cancelled-popup-request" ||
        errorCode === "auth/popup-closed-by-user"
      ) {
        return;
      }

      if (errorCode === "auth/configuration-not-found") {
        setStatus({
          type: "error",
          message: `${providerName} sign-in is not configured in Firebase Authentication for this project.`,
        });
        return;
      }

      if (errorCode === "auth/account-exists-with-different-credential") {
        setStatus({
          type: "error",
          message:
            "This email is linked to a different sign-in method. Please use the original provider or reset the account credentials.",
        });
        return;
      }

      setStatus({
        type: "error",
        message: error?.message || `${providerName} login failed.`,
      });
    } finally {
      setLoadingProvider("");
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (anyBusy) return;

    clearMessages();

    const nextErrors = {};
    const trimmedEmail = String(email || "").trim();

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!validateEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setPasswordSubmitting(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      await finishAdminLogin(credential.user);
    } catch (error) {
      const errorCode = error?.code || "";

      if (
        errorCode === "auth/invalid-credential" ||
        errorCode === "auth/wrong-password" ||
        errorCode === "auth/user-not-found"
      ) {
        setStatus({
          type: "error",
          message: "Invalid email or password.",
        });
      } else if (errorCode === "auth/too-many-requests") {
        setStatus({
          type: "error",
          message:
            "Too many failed attempts. Please wait a moment or use Forgot password.",
        });
      } else {
        setStatus({
          type: "error",
          message: error?.message || "Email login failed.",
        });
      }

      setPassword("");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (anyBusy) return;

    clearMessages();

    const trimmedEmail = String(resetEmail || "").trim();

    if (!trimmedEmail) {
      setFieldErrors({ resetEmail: "Email is required for password reset." });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setFieldErrors({ resetEmail: "Enter a valid email address." });
      return;
    }

    setResetSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setStatus({
        type: "success",
        message:
          "Password reset email sent. Please check your inbox and follow the secure reset link.",
      });
    } catch (error) {
      const errorCode = error?.code || "";

      if (errorCode === "auth/user-not-found") {
        setStatus({
          type: "error",
          message: "No account exists for that email address.",
        });
      } else {
        setStatus({
          type: "error",
          message: error?.message || "Unable to send reset email.",
        });
      }
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f6f8fb] text-slate-900">
      <div className="w-full">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="relative overflow-hidden bg-[linear-gradient(145deg,#eaf4ff_0%,#edf8f6_44%,#f7fbff_100%)] px-6 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.10),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(20,184,166,0.08),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(249,115,22,0.08),transparent_28%)]" />
          <div className="absolute inset-y-0 right-0 hidden w-px bg-slate-200/70 lg:block" />

          <div className="relative w-full space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 backdrop-blur">
                <ShieldCheck size={14} />
                UJustBe Admin Access
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Secure Workspace
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
              <div className="max-w-2xl">
                <div className="flex items-center gap-5">
                  <div className="rounded-[28px] border border-white/90 bg-white/90 p-3 shadow-[0_16px_36px_rgba(148,163,184,0.18)] backdrop-blur">
                    <Image
                      src="/ujustbe-logo.svg"
                      alt="UJustBe logo"
                      width={120}
                      height={120}
                      priority
                      className="h-20 w-20 rounded-[22px] object-cover sm:h-24 sm:w-24"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700/80">
                      UJustBe Universe
                    </p>
                    <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl xl:text-[2.9rem]">
                      Admin Workspace Login
                    </h1>
                  </div>
                </div>

                <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  Secure access for authorized administrators to manage platform
                  operations.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:max-w-2xl xl:grid-cols-3">
                  {[
                    "Microsoft and Google sign-in",
                    "Email and password authentication",
                    "Password reset support",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-3xl border border-white/90 bg-white/78 p-4 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="mb-3 inline-flex rounded-full bg-sky-100 p-2 text-sky-700">
                        <Sparkles size={16} />
                      </div>
                      <p className="text-sm leading-6 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[26px] border border-white/90 bg-white/82 p-5 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700/75">
                    Access Overview
                  </p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">
                    Authorized admin sign-in
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Use your approved account to continue to the admin dashboard.
                  </p>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-slate-50/90 p-5">
                  <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                    {[
                      ["01", "Role-based access"],
                      ["02", "Secure authentication"],
                      ["03", "Password recovery"],
                    ].map(([index, label]) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 shadow-sm">
                          {index}
                        </span>
                        <p className="text-sm leading-6 text-slate-700">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#fbfdff_0%,#f2f6fb_100%)] px-5 py-7 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
          <div className="w-full">
            <div className="mx-auto w-full max-w-lg rounded-[28px] border border-white/90 bg-white/92 p-6 shadow-[0_24px_56px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Welcome Back
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
                  Admin Login
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                  Sign in with your approved admin account to access the dashboard.
                </p>
              </div>

              {status.message ? (
                <div
                  className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
                    status.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {status.message}
                </div>
              ) : null}

              <div className="space-y-3">
                <ProviderButton
                  label="Sign in with Microsoft"
                  onClick={() =>
                    handleProviderLogin("Microsoft", microsoftProvider)
                  }
                  disabled={anyBusy}
                  loading={loadingProvider === "Microsoft"}
                  icon={<MicrosoftMark />}
                />
                <ProviderButton
                  label="Sign in with Google"
                  onClick={() => handleProviderLogin("Google", googleProvider)}
                  disabled={anyBusy}
                  loading={loadingProvider === "Google"}
                  icon={<GoogleMark />}
                />
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Or use email
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {!forgotMode ? (
                <form className="space-y-4" onSubmit={handlePasswordLogin}>
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="admin-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        placeholder="admin@ujustbe.com"
                      />
                    </div>
                    {fieldErrors.email ? (
                      <p className="mt-2 text-xs text-rose-600">{fieldErrors.email}</p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="admin-password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        placeholder="Enter your password"
                      />
                    </div>
                    {fieldErrors.password ? (
                      <p className="mt-2 text-xs text-rose-600">
                        {fieldErrors.password}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <p className="text-xs leading-5 text-slate-500">
                      Passwords are verified through Firebase Authentication and are
                      never stored in app code or plain text.
                    </p>

                    <button
                      type="button"
                      className="shrink-0 text-sm font-medium text-sky-700 transition hover:text-sky-800"
                      onClick={() => {
                        clearMessages();
                        setForgotMode(true);
                        setResetEmail(email);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="mt-2 w-full justify-center"
                    disabled={anyBusy}
                    loading={passwordSubmitting}
                  >
                    Sign in with Email
                  </Button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handlePasswordReset}>
                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    Send a secure reset link to your admin email. Once you update the
                    password, come back here and sign in normally.
                  </div>

                  <div>
                    <label
                      htmlFor="reset-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Reset email
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, resetEmail: "" }));
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                        placeholder="admin@ujustbe.com"
                      />
                    </div>
                    {fieldErrors.resetEmail ? (
                      <p className="mt-2 text-xs text-rose-600">
                        {fieldErrors.resetEmail}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    className="w-full justify-center"
                    disabled={anyBusy}
                    loading={resetSubmitting}
                  >
                    Send Reset Link
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setForgotMode(false);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    <ArrowLeft size={16} />
                    Back to sign in
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}




