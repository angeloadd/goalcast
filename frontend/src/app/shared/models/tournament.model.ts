export interface TournamentStatus {
    currentStage: string;
    matchesPlayed: number;
    totalMatches: number;
    teamsRemaining: number;
    nextPhase: string;
    daysUntilNextPhase: number;
}
