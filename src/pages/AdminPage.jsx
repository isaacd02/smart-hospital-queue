import { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, onValue, update, remove, get } from "firebase/database";

const ADMIN_PASSWORD = "medicare2026";
const APP_URL = window.location.origin;

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [done, setDone] = useState([]);

  useEffect(() => {
    if (!authed) return;
    const queueRef = ref(db, "queue");
    const unsub = onValue(queueRef, (snapshot) => {
      if (!snapshot.exists()) {
        setQueue([]);
        setCurrent(null);
        setDone([]);
        return;
      }
      const data = snapshot.val();
      const entries = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      entries.sort((a, b) => a.token - b.token);
      setQueue(entries.filter((e) => e.status === "waiting"));
      setCurrent(entries.find((e) => e.status === "current") || null);
      setDone(entries.filter((e) => e.status === "done"));
    });
    return () => unsub();
  }, [authed]);

  const playBell = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1);
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError("");
    } else {
      setError("Wrong password!");
    }
  };

  const callNext = async () => {
    const queueRef = ref(db, "queue");
    const snapshot = await get(queueRef);
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const entries = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    entries.sort((a, b) => a.token - b.token);
    const currentEntry = entries.find((e) => e.status === "current");
    if (currentEntry) {
      await update(ref(db, `queue/${currentEntry.id}`), { status: "done" });
    }
    const nextEntry = entries.find((e) => e.status === "waiting");
    if (nextEntry) {
      await update(ref(db, `queue/${nextEntry.id}`), { status: "current" });
      playBell();
    }
  };

  const resetQueue = async () => {
    if (!window.confirm("Reset entire queue? This cannot be undone.")) return;
    const queueRef = ref(db, "queue");
    await remove(queueRef);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">MediCare Clinic — Staff Only</p>
          </div>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 transition"
          />
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-xl shadow hover:opacity-90 transition"
          >
            Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-700 to-cyan-600 p-4 shadow">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">MediCare Clinic</h1>
            <p className="text-blue-100 text-xs">Admin Dashboard</p>
          </div>
          <button
            onClick={resetQueue}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            Reset Queue
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 text-center shadow">
            <p className="text-3xl font-black text-blue-600">{queue.length}</p>
            <p className="text-gray-500 text-xs mt-1">Waiting</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow">
            <p className="text-3xl font-black text-green-500">{current ? 1 : 0}</p>
            <p className="text-gray-500 text-xs mt-1">In Room</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow">
            <p className="text-3xl font-black text-gray-400">{done.length}</p>
            <p className="text-gray-500 text-xs mt-1">Done</p>
          </div>
        </div>

        {/* Share Link Card */}
        <div className="bg-white rounded-3xl shadow p-6 text-center">
          <h2 className="font-bold text-gray-700 mb-1 text-lg">📱 Patient Link</h2>
          <p className="text-gray-400 text-sm mb-4">Share this link so patients can join the queue</p>
          <div className="bg-blue-50 rounded-2xl p-4 border-2 border-dashed border-blue-200">
            <p className="text-blue-600 font-bold text-lg break-all">{APP_URL}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(APP_URL)}
            className="mt-3 bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-600 transition"
          >
            Copy Link
          </button>
        </div>

        {/* Current Patient */}
        <div className="bg-white rounded-3xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-400 rounded-full inline-block animate-pulse"></span>
            Now Serving
          </h2>
          {current ? (
            <div className="flex items-center gap-4 bg-green-50 rounded-2xl p-4">
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-xl">
                {current.token}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{current.name}</p>
                <p className="text-green-600 text-sm">Currently with doctor</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No patient in room</p>
          )}
          <button
            onClick={callNext}
            disabled={queue.length === 0}
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold py-4 rounded-2xl text-lg shadow hover:opacity-90 transition disabled:opacity-40"
          >
            ➡️ Call Next Patient
          </button>
        </div>

        {/* Waiting Queue */}
        <div className="bg-white rounded-3xl shadow p-6">
          <h2 className="font-bold text-gray-700 mb-4">👥 Waiting Queue</h2>
          {queue.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No patients waiting</p>
          ) : (
            <div className="space-y-3">
              {queue.map((person, index) => (
                <div key={person.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black">
                    {person.token}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{person.name}</p>
                    <p className="text-gray-400 text-xs">Position {index + 1} in queue</p>
                  </div>
                  {index === 0 && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Next</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Done */}
        {done.length > 0 && (
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="font-bold text-gray-700 mb-4">✅ Completed</h2>
            <div className="space-y-2">
              {done.map((person) => (
                <div key={person.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 opacity-60">
                  <div className="w-10 h-10 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center font-black">
                    {person.token}
                  </div>
                  <p className="font-semibold text-gray-600">{person.name}</p>
                  <span className="ml-auto text-xs bg-gray-300 text-gray-600 px-2 py-1 rounded-full">Done</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}