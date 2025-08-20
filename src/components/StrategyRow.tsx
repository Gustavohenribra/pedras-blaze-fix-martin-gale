import { StoneNumber } from "./StoneNumber";
import { Button } from "./ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StrategyRowProps {
    stone: number;
    occurrences: number;
    percentage: number;
    redTendency: number;
    blackTendency: number;
    dominantColor: "red" | "black";
    index: number;
    useGale: boolean;
}

export function StrategyRow({
    stone,
    occurrences,
    percentage,
    redTendency,
    blackTendency,
    dominantColor,
    index,
    useGale,
}: StrategyRowProps) {
    const getDelayClass = (index: number) => {
        return `animate-slide-in-left`;
    };

    const calculateOdds = (percentage: number) => {
        if (percentage === 0) return 0;
        const baseOdds = 100 / percentage;
        return Math.round(baseOdds * 10) / 10;
    };

    const odds = calculateOdds(percentage);

    const galeColor = dominantColor === "red" ? "black" : "red";
    const finalDominantColor = useGale ? galeColor : dominantColor;

    const displayedRedTendency = useGale ? blackTendency : redTendency;
    const displayedBlackTendency = useGale ? redTendency : blackTendency;

    return (
        <div
            className={`grid grid-cols-5 gap-4 items-center py-5 px-6 border-b border-border hover:bg-card/70 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 ${getDelayClass(
                index
            )}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-center gap-4">
                <StoneNumber number={stone} />
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                        Pedra {stone}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Apareceu {occurrences}x
                    </span>
                </div>
            </div>

            <div className="text-center">
                <div className="font-bold text-lg text-foreground">
                    {percentage.toFixed(1)}%
                </div>
                <span className="text-xs text-muted-foreground">aparição</span>
            </div>

            <div className="text-center">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-1">
                            <span className="text-red-500">🔴</span>
                            <span
                                className={`font-bold text-sm ${
                                    displayedRedTendency >
                                    displayedBlackTendency
                                        ? "text-red-500"
                                        : "text-gray-400"
                                }`}
                            >
                                {displayedRedTendency}%
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-600">⚫</span>
                            <span
                                className={`font-bold text-sm ${
                                    displayedBlackTendency >
                                    displayedRedTendency
                                        ? "text-gray-700"
                                        : "text-gray-400"
                                }`}
                            >
                                {displayedBlackTendency}%
                            </span>
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Puxando {finalDominantColor === "red" ? "🔴" : "⚫"}
                    </span>
                </div>
            </div>

            <div className="text-center">
                <div className="font-bold text-lg text-foreground">
                    {odds > 0 ? `${odds}x` : "-"}
                </div>
                <span className="text-xs text-muted-foreground">
                    multiplicador
                </span>
            </div>

            <div className="text-right">
                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
                    disabled={occurrences === 0}
                >
                    {occurrences > 0 ? "Ativar" : "Sem dados"}
                </Button>
            </div>
        </div>
    );
}
