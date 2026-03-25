import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, push, get } from "firebase/database";

export default function ScanPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const queueRef = ref(db, "queue");
      const snapshot = await get(queueRef);
      let existingToken = null;
      let alreadyDone = false;

      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.values(data).forEach((entry) => {
          if (entry.name.toLowerCase() === name.trim().toLowerCase()) {
            if (entry.status === "waiting" || entry.status === "current") {
              // Still in queue — redirect to same token
              existingToken = entry.token;
            } else if (entry.status === "done") {
              // Visit completed — allow new token
              alreadyDone = true;
            }
          }
        });
      }

      // If still waiting or with doctor → show same token
      if (existingToken) {
        navigate(`/user/${existingToken}`);
        return;
      }

      // Assign new token
      const allEntries = snapshot.exists() ? Object.values(snapshot.val()) : [];
      const maxToken = allEntries.length > 0 ? Math.max(...allEntries.map((e) => e.token)) : 0;
      const token = maxToken + 1;

      await push(queueRef, {
        name: name.trim(),
        token,
        status: "waiting",
        joinedAt: Date.now(),
      });

      navigate(`/user/${token}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hospital Logo & Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <svg className="w-12 h-12 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">MediCare Clinic</h1>
          <p className="text-blue-200 mt-1">Smart Queue Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome! 👋</h2>
          <p className="text-gray-500 mb-6">Enter your name to join the queue and get your token number</p>

          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            placeholder="e.g. John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-lg focus:outline-none focus:border-blue-500 transition"
          />

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Joining..." : "Join Queue →"}
          </button>

          <div className="mt-6 flex items-center gap-3 bg-blue-50 rounded-xl p-4">
            <span className="text-2xl">ℹ️</span>
            <p className="text-blue-700 text-sm">If you already joined, enter the same name to see your token!</p>
          </div>
        </div>

        <p className="text-center text-blue-200 text-sm mt-6">© 2026 MediCare Clinic. All rights reserved.</p>
      </div>
    </div>
  );
}