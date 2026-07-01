import { supabase } from "@/lib/supabase";

export type LeaderboardRow = {
  player_id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  ties: number;
  games_played: number;
  updated_at?: string;
};

export type MatchOutcome = 1 | 0.5 | 0;

export async function ensureAnonSession(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) return sessionData.session.user.id;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    console.error("[leaderboard] anonymous sign-in failed:", error);
    throw error ?? new Error("Anonymous sign-in failed");
  }
  return data.user.id;
}

export async function getOrCreateProfile(username: string): Promise<LeaderboardRow> {
  const playerId = await ensureAnonSession();
  const { data: existing, error: selectError } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();
  if (selectError) {
    console.error("[leaderboard] failed to look up existing profile:", selectError);
    throw selectError;
  }

  if (existing) {
    if (existing.username !== username) {
      const { error: updateError } = await supabase.from("leaderboard").update({ username }).eq("player_id", playerId);
      if (updateError) console.error("[leaderboard] failed to update username:", updateError);
      return { ...existing, username } as LeaderboardRow;
    }
    return existing as LeaderboardRow;
  }

  const fresh: LeaderboardRow = {
    player_id: playerId,
    username,
    rating: 1000,
    wins: 0,
    losses: 0,
    ties: 0,
    games_played: 0,
  };
  const { data: inserted, error } = await supabase.from("leaderboard").insert(fresh).select().single();
  if (error) {
    console.error("[leaderboard] failed to create profile:", error);
    throw error;
  }
  return inserted as LeaderboardRow;
}

export function computeElo(myRating: number, oppRating: number, result: MatchOutcome, k = 32): number {
  const expected = 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
  return Math.round(myRating + k * (result - expected));
}

export async function recordMatchResult(
  playerId: string,
  myRating: number,
  oppRating: number,
  result: MatchOutcome,
): Promise<number> {
  const newRating = computeElo(myRating, oppRating, result);
  const { data: current, error: selectError } = await supabase
    .from("leaderboard")
    .select("wins, losses, ties, games_played")
    .eq("player_id", playerId)
    .maybeSingle();
  if (selectError) {
    console.error("[leaderboard] failed to read current stats before recording result:", selectError);
    throw selectError;
  }

  const wins = (current?.wins ?? 0) + (result === 1 ? 1 : 0);
  const losses = (current?.losses ?? 0) + (result === 0 ? 1 : 0);
  const ties = (current?.ties ?? 0) + (result === 0.5 ? 1 : 0);
  const games_played = (current?.games_played ?? 0) + 1;

  const { error: updateError, count } = await supabase
    .from("leaderboard")
    .update(
      { rating: newRating, wins, losses, ties, games_played, updated_at: new Date().toISOString() },
      { count: "exact" },
    )
    .eq("player_id", playerId);
  if (updateError) {
    console.error("[leaderboard] failed to write match result:", updateError);
    throw updateError;
  }
  if (!count) {
    // The update matched zero rows — the profile row was never actually
    // created (getOrCreateProfile must have failed earlier and been
    // swallowed), so there is nothing to update. Surface this loudly
    // instead of pretending the result was recorded.
    console.error("[leaderboard] no profile row found for player_id, result was not recorded:", playerId);
    throw new Error("No leaderboard profile to update");
  }

  return newRating;
}

export async function fetchTopPlayers(limit = 50): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rating", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[leaderboard] failed to fetch top players:", error);
    throw error;
  }
  return (data ?? []) as LeaderboardRow[];
}
