import { useEffect, useState } from "react";
import { StoneNumber } from "./StoneNumber";
import { BlazeService } from "@/services/BlazeService";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface BlazeHistoryEntry {
  id: string;
  number: number;
  color: 'red' | 'black' | 'white';
  timestamp: number;
}

export function LastStone() {
  const [lastStone, setLastStone] = useState<BlazeHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchLastStone = async (showLoading = false) => {
    if (isUpdating) return;
    
    if (showLoading) setLoading(true);
    setIsUpdating(true);
    setError(null);
    
    try {
      const stone = await BlazeService.getLastStone();
      if (stone) {
        setLastStone(stone);
      } else {
        setError("Nenhum dado encontrado");
      }
    } catch (err) {
      setError("Erro ao conectar com API");
      console.error('Erro ao buscar última pedra:', err);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  const handleRefreshClick = () => {
    fetchLastStone(true);
  };

  useEffect(() => {
    fetchLastStone(true);
    
    const interval = setInterval(() => fetchLastStone(false), 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="w-auto max-w-md">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
      Última Pedra
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefreshClick}
        disabled={loading}
        className="h-6 w-6 p-0"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </CardTitle>
  </CardHeader>

  <CardContent>
    {loading ? (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl bg-muted animate-pulse"></div>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    ) : error ? (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl bg-destructive/20 flex items-center justify-center">
          <span className="text-destructive text-xl">!</span>
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    ) : lastStone ? (
      <div className="flex items-center gap-4">
        <StoneNumber 
          number={lastStone.number} 
          className="w-16 h-16 text-lg scale-110" 
        />

        <div className="flex flex-col">
          <p className="text-sm font-medium">
            Pedra {lastStone.number}
          </p>
          <p className="text-xs text-muted-foreground">
            {BlazeService.getColorEmoji(lastStone.color)} {BlazeService.getColorName(lastStone.color)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTime(lastStone.timestamp)}
          </p>
        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
    )}
  </CardContent>
</Card>

  );
}