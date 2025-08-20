interface BlazeHistoryEntry {
    id: string;
    number: number;
    color: "red" | "black" | "white";
    timestamp: number;
}

interface StoneStats {
    stone: number;
    occurrences: number;
    percentage: number;
    redTendency: number;
    blackTendency: number;
    dominantColor: "red" | "black";
    galeRedSuccess: number; 
    galeBlackSuccess: number;
}

interface ColorStats {
    redPercentage: number;
    blackPercentage: number;
    whitePercentage: number;
    total: number;
}

interface BlazeGame {
    id?: string;
    roll?: number;
    value?: number;
    number?: number;
    result?: number;
    created_at?: string | number | Date;
    date?: string | number | Date;
    timestamp?: string | number | Date;
}

export class BlazeService {
    private static history: BlazeHistoryEntry[] = [];
    private static lastFetchTimestamp = 0;
    private static readonly HISTORY_LIMIT = 100;
    private static isFetching = false;
    private static fetchPromise: Promise<BlazeHistoryEntry[]> | null = null;

    private static retryCount = 0;
    private static readonly MAX_RETRIES = 3;
    private static readonly BASE_RETRY_DELAY = 5000;
    private static lastErrorTimestamp = 0;
    private static consecutiveErrors = 0;

    private static getRetryDelay(): number {
        if (this.consecutiveErrors > 5) {
            return this.BASE_RETRY_DELAY * 3;
        }
        if (this.consecutiveErrors > 3) {
            return this.BASE_RETRY_DELAY * 2;
        }
        return this.BASE_RETRY_DELAY;
    }

    private static shouldAttemptFetch(): boolean {
        const now = Date.now();
        const timeSinceLastError = now - this.lastErrorTimestamp;
        const retryDelay = this.getRetryDelay();

        if (this.lastErrorTimestamp > 0 && timeSinceLastError < retryDelay) {
            return false;
        }

        return true;
    }

