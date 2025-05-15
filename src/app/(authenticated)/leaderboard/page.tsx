"use client";
import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket } from "lucide-react";
import { getMostRecentThursdayWeek } from '@/lib/utils/date';

// Types
interface LeaderboardEntry {
  id: string;
  name: string;
  streak?: number; 
  isCurrentUser?: boolean;
  time?: number; // Add this to match potential API response properties
}

type LeaderboardType = "streaks" | "fastest";

const mockLeaderboard: Record<LeaderboardType, LeaderboardEntry[]> = {
  streaks: [
    { id: "1", name: "SunnyLion", streak: 21 },
    { id: "2", name: "BraveTiger", streak: 19 },
    { id: "3", name: "WiseOwl", streak: 18 },
    { id: "4", name: "MightyBear", streak: 15 },
    // ...more users
    // { id: "5", name: "CleverFox", streak: 14, isCurrentUser: true }, // Uncomment to test user in list
  ],
  fastest: [
    { id: "2", name: "BraveTiger" },
    { id: "1", name: "SunnyLion" },
    { id: "3", name: "WiseOwl" },
    { id: "4", name: "MightyBear" },
    // ...more users
    // { id: "5", name: "CleverFox", isCurrentUser: true }, // Uncomment to test user in list
  ],
};

// Simulate current user stats if not in the list
const currentUser: LeaderboardEntry = {
  id: "5",
  name: "CleverFox",
  streak: 14,
  isCurrentUser: true,
};

const TABS = [
  { key: "streaks" as LeaderboardType, label: "Longest Streaks" },
  { key: "fastest" as LeaderboardType, label: "Fastest Submissions" },
];


function getAvatarUrl(name: string) {
  // Use DiceBear bottts style for playful avatars
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
}

const inspireMessages = [
  "Keep going! Your streak could be next!",
  "You're on your way to the top!",
  "Every day is a new chance to climb the board!",
  "Consistency is key. You got this!",
  "Champions started just like you!",
];

function getInspireMessage() {
  return inspireMessages[Math.floor(Math.random() * inspireMessages.length)];
}

const now = new Date();
const currentYear = now.getFullYear();
const currentWeek = getMostRecentThursdayWeek();

