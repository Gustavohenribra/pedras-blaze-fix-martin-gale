import { useState, useEffect } from "react";
import { StrategyRow } from "@/components/StrategyRow";
import { TabSelector } from "@/components/TabSelector";
import { ColorPatterns } from "@/components/ColorPatterns";
import { LastStone } from "@/components/LastStone";
import { Activity, Clock, Zap, TrendingUp, BarChart3 } from "lucide-react";
import { BlazeService } from "@/services/BlazeService";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface StoneStats {
    stone: number;
    occurrences: number;
    percentage: number;
    redTendency: number;
    blackTendency: number;
    dominantColor: "red" | "black";
}

interface ColorStats {
    redPercentage: number;
    blackPercentage: number;
    whitePercentage: number;
    total: number;
}

const Index = () => {
    const [activeTab, setActiveTab] = useState<"cores" | "numeros">("numeros");
    const [useGale, setUseGale] = useState(false);
    const [stoneStats, setStoneStats] = useState<StoneStats[]>([]);
    const [colorStats, setColorStats] = useState<ColorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [isUpdating, setIsUpdating] = useState(false);
    const [nextUpdateIn, setNextUpdateIn] = useState(30);

    const loadStats = async () => {
        if (isUpdating) {
            console.log("Atualização já em andamento, aguardando...");
            return;
        }

        setIsUpdating(true);

        try {
            console.log("Carregando estatísticas...");
            const [stones, colors] = await Promise.all([
                BlazeService.getStoneStats(),
                BlazeService.getColorStats(),
            ]);

            setStoneStats(stones);
            setColorStats(colors);
            setLastUpdate(new Date());
            setNextUpdateIn(30);

            console.log("Estatísticas atualizadas com sucesso");
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        } finally {
            setLoading(false);
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        loadStats();

        const updateInterval = setInterval(() => {
            loadStats();
        }, 30000);

        const countdownInterval = setInterval(() => {
            setNextUpdateIn((prev) => {
                if (prev <= 1) {
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(updateInterval);
            clearInterval(countdownInterval);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div
                className="absolute bottom-10 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none animate-pulse"
                style={{ animationDelay: "2s" }}
            />

            <div className="container mx-auto px-6 py-12 relative z-10">
                <div className="flex items-center justify-between mb-8 animate-fade-in">
                    <div className="flex flex-col items-start">
                        <div className="">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-80 w-auto"
                            />
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    {activeTab === "numeros"
                                        ? "Estatísticas das Pedras"
                                        : "Análise de Cores → Padrões"}
                                </h1>
                                {activeTab === "numeros" && (
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id="gale"
                                            checked={useGale}
                                            onCheckedChange={() =>
                                                setUseGale(!useGale)
                                            }
                                        />
                                        <label
                                            htmlFor="gale"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Gale 1 (G1)
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    <span>
                                        Atualizado:{" "}
                                        {lastUpdate.toLocaleTimeString("pt-BR")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>Próxima em: {nextUpdateIn}s</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="animate-scale-in flex justify-center flex-1 pr-36"
                        style={{ animationDelay: "200ms" }}
                    >
                        <LastStone />
                    </div>

                    <div
                        className="animate-scale-in pb-24 pr-20"
                        style={{ animationDelay: "300ms" }}
                    >
                        <TabSelector
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </div>
                </div>

                {activeTab === "numeros" && (
                    <div
                        className="gradient-card rounded-2xl shadow-2xl shadow-primary/5 overflow-hidden animate-fade-in"
                        style={{ animationDelay: "400ms" }}
                    >
                        <div className="grid grid-cols-5 gap-4 px-8 py-6 bg-game-table-header/50 backdrop-blur-sm border-b border-border/50">
                            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Pedra & Frequência
                            </div>
                            <div className="text-sm font-semibold text-muted-foreground text-center uppercase tracking-wide">
                                % Aparição
                            </div>
                            <div className="text-sm font-semibold text-muted-foreground text-center uppercase tracking-wide">
                                Tendência de Cor
                            </div>
                            <div className="text-sm font-semibold text-muted-foreground text-center uppercase tracking-wide">
                                Multiplicador
                            </div>
                            <div className="text-sm font-semibold text-muted-foreground text-right uppercase tracking-wide">
                                Ação
                            </div>
                        </div>

                        <div className="divide-y divide-border/30">
                            {loading ? (
                                <div className="py-20 text-center text-muted-foreground">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                    Carregando estatísticas...
                                </div>
                            ) : (
                                stoneStats.map((stats, index) => (
                                    <StrategyRow
                                        key={stats.stone}
                                        stone={stats.stone}
                                        occurrences={stats.occurrences}
                                        percentage={stats.percentage}
                                        redTendency={stats.redTendency}
                                        blackTendency={stats.blackTendency}
                                        dominantColor={stats.dominantColor}
                                        index={index}
                                        useGale={useGale}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "cores" && (
                    <div className="space-y-8 animate-fade-in">
                        <ColorPatterns />

                        <Card className="p-8 gradient-card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    Estatísticas de Cores
                                </h3>
                            </div>

                            {colorStats && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center p-6 bg-red-500/10 rounded-xl border border-red-500/20">
                                        <div className="text-4xl mb-2">🔴</div>
                                        <div className="text-3xl font-bold text-red-500 mb-1">
                                            {colorStats.redPercentage}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Vermelho (1-7)
                                        </div>
                                    </div>

                                    <div className="text-center p-6 bg-gray-500/10 rounded-xl border border-gray-500/20">
                                        <div className="text-4xl mb-2">⚫</div>
                                        <div className="text-3xl font-bold text-gray-700 mb-1">
                                            {colorStats.blackPercentage}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Preto (8-14)
                                        </div>
                                    </div>

                                    <div className="text-center p-6 bg-gray-200/10 rounded-xl border border-gray-300/20">
                                        <div className="text-4xl mb-2">⚪</div>
                                        <div className="text-3xl font-bold text-gray-500 mb-1">
                                            {colorStats.whitePercentage}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Branco (0)
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                <div
                    className="mt-12 animate-fade-in"
                    style={{ animationDelay: "500ms" }}
                >
                    <Card className="p-8 gradient-card">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">
                                    🔴 Vermelho vs Preto ⚫ - Ao Vivo
                                </h3>
                            </div>
                        </div>

                        {colorStats && (
                            <div className="relative">
                                <div className="h-12 bg-gray-200 rounded-lg overflow-hidden flex">
                                    <div
                                        className="bg-red-500 flex items-center justify-center text-white font-bold transition-all duration-500"
                                        style={{
                                            width: `${colorStats.redPercentage}%`,
                                        }}
                                    >
                                        {colorStats.redPercentage > 10 &&
                                            `${colorStats.redPercentage}%`}
                                    </div>
                                    <div
                                        className="bg-gray-800 flex items-center justify-center text-white font-bold transition-all duration-500"
                                        style={{
                                            width: `${colorStats.blackPercentage}%`,
                                        }}
                                    >
                                        {colorStats.blackPercentage > 10 &&
                                            `${colorStats.blackPercentage}%`}
                                    </div>
                                    {colorStats.whitePercentage > 0 && (
                                        <div
                                            className="bg-gray-400 flex items-center justify-center text-white font-bold transition-all duration-500"
                                            style={{
                                                width: `${colorStats.whitePercentage}%`,
                                            }}
                                        >
                                            {colorStats.whitePercentage > 5 &&
                                                `${colorStats.whitePercentage}%`}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between mt-4">
                                    <div className="text-center">
                                        <span className="text-2xl">🔴</span>
                                        <p className="text-lg font-bold text-red-500">
                                            {colorStats.redPercentage}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Vermelho
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl">⚫</span>
                                        <p className="text-lg font-bold text-gray-700">
                                            {colorStats.blackPercentage}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Preto
                                        </p>
                                    </div>
                                    {colorStats.whitePercentage > 0 && (
                                        <div className="text-center">
                                            <span className="text-2xl">⚪</span>
                                            <p className="text-lg font-bold text-gray-500">
                                                {colorStats.whitePercentage}%
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Branco
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                <div
                    className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in"
                    style={{ animationDelay: "600ms" }}
                >
                    <div className="text-center p-6 bg-card/50 rounded-xl border border-border/50 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-success-rate mb-1">
                            {stoneStats.length > 0
                                ? stoneStats[0].percentage.toFixed(1)
                                : "0"}
                            %
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Pedra mais frequente
                        </div>
                    </div>
                    <div className="text-center p-6 bg-card/50 rounded-xl border border-border/50 backdrop-blur-sm">
                        <div className="text-2xl font-bold text-foreground mb-1">
                            {isUpdating ? "Atualizando..." : "Live"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Sistema ativo
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;
