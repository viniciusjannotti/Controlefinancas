"use client";

import React, { useState } from "react";
import { useGame } from "@/lib/game/GameContext";
import { xpForNextLevel, XP_CATALOG, ACHIEVEMENTS_CATALOG, DAILY_MISSIONS_TEMPLATE } from "@/lib/game/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Flame, Star, Trophy, Zap, Sprout, BookOpen, X,
  CheckCircle2, Circle, Crown, Target, Sparkles,
  TrendingUp, Calendar, ChevronRight, Info,
} from "lucide-react";

// ─── XP Progress Bar ──────────────────────────────────────────────────────────
function XPBar({ xp, level }: { xp: number; level: number }) {
  const needed = xpForNextLevel(level);
  let remaining = xp;
  for (let l = 1; l < level; l++) remaining -= xpForNextLevel(l);
  const pct = Math.min(100, (remaining / needed) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-semibold text-slate-500">
        <span>{remaining} XP</span>
        <span>{needed} XP para nível {level + 1}</span>
      </div>
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600 transition-all duration-700 relative overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl p-4 shadow-sm transition-transform hover:scale-105", color)}>
      <Icon className="w-6 h-6 shrink-0" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-2xl font-black leading-none">{value}</p>
      </div>
    </div>
  );
}

// ─── Plant Visual ─────────────────────────────────────────────────────────────
function PlantStage({ level }: { level: number }) {
  const [period, setPeriod] = React.useState<'dawn' | 'day' | 'sunset' | 'night'>('day');

  React.useEffect(() => {
    const updatePeriod = () => {
      const h = new Date().getHours();
      if (h >= 5 && h < 8) setPeriod('dawn');
      else if (h >= 8 && h < 17) setPeriod('day');
      else if (h >= 17 && h < 19) setPeriod('sunset');
      else setPeriod('night');
    };
    updatePeriod();
    const interval = setInterval(updatePeriod, 1000 * 60); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const themes = {
    dawn: {
      sky: "bg-gradient-to-b from-[#FBC2EB] via-[#A6C1EE] to-[#FFD1FF]/40",
      glow: "bg-pink-200/30",
      sun: "bg-yellow-100/50",
      mountain1: "text-indigo-900/20",
      mountain2: "text-indigo-800/10",
      particles: "bg-pink-200/40",
      badge: "bg-pink-900/40",
      plantFilter: "brightness(0.8) saturate(1.2) sepia(0.2)"
    },
    day: {
      sky: "bg-gradient-to-b from-[#4FACFE] via-[#00F2FE] to-[#E0C3FC]/30",
      glow: "bg-sky-200/30",
      sun: "bg-yellow-100/80 shadow-[0_0_100px_rgba(255,235,59,0.3)]",
      mountain1: "text-slate-700/20",
      mountain2: "text-slate-600/10",
      particles: "bg-sky-100/40",
      badge: "bg-sky-900/40",
      plantFilter: "brightness(1) contrast(1.1)"
    },
    sunset: {
      sky: "bg-gradient-to-b from-[#0F172A] via-[#EA580C] to-[#FDE047]",
      glow: "bg-amber-200/40",
      sun: "bg-amber-100/60 shadow-[0_0_80px_rgba(251,191,36,0.4)]",
      mountain1: "text-slate-900/60",
      mountain2: "text-slate-800/40",
      particles: "bg-emerald-300/40",
      badge: "bg-slate-950/60",
      plantFilter: "brightness(0.9) contrast(1.2) saturate(1.4) sepia(0.4) hue-rotate(-10deg)"
    },
    night: {
      sky: "bg-gradient-to-b from-[#020617] via-[#1E1B4B] to-[#312E81]",
      glow: "bg-indigo-400/20",
      sun: "bg-white/90 shadow-[0_0_60px_rgba(255,255,255,0.5)]", // Moon
      mountain1: "text-black/60",
      mountain2: "text-black/40",
      particles: "bg-indigo-200/30",
      badge: "bg-indigo-950/60",
      plantFilter: "brightness(0.3) contrast(1.4) saturate(0.5) hue-rotate(210deg)"
    }
  };

  const t = themes[period];
  const stages = [
    { emoji: "🌱", label: "Semente" },
    { emoji: "🌿", label: "Broto" },
    { emoji: "🌳", label: "Árvore jovem" },
    { emoji: "🌲", label: "Árvore forte" },
    { emoji: "🌴", label: "Floresta" },
  ];
  const stage = stages[Math.min(level - 1, stages.length - 1)];

  return (
    <div className="relative w-full h-[460px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 bg-slate-950 group">
      {/* 1. Dynamic Atmosphere */}
      <div className={cn("absolute inset-0 transition-colors duration-[3000ms] ease-in-out", t.sky)} />

      {/* 2. Night Stars (Only visible at night) */}
      {period === 'night' && (
        <div className="absolute inset-0 z-0">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 2 + 'px',
                height: Math.random() * 2 + 'px',
                top: Math.random() * 60 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 5 + 's',
                opacity: Math.random() * 0.7 + 0.3
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Celestial Body Glow */}
      <div className={cn("absolute top-10 left-1/3 w-64 h-64 rounded-full blur-[100px] animate-pulse transition-all duration-[3000ms]", t.glow)} />
      <div className={cn("absolute top-12 left-1/3 w-16 h-16 rounded-full transition-all duration-[3000ms] overflow-hidden flex items-center justify-center", t.sun)}>
        {period === 'night' && <div className="absolute -top-2 -left-2 w-16 h-16 bg-black/10 rounded-full" />}
      </div>

      {/* 4. Smooth Curvy Mountains */}
      <svg className={cn("absolute bottom-36 left-0 w-full h-48 transition-colors duration-[3000ms]", t.mountain1)} viewBox="0 0 1000 100" preserveAspectRatio="none">
        <path d="M0,100 Q150,10 300,80 T600,40 T1000,90 L1000,100 L0,100 Z" fill="currentColor" />
      </svg>
      <svg className={cn("absolute bottom-28 left-0 w-full h-40 transition-colors duration-[3000ms]", t.mountain2)} viewBox="0 0 1000 100" preserveAspectRatio="none">
        <path d="M0,100 Q200,30 400,90 T800,50 T1000,80 L1000,100 L0,100 Z" fill="currentColor" />
      </svg>

      {/* 5. GROUND - Integrated Layers */}
      <div className="absolute bottom-0 left-0 w-full h-40 z-20">
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#0A0705] to-[#1F140D] shadow-[inset_0_10px_20px_rgba(0,0,0,0.7)]" />
        <div className={cn("absolute bottom-32 w-full h-8 bg-gradient-to-t from-[#1F140D] to-[#2D1E14] transition-all duration-[3000ms]", period === 'night' ? 'opacity-30' : 'opacity-100')} />

        {/* THE PLANT (BRING TO FRONT) */}
        <div
          className="absolute bottom-[4.5rem] right-[55%] translate-x-1/2 z-30 transition-transform duration-500 hover:scale-110 active:scale-95"
          style={{ transform: `translateX(50%) rotate(-12deg)` }}
        >
          <div className="relative">
            {/* The Emoji with Ambient Filter and Sway */}
            <div
              className="text-7xl sm:text-8xl select-none animate-sway origin-bottom drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)] transition-all duration-[3000ms]"
              style={{ filter: t.plantFilter }}
            >
              {stage.emoji}
            </div>
            {/* Contact shadow right at the base */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-black/80 rounded-[100%] blur-[6px]" />
          </div>
        </div>

        {/* Foreground Mound (NOW BEHIND THE PLANT) */}
        <div className="absolute bottom-0 w-full h-24 z-20 pointer-events-none">
          {/* Visual anchor for the plant base */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-44 h-10 bg-[#0A0705] rounded-[100%] blur-[1.5px] shadow-2xl" />
          <div className="absolute bottom-13 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1F140D] rounded-[100%] opacity-90 shadow-inner" />

          {/* Simple dirt detail, no more green roots/grass */}
          <div className="absolute bottom-14 left-[46%] w-3 h-2 bg-[#1F140D] rounded-full rotate-45" />
          <div className="absolute bottom-15 left-[52%] w-4 h-2 bg-[#2D1E14] rounded-full -rotate-12" />
        </div>
      </div>

      {/* 6. Dynamic Weather Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className={cn("absolute rounded-full animate-float-wind transition-colors duration-[3000ms]", t.particles)}
            style={{
              width: `${Math.random() * 5 + 3}px`,
              height: `${Math.random() * 5 + 3}px`,
              top: `${Math.random() * 80}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${Math.random() * 6 + 7}s`,
              boxShadow: period === 'sunset' ? '0 0 12px rgba(110, 231, 183, 0.4)' : 'none'
            }}
          />
        ))}
      </div>

      {/* 7. UI Overlay (Dynamic Text) */}
      <div className="absolute top-8 right-8 z-40 text-right flex flex-col items-end gap-2">
        <p className="text-white font-black text-4xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] tracking-tighter uppercase transition-all">{stage.label}</p>
        <div className={cn("inline-flex items-center gap-2 backdrop-blur-2xl px-5 py-2 rounded-2xl border border-white/10 shadow-2xl transition-all duration-[3000ms]", t.badge)}>
          <Sparkles className={cn("w-4 h-4 animate-pulse", period === 'night' ? 'text-indigo-400' : 'text-amber-400')} />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] drop-shadow-md">
            MUNDO VIVO — NÍVEL {level}
          </span>
        </div>
      </div>
    </div>
  );
}


// ─── Category color helpers ───────────────────────────────────────────────────
function achievementCategoryBadge(cat: string) {
  const map: Record<string, string> = {
    habito: "bg-blue-100 text-blue-700",
    financas: "bg-emerald-100 text-emerald-700",
    investimento: "bg-violet-100 text-violet-700",
    consistencia: "bg-amber-100 text-amber-700",
    especial: "bg-rose-100 text-rose-700",
  };
  const labels: Record<string, string> = {
    habito: "Hábito",
    financas: "Finanças",
    investimento: "Investimento",
    consistencia: "Consistência",
    especial: "Especial",
  };
  return { color: map[cat] ?? "bg-slate-100 text-slate-600", label: labels[cat] ?? cat };
}

// ─── Legend Modal ─────────────────────────────────────────────────────────────
function LegendModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"tasks" | "missions" | "achievements">("tasks");

  const tasks = Object.entries(XP_CATALOG).filter(([, v]) => v.category === "tarefa");
  const quests = Object.entries(XP_CATALOG).filter(([, v]) => v.category === "quest");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

        {/* Header gradient */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black">Legenda do Jogo</h2>
                <p className="text-emerald-100 text-sm">Tarefas, missões e conquistas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-5">
            {([
              { key: "tasks", label: "⚡ Tarefas", icon: Zap },
              { key: "missions", label: "🎯 Missões", icon: Target },
              { key: "achievements", label: "🏆 Conquistas", icon: Trophy },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-bold transition-all",
                  tab === key
                    ? "bg-white text-emerald-700 shadow-md"
                    : "text-emerald-100 hover:bg-white/20"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* ── Tasks tab ── */}
          {tab === "tasks" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Ações financeiras — XP automático
                </p>
                <div className="space-y-2">
                  {tasks.map(([key, rule]) => (
                    <div
                      key={key}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                    >
                      <span className="text-2xl">{rule.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 text-sm">{rule.label}</p>
                        <p className="text-xs text-slate-500">{rule.description}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-black">
                        <Zap className="w-3 h-3" />
                        +{rule.xp} XP
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>O XP é concedido automaticamente ao registrar qualquer ação financeira no sistema. Quanto mais você registra, mais sua planta cresce!</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Missions tab ── */}
          {tab === "missions" && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Missões diárias — reiniciam a meia-noite
              </p>
              {DAILY_MISSIONS_TEMPLATE.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition-all"
                >
                  <span className="text-2xl">
                    {m.id === "mission_login" ? "🌅" : m.id === "mission_record" ? "📝" : m.id === "mission_investments" ? "🔭" : "📊"}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{m.title}</p>
                    <p className="text-xs text-slate-500">{m.description}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-black">
                    <Star className="w-3 h-3" />
                    +{m.rewardXP} XP
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Missões são completadas automaticamente ao realizar a ação correspondente. O XP da missão é somado ao XP da ação!</span>
              </div>
            </div>
          )}

          {/* ── Achievements tab ── */}
          {tab === "achievements" && (
            <div className="space-y-4">
              {(["habito", "financas", "investimento", "consistencia", "especial"] as const).map((cat) => {
                const items = ACHIEVEMENTS_CATALOG.filter((a) => a.category === cat);
                const { label, color } = achievementCategoryBadge(cat);
                return (
                  <div key={cat}>
                    <div className={cn("inline-flex px-3 py-1 rounded-full text-xs font-bold mb-3", color)}>
                      {label}
                    </div>
                    <div className="space-y-2">
                      {items.map((ach) => (
                        <div
                          key={ach.id}
                          className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 transition-all"
                        >
                          <span className="text-2xl">{ach.icon}</span>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 text-sm">{ach.name}</p>
                            <p className="text-xs text-slate-500">{ach.description}</p>
                          </div>
                          <div className="shrink-0">
                            <span className="text-slate-300 text-xs font-semibold">🔒</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Achievement Card ─────────────────────────────────────────────────────────
function AchievementCard({
  achievement,
  unlocked,
}: {
  achievement: typeof ACHIEVEMENTS_CATALOG[0];
  unlocked: boolean;
}) {
  const { color } = achievementCategoryBadge(achievement.category);
  return (
    <div
      className={cn(
        "group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all hover:scale-105",
        unlocked
          ? "border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-50 shadow-md"
          : "border-dashed border-slate-200 bg-slate-50 grayscale opacity-60"
      )}
      title={achievement.description}
    >
      <span className="text-2xl">{unlocked ? achievement.icon : "🔒"}</span>
      <p className={cn("text-xs font-bold leading-tight", unlocked ? "text-slate-800" : "text-slate-400")}>
        {achievement.name}
      </p>
      {unlocked && (
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", color)}>
          Conquistado
        </span>
      )}
    </div>
  );
}

// ─── Mission Item ─────────────────────────────────────────────────────────────
function MissionItem({
  mission,
  onComplete,
}: {
  mission: ReturnType<typeof useGame>["gameData"]["missions"][0];
  onComplete: () => void;
}) {
  const icons: Record<string, string> = {
    mission_login: "🌅",
    mission_record: "📝",
    mission_investments: "🔭",
    mission_dashboard: "📊",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
        mission.isCompleted
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50"
      )}
    >
      <span className="text-xl">{icons[mission.id] ?? "⭐"}</span>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold", mission.isCompleted ? "text-emerald-700 line-through" : "text-slate-800")}>
          {mission.title}
        </p>
        <p className="text-xs text-slate-500 truncate">{mission.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          "text-xs font-black px-2 py-1 rounded-full",
          mission.isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-700"
        )}>
          +{mission.rewardXP} XP
        </span>
        {mission.isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <button
            onClick={onComplete}
            className="w-7 h-7 rounded-full border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 flex items-center justify-center transition-all"
            title="Marcar como concluída"
          >
            <Circle className="w-4 h-4 text-slate-300" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CriandoVidaPage() {
  const { gameData, loading, completeMission } = useGame();
  const [legendOpen, setLegendOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">🌱</div>
          <p className="text-slate-400 animate-pulse font-semibold">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  const dailyMissions = gameData.missions.filter((m) => m.type === "daily");
  const completedMissions = dailyMissions.filter((m) => m.isCompleted).length;
  const missionProgress = Math.round((completedMissions / dailyMissions.length) * 100) || 0;

  const unlockedIds = new Set(gameData.achievements.map((a) => a.id));

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Sprout className="w-8 h-8 text-emerald-500" />
              Criando Vida
            </h2>
            <p className="text-slate-500 text-lg">
              Transforme seus hábitos financeiros em progresso real.
            </p>
          </div>

          {/* Legend Button */}
          <button
            id="btn-legend"
            onClick={() => setLegendOpen(true)}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg hover:shadow-emerald-200 hover:scale-105 transition-all duration-200 shrink-0"
          >
            <BookOpen className="w-4 h-4 transition-transform group-hover:rotate-12" />
            Legenda
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <StatPill icon={Star} label="Nível" value={gameData.level} color="bg-amber-50 text-amber-600" />
          <StatPill icon={Zap} label="XP Total" value={gameData.xp} color="bg-blue-50 text-blue-600" />
          <StatPill icon={Flame} label="Streak" value={`${gameData.streak}d`} color="bg-rose-50 text-rose-500" />
        </div>

        {/* XP Bar */}
        <Card>
          <CardContent className="pt-6">
            <XPBar xp={gameData.xp} level={gameData.level} />
          </CardContent>
        </Card>

        {/* Main area: plant + missions */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Plant visual — main area */}
          <Card className="lg:col-span-2 bg-white/50 backdrop-blur-sm border-emerald-100 shadow-xl shadow-emerald-900/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-emerald-900">Sua Jornada</CardTitle>
                  <CardDescription className="text-emerald-700/60 font-medium">
                    Explorando a savana financeira · Nível {gameData.level}
                  </CardDescription>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <PlantStage level={gameData.level} />
            </CardContent>
          </Card>


          {/* Daily Missions */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-amber-500" />
                  Missões Diárias
                </CardTitle>
                <span className="text-xs font-bold text-slate-500">
                  {completedMissions}/{dailyMissions.length}
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                  style={{ width: `${missionProgress}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              {dailyMissions.length > 0 ? (
                dailyMissions.map((m) => (
                  <MissionItem
                    key={m.id}
                    mission={m}
                    onComplete={() => completeMission(m.id)}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Nenhuma missão disponível.</p>
              )}
              {completedMissions === dailyMissions.length && dailyMissions.length > 0 && (
                <div className="flex items-center gap-2 justify-center mt-2 bg-emerald-50 rounded-xl p-3">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600">Todas as missões concluídas! 🎉</span>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Conquistas
              </CardTitle>
              <span className="text-sm text-slate-500">
                {gameData.achievements.length} / {ACHIEVEMENTS_CATALOG.length} desbloqueadas
              </span>
            </div>
            <CardDescription>
              {gameData.achievements.length > 0
                ? `Parabéns! Você desbloqueou ${gameData.achievements.length} conquista(s).`
                : "Complete ações e missões para desbloquear conquistas!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {ACHIEVEMENTS_CATALOG.map((ach) => (
                <AchievementCard
                  key={ach.id}
                  achievement={ach}
                  unlocked={unlockedIds.has(ach.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coming soon */}
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="py-8 text-center text-slate-400">
            <p className="font-semibold text-lg flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Em desenvolvimento
            </p>
            <p className="text-sm mt-1">
              Missões semanais, loja de recompensas e modos de jogo chegando em breve.
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Legend Modal */}
      {legendOpen && <LegendModal onClose={() => setLegendOpen(false)} />}
    </>
  );
}
