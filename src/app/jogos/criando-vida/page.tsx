"use client";

import React from "react";
import { useGame } from "@/lib/game/GameContext";
import { xpForNextLevel } from "@/lib/game/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Flame, Star, Trophy, Zap, Sprout, Lock } from "lucide-react";

// ─── XP Progress Bar ──────────────────────────────────────────────────────────
function XPBar({ xp, level }: { xp: number; level: number }) {
  const needed = xpForNextLevel(level);
  // XP within the current level
  let remaining = xp;
  for (let l = 1; l < level; l++) remaining -= xpForNextLevel(l);
  const pct = Math.min(100, (remaining / needed) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-slate-500">
        <span>{remaining} XP</span>
        <span>{needed} XP para nível {level + 1}</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl p-4 shadow-sm", color)}>
      <Icon className="w-6 h-6 shrink-0" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-2xl font-black leading-none">{value}</p>
      </div>
    </div>
  );
}

// ─── Achievement Placeholder ──────────────────────────────────────────────────
function AchievementSlot({ locked = true }: { locked?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-1 p-4 rounded-2xl border-2 border-dashed text-center",
      locked ? "border-slate-200 text-slate-300" : "border-emerald-200 text-emerald-600"
    )}>
      {locked ? <Lock className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
      <span className="text-xs font-semibold">{locked ? "Bloqueado" : "Conquistado"}</span>
    </div>
  );
}

// ─── Plant Visual (placeholder) ───────────────────────────────────────────────
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
      <p className="text-slate-500 font-semibold text-lg">{stage.label}</p>
      <p className="text-xs text-slate-400 max-w-xs text-center">
        Continue registrando seus ganhos e gastos para fazer sua planta crescer!
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CriandoVidaPage() {
  const { gameData, loading } = useGame();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-400 animate-pulse">Carregando jogo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Sprout className="w-8 h-8 text-emerald-500" />
          Criando Vida
        </h2>
        <p className="text-slate-500 text-lg">
          Transforme seus hábitos financeiros em progresso real.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatPill
          icon={Star}
          label="Nível"
          value={gameData.level}
          color="bg-amber-50 text-amber-600"
        />
        <StatPill
          icon={Zap}
          label="XP Total"
          value={gameData.xp}
          color="bg-blue-50 text-blue-600"
        />
        <StatPill
          icon={Flame}
          label="Streak"
          value={`${gameData.streak}d`}
          color="bg-rose-50 text-rose-500"
        />
      </div>

      {/* XP Bar */}
      <Card>
        <CardContent className="pt-6">
          <XPBar xp={gameData.xp} level={gameData.level} />
        </CardContent>
      </Card>

      {/* Main area: plant + achievements */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Plant visual — main area */}
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

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Conquistas
            </CardTitle>
            <CardDescription>
              {gameData.achievements.length > 0
                ? `${gameData.achievements.length} conquista(s) desbloqueada(s)`
                : "Nenhuma conquista ainda — continue assim!"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {gameData.achievements.length > 0
                ? gameData.achievements.map((a) => (
                    <AchievementSlot key={a.id} locked={false} />
                  ))
                : Array.from({ length: 4 }).map((_, i) => (
                    <AchievementSlot key={i} locked />
                  ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Future area banner */}
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
        <CardContent className="py-8 text-center text-slate-400">
          <p className="font-semibold text-lg">🚧 Em desenvolvimento</p>
          <p className="text-sm mt-1">
            Missões diárias, recompensas e novos modos de jogo chegando em breve.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