export default function LeaderboardPage() {
  const [tab, setTab] = useState<LeaderboardType>("streaks");
  const [data, setData] = useState<LeaderboardEntry[]>(mockLeaderboard[tab]);
  const [inspire, setInspire] = useState(getInspireMessage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        let url = "/api/leaderboard";
        if (tab === "fastest") url += "?type=fastest";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const json = await res.json();
        if (!ignore && json.leaderboard) {
          setData(
            (json.leaderboard as LeaderboardEntry[]).map((entry) =>
              tab === "streaks"
                ? { ...entry, streak: entry.streak }
                : { ...entry }
            )
          );
        }
      } catch {
        setError("Could not load leaderboard. Showing mock data.");
        setData(mockLeaderboard[tab]);
      } finally {
        setLoading(false);
      }
      setInspire(getInspireMessage());
    }
    fetchLeaderboard();
    return () => {
      ignore = true;
    };
  }, [tab]);

  // Check if current user is in the list
  const userInList = data.some((u) => u.isCurrentUser);

  // Filter out users with 0 streaks for the streaks tab
  const filteredData = tab === "streaks"
    ? data.filter(user => (user.streak ?? 0) > 0)
    : data;

  return (
    <>
      <h1 className="text-3xl font-extrabold mb-6 text-blue-700 drop-shadow text-center w-full">Leaderboard</h1>
      <div className="flex gap-4 mb-8 justify-center">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={clsx(
              "px-6 py-2 rounded-full font-semibold transition",
              tab === t.key
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-white text-blue-700 border border-blue-300 hover:bg-blue-50"
            )}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center w-full">
        {tab === "fastest" && (
          <div className="text-base font-bold text-blue-700 mb-4 text-center">
            Fastest Submissions for <span className="text-yellow-500">Week {currentWeek}, {currentYear}</span>
          </div>
        )}
        <section className="w-full max-w-xl bg-gradient-to-br from-blue-50 to-yellow-50 rounded-2xl shadow-2xl p-6 mx-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-4">
              <span className="inline-block w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-2"></span>
            </div>
          )}
          {error && <div className="text-yellow-600 text-center py-2">{error}</div>}
          {tab === "fastest" && data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <span className="mb-4 animate-bounce">
                <Rocket className="w-14 h-14 text-yellow-400 drop-shadow-lg" />
              </span>
              <div className="text-2xl font-extrabold text-blue-700 mb-2 text-center">
                No submissions yet for <span className="text-yellow-500">Week {currentWeek}, {currentYear}</span>
              </div>
              <div className="text-blue-500 text-lg font-semibold mb-2 text-center">
                Be the first to submit and claim the <span className="text-yellow-500">#1</span> spot!
              </div>
              <div className="text-yellow-600 text-sm italic text-center mt-2">
                Early birds get the glory. Your streak could start here!
              </div>
            </motion.div>
          ) : (
            <ol className="space-y-4">
              <AnimatePresence>
                {filteredData.map((user: LeaderboardEntry, idx: number) => (
                  <motion.li
                    key={user.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.4, delay: idx * 0.07 }}
                    className={clsx(
                      "flex items-center gap-4 p-3 rounded-xl transition-all bg-white/90",
                      idx === 0 && "border-4 border-yellow-400",
                      idx === 1 && "border-4 border-gray-400",
                      idx === 2 && "border-4 border-orange-400",
                      idx < 3 && "font-bold text-lg"
                    )}
                  >
                    <span className="w-8 text-center flex justify-center items-center">
                      {idx < 3 ? (
                        <span
                          className="inline-block w-7 h-7 rounded-full flex items-center justify-center"
                          style={{
                            background:
                              idx === 0
                                ? "#FFD700"
                                : idx === 1
                                ? "#C0C0C0"
                                : "#CD7F32",
                            color: "#fff",
                          }}
                          title={idx === 0 ? "Gold" : idx === 1 ? "Silver" : "Bronze"}
                        >
                          <span className="font-bold text-lg">{idx + 1}</span>
                        </span>
                      ) : (
                        <span className="text-blue-400 font-bold">{idx + 1}</span>
                      )}
                    </span>
                    <span className="w-10 h-10 rounded-full border-2 border-blue-300 bg-white flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAvatarUrl(user.name)}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                        loading={idx < 3 ? "eager" : "lazy"}
                      />
                    </span>
                    <span className="flex-1 truncate font-semibold text-blue-800">
                      {user.name}
                      {user.isCurrentUser && (
                        <motion.span
                          className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 rounded-full text-yellow-800 font-bold"
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                          You
                        </motion.span>
                      )}
                    </span>
                    <span className="text-xl font-mono text-blue-700">
                      {tab === "streaks"
                        ? `${user.streak ?? 0} ${user.streak === 1 ? "week" : "weeks"} 🔥`
                        : `#${idx + 1}`}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </section>
        {tab === "fastest" && (
          <div className="text-xs text-blue-400 text-center mt-2">
            {/* No time info needed for fastest submissions */}
          </div>
        )}
        {!userInList && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="relative z-10 w-full max-w-md mt-8"
          >
            <div className="bg-white/95 border-2 border-yellow-300 rounded-2xl shadow-xl p-5 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full border-2 border-blue-200 bg-white flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getAvatarUrl(currentUser.name)}
                  alt={currentUser.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                  loading="lazy"
                />
              </span>
              <div className="flex-1">
                <div className="font-bold text-blue-700 text-lg">{currentUser.name} <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 rounded-full text-yellow-800 font-bold">You</span></div>
                <div className="text-blue-500 text-sm mt-1">
                  {tab === "streaks"
                    ? `${currentUser.streak ?? 0} weeks 🔥`
                    : `Fastest submission`}
                </div>
                <div className="text-yellow-600 text-xs mt-2 italic">{inspire}</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      {tab === "streaks" && (
        <p className="mt-6 text-blue-500 text-xs text-center max-w-xl mx-auto">
          <strong>Tip:</strong> If multiple users have the same streak, the leaderboard ranks them by who submitted earliest this week. If no one submitted this week, it uses last week&rsquo;s submission time. If there is still a tie, names are sorted alphabetically.
        </p>
      )}
      <p className="mt-8 text-blue-400 text-sm text-center">* Avatars are generated and email addresses are anonymized for privacy.</p>
    </>
  );
} 