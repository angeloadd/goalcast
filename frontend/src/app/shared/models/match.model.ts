export interface Scorer {
    id: string;
    name: string;
    team: string;
    number: number;
}

export interface ScorerValue {
    type: 'player' | 'own_goal' | 'no_goal' | null;
    playerId?: string;
}

export type MatchPhase = 'group' | 'round16' | 'quarter' | 'semi' | 'final';
export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeFlag: string;
    awayFlag: string;
    date: string;
    time: string;
    homeScore?: number;
    awayScore?: number;
    stage: string;
    phase: MatchPhase;
    status: MatchStatus;
    predictionsEnabled: boolean;
    homePlayers?: Scorer[];
    awayPlayers?: Scorer[];
}

export function isKnockoutPhase(phase: MatchPhase): boolean {
    return phase !== 'group';
}

export function getPhaseLabel(phase: MatchPhase): string {
    const labels: Record<MatchPhase, string> = {
        group: 'Group Stage',
        round16: 'Round of 16',
        quarter: 'Quarter Final',
        semi: 'Semi Final',
        final: 'Final',
    };
    return labels[phase];
}
