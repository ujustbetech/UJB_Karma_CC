"use client";

export default function InvalidProspectActionPage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-2xl font-semibold text-rose-800">Invalid or Expired Link</h1>
        <p className="mt-2 text-rose-700">
          This action link is invalid or has already been used. Please contact the support team for
          help.
        </p>
      </div>
    </main>
  );
}

