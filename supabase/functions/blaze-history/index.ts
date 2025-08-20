import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlazeHistoryEntry {
  id: string;
  number: number;
  color: 'red' | 'black' | 'white';
  timestamp: number;
}

function getNumberColor(number: number): 'red' | 'black' | 'white' {
  if (number === 0) return 'white';
  if (number >= 1 && number <= 7) return 'red';
  return 'black';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const blazeApiUrl = `https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/history/1?startDate=${today}`;
    
    const response = await fetch(blazeApiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
      }
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${responseText}`);
    }

    const data = await response.json();
    
    let gamesList: any[] = [];

    if (Array.isArray(data)) {
      gamesList = data;
    } else if (data.records && Array.isArray(data.records)) {
      gamesList = data.records;
    } else if (data.data && Array.isArray(data.data)) {
      gamesList = data.data;
    } else if (data.games && Array.isArray(data.games)) {
      gamesList = data.games;
    } else if (data.results && Array.isArray(data.results)) {
      gamesList = data.results;
    }

    if (gamesList.length === 0) {
      throw new Error('Invalid API response format: games array not found');
    }

    const history: BlazeHistoryEntry[] = gamesList.map((game: any, index: number) => {
      const number = game.roll ?? game.number ?? game.result ?? game.value ?? 0;
      return {
        id: game.id?.toString() || `game_${Date.now()}_${index}`,
        number: number,
        color: getNumberColor(number),
        timestamp: new Date(game.created_at || game.timestamp || game.date || Date.now()).getTime()
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: history,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Failed to fetch real data from Blaze API'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});