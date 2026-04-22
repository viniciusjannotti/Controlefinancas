"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useGame } from "@/lib/game/GameContext";
import { cn } from "@/lib/utils";
import { Zap, Search, Coffee, Utensils, Droplet, Sparkles, Activity, BookOpen, X, Info } from "lucide-react";

// ─── Estilos e Keyframes Locais ────────────────────────────────────────────────
const inlineStyles = `
  @keyframes blob-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15) rotate(2deg); }
  }
  @keyframes blob-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px) rotate(-5deg); }
    75% { transform: translateX(8px) rotate(5deg); }
  }
  @keyframes blob-happy {
    0%, 100% { border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; }
    50% { border-radius: 40% 40% 60% 60% / 50% 50% 50% 50%; }
  }
  @keyframes blob-poke {
    0% { transform: scale(1); }
    25% { transform: scale(0.9) translateY(10px) rotate(-3deg); }
    50% { transform: scale(1.05) translateY(-5px) rotate(3deg); }
    100% { transform: scale(1); }
  }
  
  .anim-eat { animation: blob-pulse 0.4s ease-in-out; }
  .anim-explore { animation: blob-shake 0.4s ease-in-out; }
  .anim-poke { animation: blob-poke 0.3s ease-in-out; }
  .anim-idle { animation: blob-happy 4s infinite ease-in-out; }

  /* Premium scrollbar for logs */
  .log-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .log-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .log-scroll::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 10px;
  }
`;

// ─── Tipos Preparados para o Futuro ──────────────────────────────────────────
type GamePhase = "PHASE_1_SURVIVAL" | "PHASE_2_SOCIAL" | "PHASE_3_PRODUCTION";

interface LogEntry {
  id: string;
  msg: string;
  type: "positive" | "negative" | "neutral";
  timestamp: Date;
}

const getRank = (exp: number) => {
  if (exp < 11) return { title: "Inexperiente", foodChance: 0.40, phaseChance: 0 };
  if (exp < 26) return { title: "Curioso", foodChance: 0.45, phaseChance: 0 };
  if (exp < 51) return { title: "Observador", foodChance: 0.50, phaseChance: 0.01 };
  if (exp < 101) return { title: "Explorador", foodChance: 0.55, phaseChance: 0.03 };
  if (exp < 201) return { title: "Vivido", foodChance: 0.60, phaseChance: 0.06 };
  return { title: "Experiente", foodChance: 0.65, phaseChance: 0.10 };
};

// ─── Componentes Menores ─────────────────────────────────────────────────────

