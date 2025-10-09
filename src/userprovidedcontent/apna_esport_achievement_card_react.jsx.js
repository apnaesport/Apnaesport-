import React, { useRef } from "react";
import { motion } from "framer-motion";
// Install: npm install framer-motion html2canvas

export default function AchievementCard({
  player = {
    name: "Praj",
    tag: "@praj_gamer",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  team = { name: "Apna Esport", logo: "https://i.pravatar.cc/80?img=5" },
  tournament = { name: "Thunder Cup", date: "Oct 09, 2025" },
  rank = 1,
  rarity = "elite", // elite | mythic | master | supreme
}) {
  const cardRef = useRef();

  const rarityStyles = {
    elite: {
      label: "ELITE CHAMPION",
      ring: "ring-indigo-500/40",
      glow: "from-indigo-500/20 to-transparent",
      border: "border-indigo-400/60",
    },
    master: {
      label: "MASTER PLAYER",
      ring: "ring-cyan-500/40",
      glow: "from-cyan-500/25 to-transparent",
      border: "border-cyan-400/60",
    },
    mythic: {
      label: "MYTHIC WARRIOR",
      ring: "ring-pink-500/50",
      glow: "from-pink-500/25 to-transparent",
      border: "border-pink-400/60",
    },
    supreme: {
      label: "SUPREME LEGEND",
      ring: "ring-purple-500/50",
      glow: "from-purple-500/25 to-transparent",
      border: "border-purple-400/60",
    },
  };

  const styles = rarityStyles[rarity] || rarityStyles.elite;

  async function downloadImage() {
    const html2canvas = (await import("html2canvas")).default;
    const node = cardRef.current;
    if (!node) return;
    const canvas = await html2canvas(node, { useCORS: true, scale: 2 });
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${player.name.replace(/\s+/g, "_")}_${tournament.name.replace(/\s+/g, "_")}_achievement.png`;
    a.click();
  }

  async function shareCard() {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, { useCORS: true, scale: 2 });
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const file = new File([blob], "apna-achievement.png", { type: "image/png" });

      const shareText = `${player.name} just conquered ${tournament.name} in Apna Esport!🔥\n#ApnaEsport #GamingChampion`;

      if (navigator.share) {
        await navigator.share({ files: [file], title: "Apna Esport Achievement", text: shareText });
      } else {
        downloadImage();
      }
    } catch (e) {
      console.error(e);
      downloadImage();
    }
  }

  const TrophyIcon = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3h8v2a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V3z" fill="currentColor" />
      <path d="M4 8a2 2 0 0 1 2-2v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V6a2 2 0 0 1 2 2v1a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V8z" fill="currentColor" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative max-w-[900px] w-full"
      >
        {/* outer aura */}
        <div className={`absolute -inset-3 blur-3xl opacity-30 bg-gradient-to-r ${styles.glow} pointer-events-none`} />

        <div
          ref={cardRef}
          className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]`}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <img src={player.avatar} className="w-20 h-20 rounded-xl object-cover border-2 border-white/10" alt="player" />
              <div>
                <div className="text-3xl font-extrabold text-white">{player.name}</div>
                <div className="text-sm text-gray-400">{player.tag}</div>
                <div className="text-xs text-gray-500 mt-1">{tournament.date}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase text-indigo-400 font-bold tracking-widest">{styles.label}</div>
              <div className="text-3xl font-black text-white">#{rank}</div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                {tournament.name}
              </h1>
              <p className="mt-2 text-gray-300 max-w-md">
                Outstanding performance and fearless gameplay. You made history in Apna Esport.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <img src={team.logo} alt="team" className="w-10 h-10 rounded-full border border-white/10" />
                <div>
                  <div className="text-sm text-white font-semibold">{team.name}</div>
                  <div className="text-xs text-gray-400">Official Esport Team</div>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6 }}
              className="relative w-48 h-48 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 blur-xl animate-pulse" />
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full border border-white/10 bg-black/60">
                <TrophyIcon />
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <span>Badge ID:</span>
              <span className="text-white/80">AP-{Date.now().toString().slice(-6)}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={shareCard} className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:scale-105 transition">
                Share
              </button>
              <button onClick={downloadImage} className="px-4 py-2 rounded-lg border border-white/10 text-white/90 hover:bg-white/5 transition">
                Download
              </button>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 text-[10px] text-gray-500">© Apna Esport</div>
        </div>
      </motion.div>
    </div>
  );
}
