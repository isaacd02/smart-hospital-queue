import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function UserPage() {
  const { token } = useParams();
  const [myData, setMyData] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [notified, setNotified] = useState(false);
  const bellRef = useRef(null);

  const playBell = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // First bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain1.gain.setValueAtTime(1, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.8);
      // Second bell
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.9);
      osc2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.4);
      gain2.gain.setValueAtTime(1, ctx.currentTime + 0.9);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.7);
      osc2.start(ctx.currentTime + 0.9);
      osc2.stop(ctx.currentTime + 1.7);
    } catch (e) {
      console.log("Audio error", e);
    }
  };

  useEffect(() => {
    const queueRef = ref(db, "queue");
    const unsub = onValue(queueRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();
      const entries = Object.values(data).sort((a, b) => a.token - b.token);

      const me = entries.find((e) => e.token === parseInt(token));
      const waiting = entries.filter((e) => e.status === "waiting");
      const current = entries.find((e) => e.status === "current");

      setMyData(me);
      setQueue(waiting);
      setCurrentToken(current ? current.token : null);

      if (current && current.token === parseInt(token) && !notified) {
        setNotified(true);
        playBell();
        if (bellRef.current) {
          bellRef.current.classList.add("animate-bounce");
          setTimeout(() => {
            if (bellRef.current) bellRef.current.classList.remove("animate-bounce");
          }, 3000);
        }
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("MediCare Clinic 🏥", {
            body: "It's your turn! Please proceed to the doctor.",
            icon: "/vite.svg",
          });
        }
      }
    });
    return () => unsub();
  }, [token, notified]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const myToken = parseInt(token);
  const peopleAhead = queue.filter((e) => e.token < myToken).length;
  const estimatedMinutes = peopleAhead * 10;
  const isMyTurn = currentToken === myToken;
  const isDone = myData?.status === "done";

  if (!myData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-cyan-700 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your token...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 p-4">
      {/* Header */}
      <div className="text-center pt-6 pb-4">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-lg mb-3">
          <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">MediCare Clinic</h1>
        <p className="text-blue-200 text-sm">Smart Queue System</p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        {/* My Turn Alert */}
        {isMyTurn && (
          <div className="bg-green-400 rounded-3xl p-6 text-center shadow-2xl animate-pulse">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-white">It's Your Turn!</h2>
            <p className="text-green-100 mt-1">Please proceed to the doctor's room</p>
          </div>
        )}

        {isDone && (
          <div className="bg-gray-500 rounded-3xl p-6 text-center shadow-2xl">
            <div className="text-5xl mb-2">✅</div>
            <h2 className="text-2xl font-bold text-white">Visit Complete</h2>
            <p className="text-gray-200 mt-1">Thank you for visiting MediCare Clinic</p>
            <button
              onClick={() => window.location.href = "/"}
              className="mt-4 bg-white text-gray-700 font-bold px-6 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              Join Again →
            </button>
          </div>
        )}

        {/* Token Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-center">
            <p className="text-blue-100 text-sm font-semibold uppercase tracking-widest">Your Token</p>
            <div className="text-8xl font-black text-white my-2">{myToken}</div>
            <p className="text-blue-100 font-medium">{myData.name}</p>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-2xl p-4 text-center">
              <div ref={bellRef} className="text-3xl mb-1">🔔</div>
              <p className="text-2xl font-black text-blue-700">{peopleAhead}</p>
              <p className="text-gray-500 text-xs font-medium">People Ahead</p>
            </div>
            <div className="bg-cyan-50 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-1">⏱️</div>
              <p className="text-2xl font-black text-cyan-700">~{estimatedMinutes}m</p>
              <p className="text-gray-500 text-xs font-medium">Est. Wait Time</p>
            </div>
          </div>
        </div>

        {/* Now Serving */}
        <div className="bg-white bg-opacity-10 backdrop-blur rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">Now Serving</p>
              <p className="text-white text-4xl font-black mt-1">{currentToken ?? "—"}</p>
            </div>
            <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Queue List */}
        <div className="bg-white rounded-3xl shadow-2xl p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>👥</span> People in Queue
          </h3>
          {queue.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No one waiting</p>
          ) : (
            <div className="space-y-3">
              {queue.map((person) => (
                <div
                  key={person.token}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition ${
                    person.token === myToken
                      ? "bg-blue-100 border-2 border-blue-400"
                      : "bg-gray-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                    person.token === myToken ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {person.token}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${person.token === myToken ? "text-blue-700" : "text-gray-700"}`}>
                      {person.name} {person.token === myToken && "(You)"}
                    </p>
                  </div>
                  {person.token === myToken && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">You</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs pb-6">
          Keep this page open — you'll be notified when it's your turn 🔔
        </p>
      </div>
    </div>
  );
}