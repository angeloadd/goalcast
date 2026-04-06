export interface Player {
    id: string;
    name: string;
    points: number;
    correctPredictions: number;
    totalPredictions: number;
}

export interface Winner {
    year: number;
    name: string;
    points: number;
    worldCupWinner: string;
}