function ProgressBar({ 
  value, 
  max = 100, 
  colorClass, 
  label, 
  icon: Icon 
}: { 
  value: number; max?: number; colorClass: string; label: string; icon: React.ElementType 
}) {
  const isLow = value < 30;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
        <span className="flex items-center gap-1.5">
          <Icon className={cn("w-3.5 h-3.5", isLow ? "text-red-500 animate-pulse" : "text-slate-400")} />
          {label}
        </span>
        <span className={isLow ? "text-red-500" : ""}>{value} / {max}</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className={cn("h-full rounded-full transition-all duration-500 relative", isLow ? "bg-red-500" : colorClass)} 
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Regras ─────────────────────────────────────────────────────────
function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">

        {/* Header gradient */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black">Regras de Sociedade</h2>
                <p className="text-indigo-100 text-sm">Entenda como manter seu organismo vivo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">O Ciclo da Vida</h3>
            <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800">
              <Info className="w-5 h-5 mt-0.5 shrink-0" />
              <span>
                Esta é a <b>Fase 1: Sobrevivência</b>. O objetivo é manter sua saciedade alta utilizando a <b>Energia</b> enviada por fontes externas (seu progresso financeiro). Múltiplas explorações secretamente desbloqueiam sabedoria para evoluir. Cuidado: chegar a Zero de Saciedade apagará todos os instintos adquiridos de seu organismo.
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Ações Vitais</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50">
                <span className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <Utensils className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">Comer</p>
                  <p className="text-xs text-slate-500">Custo: 5 Energia. Regenera 20 pontos de saciedade garantidos.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-indigo-50/50">
                <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <p className="font-bold text-indigo-900 text-sm">Explorar (A chave da Evolução)</p>
                  <p className="text-xs text-indigo-700/80">Custo: 3 Energia. Acumula conhecimento oculto. Pode encontrar bônus ou danos curtos, e aumenta globalmente suas chances de sobrevivência a longo prazo.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────
export default function SociedadePage() {
  const { gameData, updateSocietyData, loading: gameLoading } = useGame();
  const { 
    energy, 
    satiety, 
    hiddenExp, 
    hasTransitioned, 
    lastPassiveDrainUpdate 
  } = gameData.society;

  const [logs, setLogs] = useState<LogEntry[]>([{ id: 'init', msg: "Uma nova forma de vida despertou.", type: "neutral", timestamp: new Date() }]);
  const [animClass, setAnimClass] = useState<string>("anim-idle");
  const [rulesOpen, setRulesOpen] = useState(false);

  const addLog = useCallback((msg: string, type: LogEntry['type']) => {
    setLogs(prev => [{ id: Math.random().toString(), msg, type, timestamp: new Date() }, ...prev]);
  }, []);

  // ─── Lógica de Decaimento Passivo (1 a cada 15 mins) ──────────────────────
  useEffect(() => {
    if (gameLoading || !lastPassiveDrainUpdate) return;

    const FIFTEEN_MINS_MS = 15 * 60 * 1000;
    const now = Date.now();
    const lastUpdateTs = new Date(lastPassiveDrainUpdate).getTime();
    const elapsed = now - lastUpdateTs;
    const ticksMissed = Math.floor(elapsed / FIFTEEN_MINS_MS);

    if (ticksMissed > 0) {
      const newSatiety = Math.max(0, satiety - ticksMissed);
      const newUpdateDate = new Date(lastUpdateTs + (ticksMissed * FIFTEEN_MINS_MS)).toISOString();

      updateSocietyData({
        satiety: newSatiety,
        lastPassiveDrainUpdate: newUpdateDate,
        hiddenExp: newSatiety === 0 ? 0 : hiddenExp
      });

      addLog(`O tempo passou. Organismo consumiu ${satiety - newSatiety} de saciedade enquanto você esteve fora.`, "negative");
      if (newSatiety === 0 && hiddenExp > 0) {
        addLog("O organismo feneceu e perdeu toda a sua sabedoria acumulada.", "negative");
      }
    }

    const interval = setInterval(() => {
      const currentNow = Date.now();
      const latestDataTs = new Date(lastPassiveDrainUpdate).getTime();
      if (currentNow - latestDataTs >= FIFTEEN_MINS_MS) {
        const nextSatiety = Math.max(0, satiety - 1);
        updateSocietyData({
          satiety: nextSatiety,
          lastPassiveDrainUpdate: new Date().toISOString(),
          hiddenExp: nextSatiety === 0 ? 0 : hiddenExp
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [gameLoading, lastPassiveDrainUpdate, satiety, hiddenExp, updateSocietyData, addLog]);

  // Restauração Automática: Corrige se a saciedade foi zerada por causa do bug de data no Firestore
  useEffect(() => {
    if (gameLoading) return;
    const fixApplied = localStorage.getItem("sociedade_bugfix_v3");
    if (!fixApplied) {
      if (satiety === 0) {
        let restoredSatiety = 80;
        try {
          const stored = localStorage.getItem("sociedade_satiety_v2");
          if (stored) {
            const { lastSatiety } = JSON.parse(stored);
            if (typeof lastSatiety === "number" && lastSatiety > 0) restoredSatiety = lastSatiety;
          }
        } catch (e) {}
        
        updateSocietyData({
          satiety: restoredSatiety,
          lastPassiveDrainUpdate: new Date().toISOString()
        });
        addLog("Os níveis biológicos foram estabilizados pelo sistema reparador.", "positive");
      }
      localStorage.setItem("sociedade_bugfix_v3", "true");
    }
  }, [gameLoading, satiety, updateSocietyData, addLog]);

  // Gatilho de animação
  const triggerAnim = (animationName: string) => {
    setAnimClass(animationName);
    setTimeout(() => {
      setAnimClass("anim-idle");
    }, 400); // tempo que bate com a animação CSS
  };

  // ─── Funções Principais de Ação ─────────────────────────────────────────────

  const handleEat = () => {
    if (energy < 5) {
      addLog("Energia insuficiente para procurar comida.", "negative");
      return;
    }
    
    updateSocietyData({
      energy: energy - 5,
      satiety: Math.min(100, satiety + 20)
    });
    
    addLog("O ser se alimentou e recuperou forças.", "positive");
    triggerAnim("anim-eat");
  };

  const handleExplore = () => {
    if (energy < 3) {
      addLog("Muito cansado para explorar o desconhecido.", "negative");
      return;
    }
    
    const nextExp = hiddenExp + 1;
    const newRank = getRank(nextExp);
    const oldRankTitle = getRank(hiddenExp).title;
    
    let nextEnergy = energy - 3;
    let nextSatiety = satiety;
    let nextHasTransitioned = hasTransitioned;

    triggerAnim("anim-explore");

    if (newRank.title !== oldRankTitle) {
      addLog(`✨ Brilhante! O organismo se tornou um ser: ${newRank.title}. Suas chances em exploração aumentaram.`, "positive");
    }

    // Phase transition roll
    const roll = Math.random();
    if (newRank.phaseChance > 0 && roll < newRank.phaseChance) {
      nextHasTransitioned = true;
    } else {
      // Sorteio Simples Escalonado
      const eventRoll = Math.random();
      if (eventRoll < newRank.foodChance) {
        nextSatiety = Math.min(100, satiety + 10);
        addLog("Graças à sua percepção, encontrou nutrientes de qualidade!", "positive");
      } else if (eventRoll > 0.85) {
        nextSatiety = Math.max(0, satiety - 10);
        addLog("Esbarrou em um obstáculo duro ou predador. Perdeu energia vital.", "negative");
      } else {
        addLog("Explorou bastante, estudou o ambiente, mas não encontrou nutrientes.", "neutral");
      }
    }

    updateSocietyData({
      energy: nextEnergy,
      hiddenExp: nextExp,
      satiety: nextSatiety,
      hasTransitioned: nextHasTransitioned
    });
  };

  // ─── Variáveis Visuais baseadas no Estado ──────────────────────────────────
  let blobColor = "bg-gradient-to-br from-indigo-400 to-purple-500 shadow-indigo-300"; // Feliz (Default)
  let blobFace = "😊";
  if (satiety <= 30) {
    blobColor = "bg-gradient-to-br from-rose-400 to-red-600 shadow-rose-300"; // Fraco
    blobFace = "😩";
  } else if (satiety <= 60) {
    blobColor = "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-300"; // Neutro/Com fome
    blobFace = "😐";
  }

  if (energy === 0) {
    blobFace = "😵";
  }

  // Render da Fase 2 bloqueada (Vitória Temporal)
  if (hasTransitioned) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in slide-in-from-bottom-6 fade-in duration-1000 p-6">
        <Card className="max-w-xl text-center bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border-indigo-500/50 shadow-[0_0_100px_rgba(79,70,229,0.3)] p-12 rounded-[2.5rem] text-white">
          <Sparkles className="w-20 h-20 text-indigo-300 mx-auto mb-8 animate-pulse drop-shadow-lg" />
          <h1 className="text-4xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">
            A Sociedade Desperta
          </h1>
          <p className="text-indigo-200/90 leading-relaxed text-lg mb-8 font-medium">
            Seu organismo atingiu a capacidade cognitiva e comportamental necessária para transcender a mera biologia de sobrevivência. Os laços começam a se formar.
          </p>
          <div className="inline-block bg-black/30 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5 font-mono text-sm text-indigo-300 shadow-inner">
            FASE 2: CONSTRUÇÃO SOCIAL <br />
            <span className="text-xs text-indigo-400 mt-1 block">(Em desenvolvimento)</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

      {/* Header Premium */}
      <div className="flex flex-col gap-2 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20" />
        
        <div className="z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Droplet className="w-8 h-8 text-indigo-400" />
              Sociedade
            </h1>
            <p className="text-slate-300 font-medium text-lg mt-1">Evolua sua célula primordial rumo a uma civilização avançada.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-900/40 backdrop-blur-md px-4 py-2 flex items-center gap-2 rounded-full border border-indigo-500/30 shadow-sm">
              <span className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">Sabedoria:</span>
              <span className="text-sm font-black tracking-widest text-indigo-100">{getRank(hiddenExp).title}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
              <span className="text-sm font-bold tracking-widest text-indigo-200">FASE 1: SOBREVIVÊNCIA</span>
            </div>
            {/* Legend Button */}
            <button
              onClick={() => setRulesOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-lg transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Regras
            </button>
          </div>
        </div>
      </div>

      {/* Jogo em Si */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Painel Esquerdo: Ambiente & Avatar */}
        <Card className="lg:col-span-8 bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden flex flex-col h-full border-b-[6px]">
          <CardHeader className="bg-slate-50/80 border-b border-slate-100 pb-4">
            <CardTitle className="text-slate-700 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Ambiente Controlado
            </CardTitle>
            <CardDescription>O estado biológico atual do seu organismo.</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col items-center justify-center py-16 relative">
            {/* Grid de fundo sutil */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 2px, transparent 2px)", backgroundSize: "30px 30px" }} />
            
            {/* Avatar Central (Blob) */}
            <div className="relative group perspective-1000">
              <div 
                onClick={() => triggerAnim("anim-poke")}
                className={cn(
                  "w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center text-6xl shadow-2xl transition-all duration-700 cursor-pointer active:scale-95",
                  blobColor,
                  animClass
                )}
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
              >
                <span className="drop-shadow-lg scale-110">{blobFace}</span>
                {/* Reflexo de vidro */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none" />
              </div>
              
              {/* Sombrinha */}
              <div className="w-32 h-6 bg-slate-900/10 blur-[8px] rounded-full mt-6 mx-auto transition-transform group-hover:scale-110" />
            </div>

            {/* Status Bars Flutuantes sob o Avatar */}
            <div className="w-full max-w-sm mt-10 space-y-6 bg-white/80 backdrop-blur-md p-6 border border-slate-100 rounded-2xl shadow-sm z-10">
              <ProgressBar 
                value={satiety} 
                max={100} 
                colorClass="bg-gradient-to-r from-emerald-400 to-green-500" 
                label="Saciedade" 
                icon={Utensils} 
              />
              <ProgressBar 
                value={energy} 
                max={100} 
                colorClass="bg-gradient-to-r from-amber-400 to-yellow-500" 
                label="Energia (Recurso Externo)" 
                icon={Zap} 
              />
            </div>
            
          </CardContent>
        </Card>

        {/* Painel Direito: Ações & Logs */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Ações */}
          <Card className="bg-white border-slate-200 shadow-xl rounded-3xl border-b-[4px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-800 text-lg">Ações vitais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button 
                onClick={handleEat}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-green-50 border-2 border-slate-100 hover:border-green-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">Comer</p>
                    <p className="text-xs text-slate-500">+20 Saciedade</p>
                  </div>
                </div>
                <div className="text-xs font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1 group-hover:bg-amber-200 transition-colors">
                  <Zap className="w-3 h-3" /> -5
                </div>
              </button>

              <button 
                onClick={handleExplore}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">Explorar</p>
                    <p className="text-xs text-slate-500">Pode achar bônus</p>
                  </div>
                </div>
                <div className="text-xs font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-full flex items-center gap-1 group-hover:bg-amber-200 transition-colors">
                  <Zap className="w-3 h-3" /> -3
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Registro do Sistema (Logs) */}
          <Card className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden flex flex-col shadow-inner">
            <CardHeader className="bg-slate-100/50 py-4 border-b border-slate-200">
              <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2 uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-slate-400" />
                Registros Biológicos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative h-[250px]">
              <div className="absolute inset-0 overflow-y-auto p-4 space-y-3 log-scroll">
                {logs.map((log, i) => (
                  <div 
                    key={log.id} 
                    className={cn(
                      "text-xs p-3 rounded-xl border flex gap-3 shadow-sm",
                      log.type === "positive" ? "bg-green-50 border-green-100 text-green-800" :
                      log.type === "negative" ? "bg-red-50 border-red-100 text-red-800" :
                      "bg-white border-slate-200 text-slate-600",
                      i === 0 && "font-semibold ring-1 ring-black/5" // O log mais recente ganha destaque
                    )}
                  >
                    <div className="opacity-50 text-[10px] shrink-0 mt-0.5">
                      {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div>{log.msg}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Rules Modal */}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    </div>
  );
}
