
"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { downloadAchievementImage, shareAchievementCard } from "@/lib/image-export";

interface AchievementCardProps {
  player: { name: string; tag: string; avatar: string; };
  team: { name: string; logo: string; };
  tournament: { name: string; date: string; };
  rank: number;
  rarity: "elite" | "master" | "mythic" | "supreme";
  isStatic?: boolean;
}

const TrophyIcon = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80">
    <path d="M8 3h8v2a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V3z" fill="currentColor" />
    <path d="M4 8a2 2 0 0 1 2-2v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V6a2 2 0 0 1 2 2v1a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V8z" fill="currentColor" />
  </svg>
);

const rarityStyles = {
  elite: { label: "ELITE CHAMPION", glow: "from-indigo-500/20 to-transparent", border: "border-indigo-400/60", text: "text-indigo-400" },
  master: { label: "MASTER PLAYER", glow: "from-cyan-500/25 to-transparent", border: "border-cyan-400/60", text: "text-cyan-400" },
  mythic: { label: "MYTHIC WARRIOR", glow: "from-pink-500/25 to-transparent", border: "border-pink-400/60", text: "text-pink-400" },
  supreme: { label: "SUPREME LEGEND", glow: "from-purple-500/25 to-transparent", border: "border-purple-400/60", text: "text-purple-400" },
};

export const AchievementCard = React.forwardRef<HTMLDivElement, AchievementCardProps>(
  ({ player, team, tournament, rank, rarity, isStatic = false }, ref) => {
    const internalCardRef = useRef<HTMLDivElement>(null);
    // Use the forwarded ref if provided, otherwise use the internal ref
    const cardRef = (ref || internalCardRef) as React.RefObject<HTMLDivElement>;

    const styles = rarityStyles[rarity] || rarityStyles.elite;
    
    const handleDownload = () => {
        const fileName = `${player.name.replace(/\s+/g, "_")}_${tournament.name.replace(/\s+/g, "_")}_achievement.png`;
        downloadAchievementImage(cardRef, fileName);
    };

    const handleShare = () => {
        shareAchievementCard(cardRef, {
            title: "Apna Esport Achievement",
            text: `${player.name} just conquered ${tournament.name} in Apna Esport!🔥\n#ApnaEsport #GamingChampion`,
            fileName: "apna-esport-achievement.png",
        });
    };

    return (
      <motion.div
        initial={{ scale: isStatic ? 1 : 0.9, opacity: isStatic ? 1 : 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative max-w-[900px] w-full"
      >
        <div className={cn("absolute -inset-3 blur-3xl opacity-30 bg-gradient-to-r pointer-events-none", styles.glow)} />

        <div
          ref={cardRef}
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]",
            styles.border
          )}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <ImageWithFallback 
                src={player.avatar || ''} 
                fallbackSrc={`https://placehold.co/80x80.png?text=${player.name.substring(0, 2)}`}
                alt={player.name} 
                width={80} 
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-white/10" 
                unoptimized
              />
              <div>
                <div className="text-xl sm:text-3xl font-extrabold text-white">{player.name}</div>
                <div className="text-xs sm:text-sm text-gray-400">{player.tag}</div>
                <div className="text-xs text-gray-500 mt-1">{tournament.date}</div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className={cn("text-xs uppercase font-bold tracking-widest", styles.text)}>{styles.label}</div>
              <div className="text-3xl font-black text-white">#{rank}</div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                {tournament.name}
              </h1>
              <p className="mt-2 text-gray-300 max-w-md">
                Outstanding performance and fearless gameplay. You made history in Apna Esport.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <ImageWithFallback 
                  src={team.logo || ''} 
                  fallbackSrc={`https://placehold.co/40x40.png?text=${team.name.substring(0, 2)}`}
                  alt={team.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border border-white/10"
                  unoptimized
                />
                <div>
                  <div className="text-sm text-white font-semibold">{team.name}</div>
                  <div className="text-xs text-gray-400">Official Esport Team</div>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ rotate: isStatic ? 0 : [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6 }}
              className="relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center shrink-0"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 blur-xl animate-pulse" />
              <div className="relative flex items-center justify-center w-32 h-32 md:w-36 md:h-36 rounded-full border border-white/10 bg-black/60">
                <TrophyIcon />
              </div>
            </motion.div>
          </div>

          {!isStatic && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                    <span>Badge ID:</span>
                    <span className="text-white/80">AP-{Date.now().toString().slice(-6)}</span>
                </div>

                <div className="flex gap-3">
                <button onClick={handleShare} className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:scale-105 transition">
                    Share
                </button>
                <button onClick={handleDownload} className="px-4 py-2 rounded-lg border border-white/10 text-white/90 hover:bg-white/5 transition">
                    Download
                </button>
                </div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 text-[10px] text-gray-500">© Apna Esport</div>
        </div>
      </motion.div>
    );
  }
);

AchievementCard.displayName = "AchievementCard";
