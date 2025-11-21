
import React, { useState } from 'react';
import { Match, MatchStatus, Player } from '../types';
import { Button } from './Button';
import { Edit2, Check, Bot, UserPlus } from 'lucide-react';
import { getMatchCommentary } from '../services/geminiService';

interface MatchListProps {
    matches: Match[];
    players: Player[];
    onUpdateScore: (matchId: string, h: number, a: number, commentary: string) => void;
    currentRound?: number;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, players, onUpdateScore, currentRound }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempH, setTempH] = useState<string>('');
    const [tempA, setTempA] = useState<string>('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const getPlayer = (id: string) => players.find(p => p.id === id);

    const handleSave = async (match: Match) => {
        const h = parseInt(tempH);
        const a = parseInt(tempA);
        if (isNaN(h) || isNaN(a)) return;

        const homeP = getPlayer(match.homePlayerId);
        const awayP = getPlayer(match.awayPlayerId);
        
        let commentary = "";
        if (homeP && awayP) {
             setIsGeneratingAI(true);
             commentary = await getMatchCommentary({ ...match, homeScore: h, awayScore: a }, homeP, awayP);
             setIsGeneratingAI(false);
        }

        onUpdateScore(match.id, h, a, commentary);
        setEditingId(null);
    };

    const startEdit = (match: Match) => {
        setEditingId(match.id);
        setTempH(match.homeScore?.toString() ?? '');
        setTempA(match.awayScore?.toString() ?? '');
    };

    // Group by round
    const matchesByRound = matches.reduce((acc, match) => {
        const r = match.round;
        if (!acc[r]) acc[r] = [];
        acc[r].push(match);
        return acc;
    }, {} as Record<number, Match[]>);

    const sortedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

    return (
        <div className="space-y-8">
            {sortedRounds.map(round => {
                // Check if round contains manual matches
                const isManualRound = matchesByRound[round].some(m => m.isManual);
                
                return (
                    <div key={round} className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2 mb-4 flex justify-between items-center">
                           <span>{isManualRound ? 'Partidos Extra' : matchRoundName(round, matches[0].stage)}</span>
                           {isManualRound && <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">Manual</span>}
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {matchesByRound[round].map(match => {
                                const home = getPlayer(match.homePlayerId);
                                const away = getPlayer(match.awayPlayerId);
                                const isEditing = editingId === match.id;

                                if (!home || !away) return null; // Bye rounds or error

                                return (
                                    <div key={match.id} className={`rounded-lg border p-4 flex flex-col gap-3 shadow-sm relative ${match.isManual ? 'bg-slate-900/80 border-slate-700 border-dashed' : 'bg-slate-800 border-slate-700'}`}>
                                        {match.isManual && (
                                            <div className="absolute top-2 right-2">
                                                <UserPlus className="w-3 h-3 text-slate-600" />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between gap-2">
                                            {/* Home Team */}
                                            <div className="flex-1 flex flex-col items-start overflow-hidden">
                                                <span className="font-semibold text-white truncate w-full">{home.name}</span>
                                                <span className="text-xs text-slate-400 truncate w-full">{home.team}</span>
                                            </div>

                                            {/* Score Area */}
                                            <div className="flex items-center gap-3 min-w-[120px] justify-center bg-slate-950/30 px-3 py-2 rounded-md border border-slate-700/50">
                                                {isEditing ? (
                                                    <>
                                                        <input type="number" className="w-10 bg-slate-700 text-center rounded border-none text-white focus:ring-1 focus:ring-emerald-500" value={tempH} onChange={e => setTempH(e.target.value)} />
                                                        <span className="text-slate-500">-</span>
                                                        <input type="number" className="w-10 bg-slate-700 text-center rounded border-none text-white focus:ring-1 focus:ring-emerald-500" value={tempA} onChange={e => setTempA(e.target.value)} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`text-xl font-bold ${match.status === MatchStatus.PLAYED ? 'text-white' : 'text-slate-600'}`}>
                                                            {match.homeScore ?? '-'}
                                                        </span>
                                                        <span className="text-slate-600 text-sm">vs</span>
                                                        <span className={`text-xl font-bold ${match.status === MatchStatus.PLAYED ? 'text-white' : 'text-slate-600'}`}>
                                                            {match.awayScore ?? '-'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Away Team */}
                                            <div className="flex-1 flex flex-col items-end overflow-hidden text-right">
                                                <span className="font-semibold text-white truncate w-full">{away.name}</span>
                                                <span className="text-xs text-slate-400 truncate w-full">{away.team}</span>
                                            </div>
                                        </div>

                                        {/* Actions & AI Commentary */}
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 min-h-[24px]">
                                            <div className="flex-1">
                                                {match.aiCommentary && match.status === MatchStatus.PLAYED && (
                                                    <p className="text-xs text-emerald-400/90 italic flex gap-1.5 items-start animate-in fade-in">
                                                        <Bot className="w-3 h-3 mt-0.5 shrink-0" />
                                                        "{match.aiCommentary}"
                                                    </p>
                                                )}
                                            </div>
                                            <div className="ml-2">
                                                {isEditing ? (
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="p-1 h-8 w-8 rounded-full hover:bg-slate-700">
                                                            <span className="text-xs">✕</span>
                                                        </Button>
                                                        <Button variant="primary" size="sm" onClick={() => handleSave(match)} disabled={isGeneratingAI} className="p-1 h-8 w-8 rounded-full bg-emerald-600">
                                                            {isGeneratingAI ? <span className="animate-spin">⟳</span> : <Check className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => startEdit(match)} className="text-slate-500 hover:text-white transition-colors p-1.5 hover:bg-slate-700/50 rounded">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

function matchRoundName(round: number, stage: 'LEAGUE' | 'KNOCKOUT') {
    if (stage === 'LEAGUE') return `Jornada ${round}`;
    
    if (round === 2) return "Final";
    if (round === 4) return "Semifinales";
    if (round === 8) return "Cuartos de Final";
    if (round === 16) return "Octavos de Final";
    if (round > 1000) return "Partidos Extra"; // Fallback for high manual rounds
    return `Ronda de ${round}`;
}
