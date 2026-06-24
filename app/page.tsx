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
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-2xl">
        <div className="space-y-12">
          {/* Header */}
          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white tracking-tighter">
              Socrates
            </h1>

            <div className="space-y-4">
              <p className="text-xl text-gray-300 leading-relaxed">
                One thoughtful question every day, delivered to your phone.
              </p>
              <p className="text-lg text-gray-400 leading-relaxed">
                We believe true understanding comes from asking the right questions about yourself — your motivations, beliefs, decisions, and the hidden reasons that drive your choices.
              </p>
              <p className="text-lg text-gray-400 leading-relaxed">
                Over time, these daily conversations create a dataset of genuine human reasoning. Your answers help us understand what actually matters to people.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              className="w-full px-6 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50 transition text-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition text-lg"
            >
              {loading ? "Subscribing..." : "Start Asking"}
            </button>
          </form>

          {status === "success" && (
            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
              <p className="text-green-300 text-sm">{message}</p>
            </div>
          )}
          {status === "error" && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{message}</p>
            </div>
          )}

          {/* Footer */}
          <p className="text-xs text-gray-600 text-center">
            By subscribing, you agree to receive SMS messages. Your responses help us build the world's largest database of human reasoning.
          </p>
        </div>
      </div>
    </div>
  );
}
