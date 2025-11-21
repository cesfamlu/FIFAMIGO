import { Match, MatchStatus, Player, TournamentType, TableRow } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate unique IDs if uuid package not available, 
// but here we assume standard logic. Using simple random for demo.
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateLeagueFixtures = (players: Player[], doubleLeg: boolean): Match[] => {
    const matches: Match[] = [];
    const n = players.length;
    // Berger tables algorithm for Round Robin
    // If odd number of players, add a dummy 'bye' player (handled logically by skipping matches with null)
    
    const teamIds = players.map(p => p.id);
    if (n % 2 !== 0) {
        teamIds.push('BYE'); // Placeholder
    }
    
    const numTeams = teamIds.length;
    const rounds = numTeams - 1;
    const half = numTeams / 2;

    const teamsCopy = [...teamIds];
    teamsCopy.splice(0, 1); // Remove first team, it stays fixed

    for (let round = 0; round < rounds; round++) {
        const roundMatches: Match[] = [];
        
        // First team index 0 vs Team at index [round % (numTeams-1)] of the rotating array? 
        // Standard Berger logic implementation:
        
        const roundPairings = [];
        const teamIdx = round % (numTeams - 1);
        
        // Fix the first team
        const firstTeam = teamIds[0];
        const lastTeam = teamsCopy[teamsCopy.length - 1 - round];
        
        roundPairings.push({ home: firstTeam, away: lastTeam });

        for (let i = 1; i < half; i++) {
            const homeIdx = (numTeams - 1 - round + i) % (numTeams - 1); 
            // This manual index math is error prone, let's use the rotating array method directly
        }
    }
    
    // Simpler Rotating Array Method
    const workingIds = [...teamIds]; 
    // If we added a BYE, workingIds has even length
    
    for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < workingIds.length / 2; i++) {
            const t1 = workingIds[i];
            const t2 = workingIds[workingIds.length - 1 - i];

            if (t1 !== 'BYE' && t2 !== 'BYE') {
                matches.push({
                    id: generateId(),
                    homePlayerId: t1,
                    awayPlayerId: t2,
                    homeScore: null,
                    awayScore: null,
                    status: MatchStatus.SCHEDULED,
                    round: r + 1,
                    stage: 'LEAGUE'
                });
            }
        }
        // Rotate the array, keeping index 0 fixed
        workingIds.splice(1, 0, workingIds.pop()!);
    }

    if (doubleLeg) {
        // Duplicate matches reversed for second leg
        const secondLegMatches = matches.map(m => ({
            ...m,
            id: generateId(),
            homePlayerId: m.awayPlayerId,
            awayPlayerId: m.homePlayerId,
            homeScore: null,
            awayScore: null,
            round: m.round + rounds // Rounds continue incrementally
        }));
        return [...matches, ...secondLegMatches];
    }

    return matches;
};

export const generateKnockoutBracket = (players: Player[], stageName: 'KNOCKOUT' = 'KNOCKOUT'): Match[] => {
    // Assume players are already seeded or sorted by rank if coming from league
    const n = players.length;
    // We need power of 2 (2, 4, 8, 16, 32)
    let size = 2;
    while (size < n) size *= 2;

    // Create matches for the first round (Round of [size])
    // e.g., if size is 4, round is 2 (Semi-Finals). round number represents "Players remaining"
    
    const matches: Match[] = [];
    
    // Pairing strategy: Best vs Worst (1 vs 8, 2 vs 7...) if sorted
    // Simple pairing: 0 vs 1, 2 vs 3...
    
    // We fill with BYEs if needed
    const seedIds = players.map(p => p.id);
    while (seedIds.length < size) {
        seedIds.push('BYE');
    }

    // Standard bracket pairing (1 vs N, 2 vs N-1) usually used for seeded tourneys
    // Let's do simple adjacent pairing for this app to keep UI simple unless seeded
    // 1 vs Size, 2 vs Size-1
    
    // Correct seeding order for visual brackets usually requires specific permutations
    // For this app, let's assume input players are ranked 1 to N
    const pairCount = size / 2;
    
    // Helper to pair 1vs8, 2vs7 etc logic
    const pairings: [string, string][] = [];
    for(let i=0; i<pairCount; i++) {
        pairings.push([seedIds[i], seedIds[size - 1 - i]]);
    }

    pairings.forEach(pair => {
        const [p1, p2] = pair;
        if (p2 === 'BYE') {
            // Auto win for p1, but in our structure, we might just push them to next round immediately?
            // For simplicity, we'll create a 'played' match or handle BYEs in UI.
            // Let's create a match where P2 is null/bye.
            // Actually, standardizing: Create match. If 'BYE', auto-resolve in controller.
        }
        matches.push({
            id: generateId(),
            homePlayerId: p1,
            awayPlayerId: p2,
            homeScore: p2 === 'BYE' ? 3 : null, // Auto win logic
            awayScore: p2 === 'BYE' ? 0 : null,
            status: p2 === 'BYE' ? MatchStatus.PLAYED : MatchStatus.SCHEDULED,
            round: size, // e.g. 8 = Quarter finals, 4 = Semis, 2 = Final
            stage: stageName
        });
    });

    return matches;
};

export const calculateStandings = (players: Player[], matches: Match[]): TableRow[] => {
    const stats: Record<string, TableRow> = {};

    players.forEach(p => {
        stats[p.id] = {
            playerId: p.id,
            name: p.name,
            team: p.team,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            gf: 0,
            ga: 0,
            gd: 0,
            points: 0
        };
    });

    matches.filter(m => m.status === MatchStatus.PLAYED && m.stage === 'LEAGUE').forEach(m => {
        if (m.homeScore === null || m.awayScore === null) return;
        
        const home = stats[m.homePlayerId];
        const away = stats[m.awayPlayerId];

        if (!home || !away) return; // Should not happen

        home.played++;
        away.played++;
        home.gf += m.homeScore;
        away.gf += m.awayScore;
        home.ga += m.awayScore;
        away.ga += m.homeScore;

        if (m.homeScore > m.awayScore) {
            home.won++;
            home.points += 3;
            away.lost++;
        } else if (m.homeScore < m.awayScore) {
            away.won++;
            away.points += 3;
            home.lost++;
        } else {
            home.drawn++;
            away.drawn++;
            home.points += 1;
            away.points += 1;
        }
    });

    return Object.values(stats).map(s => ({
        ...s,
        gd: s.gf - s.ga
    })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
};