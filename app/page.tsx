"use client";

import { useState } from "react";

export default function Home() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to subscribe");
      setStatus("success");
      setMessage("You're subscribed! Check your phone for a message.");
      setPhone("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-slate-900">
            Why
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Daily questions to understand yourself better. One thoughtful
            question per day, via SMS.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="tel"
              placeholder="Phone number (e.g. 415-555-1234)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-semibold py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </button>
          </form>

          {status === "success" && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{message}</p>
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{message}</p>
            </div>
          )}

          <p className="text-xs text-slate-500 text-center mt-6">
            By subscribing, you agree to receive SMS messages.
          </p>
        </div>
      </div>
    </div>
  );
}
