
"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { downloadAchievementImage, shareAchievementCard } from "@/lib/image-export";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Button } from "@/components/ui/button";

interface AchievementCardProps {
  player: { name: string; tag: string; avatar: string; };
  tournament: { name: string; date: string; };
  rank: number;
  rarity: "elite" | "master" | "mythic" | "supreme";
  isStatic?: boolean;
}

const rarityStyles = {
  elite: { label: "ELITE CHAMPION", text: "text-indigo-400" },
  master: { label: "MASTER PLAYER", text: "text-cyan-400" },
  mythic: { label: "MYTHIC WARRIOR", text: "text-pink-400" },
  supreme: { label: "SUPREME LEGEND", text: "text-purple-400" },
};

export const AchievementCard = React.forwardRef<HTMLDivElement, AchievementCardProps>(
  ({ player, tournament, rank, rarity, isStatic = false }, ref) => {
    const internalCardRef = useRef<HTMLDivElement>(null);
    const cardRef = (ref || internalCardRef) as React.RefObject<HTMLDivElement>;
    const { settings } = useSiteSettings();

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
        className="w-full max-w-lg mx-auto"
      >
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#10141F] via-[#0D1018] to-[#0A0D14] p-6 shadow-2xl shadow-black/50"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
             <ImageWithFallback 
                src={player.avatar || ''} 
                fallbackSrc={`https://placehold.co/80x80.png?text=${player.name.substring(0, 2)}`}
                alt={player.name} 
                width={64} 
                height={64}
                className="w-16 h-16 rounded-lg object-cover border-2 border-white/10" 
                unoptimized
              />
            <div>
              <div className="text-2xl font-bold text-white line-clamp-1">{player.name}</div>
              <div className="text-sm text-gray-400">{player.tag}</div>
              <div className="text-xs text-gray-500 mt-0.5">{tournament.date}</div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="my-6">
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 line-clamp-2">
                {tournament.name}
              </h1>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
               <div className="h-2 w-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 opacity-75" />
                <p className="text-gray-300 text-sm leading-relaxed max-w-md">
                    Outstanding performance and fearless gameplay. You made history in Apna Esport.
                </p>
            </div>
            <div className="text-right shrink-0">
              <div className={cn("text-xs uppercase font-bold tracking-widest", styles.text)}>{styles.label}</div>
              <div className="text-5xl font-black text-white">#{rank}</div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2 text-gray-400 text-xs">
                <ImageWithFallback src={settings?.achievementCardLogoUrl || ""} fallbackSrc="/logo.svg" alt="Apna Esport Logo" width={24} height={24} />
                <span>© Apna Esport</span>
            </div>
             <div className="text-xs text-gray-500">
                Badge ID: AP-{Date.now().toString().slice(-6)}
             </div>
          </div>

           {!isStatic && (
                <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Button onClick={handleShare} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:scale-105 transition shadow-lg">
                        Share
                    </Button>
                    <Button onClick={handleDownload} variant="outline" className="w-full sm:w-auto px-6 py-3 border-white/20 text-white/90 hover:bg-white/10 transition">
                        Download
                    </Button>
                </div>
           )}

        </div>
      </motion.div>
    );
  }
);

AchievementCard.displayName = "AchievementCard";

