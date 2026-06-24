"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Exchange = {
  id: string;
  phoneNumber: string;
  sentDate: string;
  questionText: string;
  originalAnswer: string;
  followupQuestion: string;
  followupAnswer: string;
  status: string;
};

type Question = {
  id: string;
  text: string;
  is_active: boolean;
};

export default function AdminDashboard() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"responses" | "questions">("responses");
  const [newQuestion, setNewQuestion] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [resRes, qRes] = await Promise.all([
        fetch("/api/admin/responses"),
        fetch("/api/admin/questions"),
      ]);

      if (resRes.status === 401) {
        router.push("/admin");
        return;
      }

      if (resRes.ok) {
        const data = await resRes.json();
        setExchanges(data.exchanges || []);
      }

      if (qRes.ok) {
        const data = await qRes.json();
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newQuestion }),
      });

      if (res.ok) {
        setNewQuestion("");
        fetchData();
      }
    } catch (err) {
      console.error("Error adding question:", err);
    }
  }

  async function handleToggleQuestion(id: string, isActive: boolean) {
    try {
      await fetch(`/api/admin/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      fetchData();
    } catch (err) {
      console.error("Error toggling question:", err);
    }
  }

  async function handleExport() {
    const res = await fetch("/api/admin/responses/export");
    const csv = await res.text();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "why-responses.csv";
    a.click();
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Why Admin</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab("responses")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              tab === "responses"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-900 border border-slate-300"
            }`}
          >
            Responses ({exchanges.length})
          </button>
          <button
            onClick={() => setTab("questions")}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              tab === "questions"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-900 border border-slate-300"
            }`}
          >
            Questions ({questions.length})
          </button>
        </div>

        {tab === "responses" && (
          <div className="space-y-4">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Export CSV
            </button>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left">Phone</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Question</th>
                    <th className="px-4 py-2 text-left">Answer</th>
                    <th className="px-4 py-2 text-left">Follow-up</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exchanges.map((ex) => (
                    <tr key={ex.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2">{ex.phoneNumber}</td>
                      <td className="px-4 py-2">{ex.sentDate}</td>
                      <td className="px-4 py-2 text-xs">{ex.questionText}</td>
                      <td className="px-4 py-2 text-xs">{ex.originalAnswer}</td>
                      <td className="px-4 py-2 text-xs">
                        {ex.followupQuestion}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            ex.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {ex.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "questions" && (
          <div className="space-y-4">
            <form onSubmit={handleAddQuestion} className="bg-white p-4 rounded-lg shadow">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New question..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="submit"
                  className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="bg-white rounded-lg shadow overflow-y-auto max-h-96">
              <div className="p-4 space-y-2">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{q.text}</p>
                    </div>
                    <button
                      onClick={() => handleToggleQuestion(q.id, q.is_active)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        q.is_active
                          ? "bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800"
                          : "bg-gray-100 text-gray-800 hover:bg-green-100 hover:text-green-800"
                      }`}
                    >
                      {q.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