    private static async fetchBlazeAPI(): Promise<BlazeHistoryEntry[]> {
        if (!this.shouldAttemptFetch()) {
            throw new Error("Aguardando período de retry");
        }

        this.isFetching = true;

        try {
            const supabaseFunctionUrl =
                "https://bmrhhjsduebxtsguwuts.supabase.co/functions/v1/blaze-history";

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(supabaseFunctionUrl, {
                method: "GET",
                headers: { Accept: "application/json" },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            let games: BlazeGame[] = [];
            if (Array.isArray(data)) {
                games = data;
            } else if (data.records && Array.isArray(data.records)) {
                games = data.records;
            } else if (data.data && Array.isArray(data.data)) {
                games = data.data;
            } else if (data.results && Array.isArray(data.results)) {
                games = data.results;
            }

            if (games.length === 0) {
                throw new Error("API retornou array vazio");
            }

            this.retryCount = 0;
            this.consecutiveErrors = 0;
            this.lastErrorTimestamp = 0;

            return games
                .slice(0, this.HISTORY_LIMIT)
                .map((game: BlazeGame, index: number) => {
                    const number =
                        game.roll ??
                        game.value ??
                        game.number ??
                        game.result ??
                        0;
                    return {
                        id:
                            game.id?.toString() ||
                            `game_${Date.now()}_${index}`,
                        number,
                        color: this.getNumberColor(number),
                        timestamp: new Date(
                            game.created_at ||
                                game.date ||
                                game.timestamp ||
                                Date.now() - index * 30000
                        ).getTime(),
                    };
                });
        } catch (error) {
            this.retryCount++;
            this.consecutiveErrors++;
            this.lastErrorTimestamp = Date.now();

            const errorMessage =
                error instanceof Error ? error.message : "Erro desconhecido";
            const retryDelay = this.getRetryDelay();

            console.error(
                `❌ Erro na tentativa ${this.retryCount}/${this.MAX_RETRIES}: ${errorMessage}`
            );

            if (this.retryCount >= this.MAX_RETRIES) {
                this.retryCount = 0;
            }

            throw error;
        } finally {
            this.isFetching = false;
        }
    }

    private static getNumberColor(number: number): "red" | "black" | "white" {
        if (number === 0) return "white";
        if (number >= 1 && number <= 7) return "red";
        return "black";
    }

    static async getHistory(): Promise<BlazeHistoryEntry[]> {
        const now = new Date();
        const lastFetchDate = new Date(this.lastFetchTimestamp);

        const cacheValidTime = 30000;
        const timeSinceLastFetch = now.getTime() - this.lastFetchTimestamp;

        if (timeSinceLastFetch < cacheValidTime && this.history.length > 0) {
            return this.history;
        }

        if (this.isFetching && this.fetchPromise) {
            return this.fetchPromise;
        }

        this.fetchPromise = (async () => {
            try {
                console.log(
                    "🔍 Cache expirado ou inexistente, buscando novos dados..."
                );
                const newHistory = await this.fetchBlazeAPI();

                if (newHistory && newHistory.length > 0) {
                    this.history = newHistory;
                    this.lastFetchTimestamp = now.getTime();
                }

                return this.history;
            } catch (error) {
                console.error("⚠️ Falha ao buscar dados:", error);

                if (this.history.length > 0) {
                    return this.history;
                }

                return [];
            } finally {
                this.fetchPromise = null;
            }
        })();

        return this.fetchPromise;
    }

    static async getStoneStats(): Promise<StoneStats[]> {
        const history = await this.getHistory();
        const stats: StoneStats[] = [];
        const totalGames = Math.min(history.length, this.HISTORY_LIMIT);

        for (let stone = 0; stone <= 14; stone++) {
            const stoneOccurrences = history
                .slice(0, totalGames)
                .filter((entry) => entry.number === stone);

            const occurrences = stoneOccurrences.length;
            const percentage =
                totalGames > 0 ? (occurrences / totalGames) * 100 : 0;

            let redCount = 0;
            let blackCount = 0;

            let galeRedSuccessCount = 0;
            let galeBlackSuccessCount = 0;
            let galeRedTotalBets = 0;
            let galeBlackTotalBets = 0;

            stoneOccurrences.forEach((occurrence) => {
                const currentIndex = history.findIndex(
                    (h) => h.id === occurrence.id
                );

                if (currentIndex > 0 && currentIndex < history.length - 1) {
                    const nextEntry = history[currentIndex - 1];
                    if (nextEntry.color === "red") redCount++;
                    else if (nextEntry.color === "black") blackCount++;
                }

                if (currentIndex > 1) {
                    const next1 = history[currentIndex - 1];
                    const next2 =
                        currentIndex > 1 ? history[currentIndex - 2] : null;

                    galeRedTotalBets++;
                    if (next1?.color === "red") {
                        galeRedSuccessCount++;
                    } else if (next2?.color === "red") {
                        galeRedSuccessCount++;
                    }

                    galeBlackTotalBets++;
                    if (next1?.color === "black") {
                        galeBlackSuccessCount++;
                    } else if (next2?.color === "black") {
                        galeBlackSuccessCount++;
                    }
                }
            });

            const totalNext = redCount + blackCount;
            const redTendency =
                totalNext > 0 ? (redCount / totalNext) * 100 : 50;
            const blackTendency =
                totalNext > 0 ? (blackCount / totalNext) * 100 : 50;

            const galeRedSuccess =
                galeRedTotalBets > 0
                    ? Math.round((galeRedSuccessCount / galeRedTotalBets) * 100)
                    : 0;
            const galeBlackSuccess =
                galeBlackTotalBets > 0
                    ? Math.round(
                          (galeBlackSuccessCount / galeBlackTotalBets) * 100
                      )
                    : 0;

            stats.push({
                stone,
                occurrences,
                percentage: Math.round(percentage * 100) / 100,
                redTendency: Math.round(redTendency),
                blackTendency: Math.round(blackTendency),
                dominantColor: redTendency >= blackTendency ? "red" : "black",
                galeRedSuccess,
                galeBlackSuccess,
            });
        }

        return stats
            .filter((s) => s.stone !== 0)
            .sort((a, b) => b.percentage - a.percentage);
    }

    static async getColorStats(): Promise<ColorStats> {
        const history = await this.getHistory();
        const totalGames = Math.min(history.length, this.HISTORY_LIMIT);
        const recentHistory = history.slice(0, totalGames);

        const redCount = recentHistory.filter(
            (entry) => entry.color === "red"
        ).length;
        const blackCount = recentHistory.filter(
            (entry) => entry.color === "black"
        ).length;
        const whiteCount = recentHistory.filter(
            (entry) => entry.color === "white"
        ).length;

        return {
            redPercentage:
                totalGames > 0 ? Math.round((redCount / totalGames) * 100) : 0,
            blackPercentage:
                totalGames > 0
                    ? Math.round((blackCount / totalGames) * 100)
                    : 0,
            whitePercentage:
                totalGames > 0
                    ? Math.round((whiteCount / totalGames) * 100)
                    : 0,
            total: totalGames,
        };
    }

    static async getLastStone(): Promise<BlazeHistoryEntry | null> {
        const history = await this.getHistory();
        return history.length > 0 ? history[0] : null;
    }

    static getColorName(color: "red" | "black" | "white"): string {
        const colorNames = {
            red: "Vermelho",
            black: "Preto",
            white: "Branco",
        };
        return colorNames[color];
    }

    static getColorEmoji(color: "red" | "black" | "white"): string {
        const colorEmojis = {
            red: "🔴",
            black: "⚫",
            white: "⚪",
        };
        return colorEmojis[color];
    }

    static resetErrorState(): void {
        this.retryCount = 0;
        this.consecutiveErrors = 0;
        this.lastErrorTimestamp = 0;
    }

    static getServiceStatus(): {
        isHealthy: boolean;
        consecutiveErrors: number;
        nextRetryIn: number;
        cacheSize: number;
    } {
        const now = Date.now();
        const timeSinceLastError = now - this.lastErrorTimestamp;
        const retryDelay = this.getRetryDelay();
        const nextRetryIn = Math.max(0, retryDelay - timeSinceLastError);

        return {
            isHealthy: this.consecutiveErrors === 0,
            consecutiveErrors: this.consecutiveErrors,
            nextRetryIn: this.lastErrorTimestamp > 0 ? nextRetryIn : 0,
            cacheSize: this.history.length,
        };
    }
}
