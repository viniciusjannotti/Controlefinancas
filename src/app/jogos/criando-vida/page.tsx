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
  const stages = [
    { emoji: "🌱", label: "Semente" },
    { emoji: "🌿", label: "Broto" },
    { emoji: "🌳", label: "Árvore jovem" },
    { emoji: "🌲", label: "Árvore forte" },
    { emoji: "🌴", label: "Floresta" },
  ];
  const stage = stages[Math.min(level - 1, stages.length - 1)];

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="text-8xl select-none animate-bounce" style={{ animationDuration: "3s" }}>
        {stage.emoji}
      </div>
      <p className="text-emerald-700 font-bold text-lg">{stage.label}</p>
      <p className="text-xs text-emerald-600 max-w-xs text-center opacity-80">
        Continue registrando seus ganhos e gastos para fazer sua planta crescer!
      </p>
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

          {/* Plant visual */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
            <CardHeader>
              <CardTitle className="text-emerald-800">Sua Planta</CardTitle>
              <CardDescription className="text-emerald-600">
                Modo: {gameData.gameMode} · Progresso visual do seu nível
              </CardDescription>
            </CardHeader>
            <CardContent>
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
