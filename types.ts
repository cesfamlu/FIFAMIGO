
export enum TournamentType {
    LEAGUE = 'LEAGUE', // Todos contra todos
    KNOCKOUT = 'KNOCKOUT', // Eliminatoria directa
    HYBRID = 'HYBRID' // Liga + Playoff
}

export enum MatchStatus {
    SCHEDULED = 'SCHEDULED',
    PLAYED = 'PLAYED'
}

export interface Player {
    id: string;
    name: string;
    team: string;
}

export interface Match {
    id: string;
    homePlayerId: string;
    awayPlayerId: string;
    homeScore: number | null;
    awayScore: number | null;
    status: MatchStatus;
    round: number; // For leagues: Matchday. For Knockout: 1=Final, 2=Semi, 4=Quarters, etc.
    stage: 'LEAGUE' | 'KNOCKOUT'; // To differentiate phases in Hybrid
    timestamp?: number;
    aiCommentary?: string;
    isManual?: boolean; // New flag for manually added matches
}

export interface TableRow {
    playerId: string;
    name: string;
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number; // Goals For
    ga: number; // Goals Against
    gd: number; // Goal Difference
    points: number;
}

export interface TournamentState {
    players: Player[];
    matches: Match[];
    type: TournamentType;
    doubleLeg: boolean; // Ida y vuelta
    status: 'SETUP' | 'ACTIVE' | 'FINISHED';
    currentStage: 'LEAGUE' | 'KNOCKOUT';
    winnerId?: string;
}
