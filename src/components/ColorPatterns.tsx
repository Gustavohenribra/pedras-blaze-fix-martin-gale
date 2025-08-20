import { BlazeService } from "@/services/BlazeService";
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, History } from "lucide-react";

interface HistoryEntry {
  id: string;
  number: number;
  color: 'red' | 'black' | 'white';
  timestamp: number;
}

export function ColorPatterns() {
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sequenceStats, setSequenceStats] = useState<{
    currentStreak: { color: 'red' | 'black' | 'white', count: number },
    maxRedStreak: number,
    maxBlackStreak: number,
    alternations: number
  } | null>(null);

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        const history = await BlazeService.getHistory();
        const recent = history.slice(0, 100);
        setRecentHistory(recent);
        
        if (history.length > 0) {
          let currentStreak = { color: history[0].color, count: 1 };
          let maxRedStreak = 0;
          let maxBlackStreak = 0;
          let currentRedStreak = 0;
          let currentBlackStreak = 0;
          let alternations = 0;
          
          for (let i = 0; i < Math.min(history.length, 100); i++) {
            const current = history[i];
            
            if (current.color === 'red') {
              currentRedStreak++;
              currentBlackStreak = 0;
              maxRedStreak = Math.max(maxRedStreak, currentRedStreak);
            } else if (current.color === 'black') {
              currentBlackStreak++;
              currentRedStreak = 0;
              maxBlackStreak = Math.max(maxBlackStreak, currentBlackStreak);
            } else {
              currentRedStreak = 0;
              currentBlackStreak = 0;
            }
            
            if (i > 0 && history[i].color !== history[i-1].color && 
                history[i].color !== 'white' && history[i-1].color !== 'white') {
              alternations++;
            }
            
            if (i === 0) {
              currentStreak = { color: current.color, count: 1 };
            } else if (i > 0 && history[i].color === history[i-1].color) {
              currentStreak.count++;
            } else {
              break;
            }
          }
          
          setSequenceStats({
            currentStreak,
            maxRedStreak,
            maxBlackStreak,
            alternations
          });
        }
      } catch (error) {
        console.error("Erro ao carregar padrões:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPatterns();
    
    const interval = setInterval(loadPatterns, 60000);
    return () => clearInterval(interval);
  }, []);

  const getColorSquare = (color: 'red' | 'black' | 'white', isLarge = false) => {
    const sizeClass = isLarge ? 'w-8 h-8' : 'w-6 h-6';
    const colorClasses = {
      red: 'bg-red-500',
      black: 'bg-gray-900 border border-gray-600',
      white: 'bg-white border border-gray-300'
    };

    return (
      <div className={`${sizeClass} rounded ${colorClasses[color]} transition-all hover:scale-110`} />
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Carregando padrões...
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 gradient-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <History className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Últimas 20 Rodadas</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {recentHistory.map((entry, index) => (
            <div
              key={entry.id}
              className="flex flex-col items-center gap-1 p-2 bg-background/50 rounded-lg hover:bg-background/70 transition-all"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {getColorSquare(entry.color, true)}
              <span className="text-xs font-medium">{entry.number}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 gradient-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Análise de Sequências</h3>
        </div>

        {sequenceStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Sequência Atual</span>
                <Badge variant="default" className="font-bold">
                  {sequenceStats.currentStreak.count}x
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {getColorSquare(sequenceStats.currentStreak.color)}
                <span className="text-sm">
                  {BlazeService.getColorName(sequenceStats.currentStreak.color)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Maior Seq. 🔴</span>
                <Badge variant="destructive" className="font-bold">
                  {sequenceStats.maxRedStreak}x
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Maior Seq. ⚫</span>
                <Badge variant="secondary" className="font-bold">
                  {sequenceStats.maxBlackStreak}x
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Alternações</span>
                <Badge variant="outline" className="font-bold">
                  {sequenceStats.alternations}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Mudanças de cor
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6 gradient-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Padrões Identificados</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card/50 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium mb-3">Tendência Geral</h4>
            <div className="space-y-2">
              {sequenceStats && sequenceStats.maxRedStreak > sequenceStats.maxBlackStreak ? (
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-2xl">🔴</span>
                  <span className="text-sm">Vermelho dominante com sequências longas</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-2xl">⚫</span>
                  <span className="text-sm">Preto dominante com sequências longas</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-card/50 rounded-lg border border-border/50">
            <h4 className="text-sm font-medium mb-3">Padrão de Alternação</h4>
            <div className="space-y-2">
              {sequenceStats && sequenceStats.alternations > 30 ? (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-2xl">⚡</span>
                  <span className="text-sm">Alta alternação entre cores ({sequenceStats.alternations} mudanças)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-blue-500 text-2xl">💫</span>
                  <span className="text-sm">Baixa alternação - Sequências longas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}