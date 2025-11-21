
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trophy, Users, Swords, Table, Calendar, Settings, PlayCircle, AlertCircle, Loader2, PlusCircle, ArrowLeft, UserCog, X, Gamepad2 } from 'lucide-react';
import { Player, TournamentState, TournamentType, Match, MatchStatus } from './types';
import { PlayerForm } from './components/PlayerForm';
import { Standings } from './components/Standings';
import { MatchList } from './components/MatchList';
import { Button } from './components/Button';
import { generateLeagueFixtures, calculateStandings, generateKnockoutBracket } from './services/scheduler';
import { getTournamentPrediction } from './services/geminiService';
import { APP_NAME } from './constants';

const InitialState: TournamentState = {
    players: [],
    matches: [],
    type: TournamentType.LEAGUE,
    doubleLeg: false,
    status: 'SETUP',
    currentStage: 'LEAGUE'
};

const App: React.FC = () => {
    // Load from local storage or init
    const [tournament, setTournament] = useState<TournamentState>(() => {
        const saved = localStorage.getItem('fifa_tournament_v1');
        return saved ? JSON.parse(saved) : InitialState;
    });

    const [activeTab, setActiveTab] = useState<'STANDINGS' | 'FIXTURES'>('FIXTURES');
    const [prediction, setPrediction] = useState<string>("");
    
    // Modal States
    const [showAddMatch, setShowAddMatch] = useState(false);
    const [showManagePlayers, setShowManagePlayers] = useState(false);
    const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
    
    // New Match State
    const [newMatchHome, setNewMatchHome] = useState<string>('');
    const [newMatchAway, setNewMatchAway] = useState<string>('');

    useEffect(() => {
        localStorage.setItem('fifa_tournament_v1', JSON.stringify(tournament));
    }, [tournament]);

    // --- Actions ---

    const addPlayer = (name: string, team: string) => {
        const newPlayer: Player = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            team
        };
        setTournament(prev => ({
            ...prev,
            players: [...prev.players, newPlayer]
        }));
    };

    const updatePlayer = (id: string, name: string, team: string) => {
        setTournament(prev => ({
            ...prev,
            players: prev.players.map(p => p.id === id ? { ...p, name, team } : p)
        }));
        setEditingPlayerId(null); // Stop editing
    };

    const removePlayer = (id: string) => {
        setTournament(prev => ({
            ...prev,
            players: prev.players.filter(p => p.id !== id)
        }));
    };

    const startTournament = () => {
        if (tournament.players.length < 2) return;

        let matches: Match[] = [];
        let stage = tournament.currentStage;
        
        if (tournament.type === TournamentType.KNOCKOUT) {
            stage = 'KNOCKOUT';
            matches = generateKnockoutBracket(tournament.players, 'KNOCKOUT');
        } else {
            stage = 'LEAGUE';
            matches = generateLeagueFixtures(tournament.players, tournament.doubleLeg);
        }

        setTournament(prev => ({
            ...prev,
            status: 'ACTIVE',
            matches,
            currentStage: stage
        }));
    };

    const updateScore = (matchId: string, h: number, a: number, commentary: string) => {
        setTournament(prev => ({
            ...prev,
            matches: prev.matches.map(m => 
                m.id === matchId ? { ...m, homeScore: h, awayScore: a, status: MatchStatus.PLAYED, aiCommentary: commentary } : m
            )
        }));
    };

    const addManualMatch = () => {
        if (!newMatchHome || !newMatchAway || newMatchHome === newMatchAway) return;
        
        const newMatch: Match = {
            id: Math.random().toString(36).substr(2, 9),
            homePlayerId: newMatchHome,
            awayPlayerId: newMatchAway,
            homeScore: null,
            awayScore: null,
            status: MatchStatus.SCHEDULED,
            round: 999, // Manual round marker
            stage: tournament.currentStage,
            isManual: true
        };

        setTournament(prev => ({
            ...prev,
            matches: [...prev.matches, newMatch]
        }));
        
        setShowAddMatch(false);
        setNewMatchHome('');
        setNewMatchAway('');
    };

    const advanceToKnockout = () => {
        const table = calculateStandings(tournament.players, tournament.matches);
        const qualified = table.slice(0, 4).map(row => tournament.players.find(p => p.id === row.playerId)!);
        const validQualified = qualified.filter(Boolean);
        
        if (validQualified.length < 2) {
             alert("No hay suficientes jugadores para avanzar.");
             return;
        }

        const knockoutMatches = generateKnockoutBracket(validQualified, 'KNOCKOUT');
        
        setTournament(prev => ({
            ...prev,
            currentStage: 'KNOCKOUT',
            matches: [...prev.matches, ...knockoutMatches]
        }));
        setActiveTab('FIXTURES');
    };

    const exitToSetup = () => {
        if(confirm("¿Volver al inicio? El torneo actual se guardará, pero podrás crear uno nuevo reseteando los datos.")) {
            setTournament(InitialState);
            setPrediction("");
        }
    };

    const handlePrediction = async () => {
         const table = calculateStandings(tournament.players, tournament.matches);
         if (table.length < 2) {
             setPrediction("Datos insuficientes para predecir.");
             return;
         }
         
         setPrediction("Consultando a la IA... 🤖");
         const leader = table[0];
         const runnerUp = table[1];
         
         const result = await getTournamentPrediction(leader.name, leader.team, runnerUp.name);
         setPrediction(result);
    };

    // --- Render Logic ---

    if (tournament.status === 'SETUP') {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6 text-center">
                        <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
                        <h1 className="text-3xl font-bold text-white tracking-tight">{APP_NAME}</h1>
                        <p className="text-emerald-100 text-sm">Configura tu torneo</p>
                    </div>
                    
                    <div className="p-6 space-y-8">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Formato</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { type: TournamentType.LEAGUE, label: 'Liga', icon: Table },
                                    { type: TournamentType.KNOCKOUT, label: 'Eliminatoria', icon: Swords },
                                    { type: TournamentType.HYBRID, label: 'Híbrido', icon: Trophy }
                                ].map(opt => (
                                    <button
                                        key={opt.type}
                                        onClick={() => setTournament(prev => ({ ...prev, type: opt.type }))}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                                            tournament.type === opt.type 
                                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        <opt.icon className="w-6 h-6 mb-2" />
                                        <span className="font-medium">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {tournament.type !== TournamentType.KNOCKOUT && (
                             <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                                <input 
                                    type="checkbox" 
                                    id="doubleLeg"
                                    checked={tournament.doubleLeg}
                                    onChange={(e) => setTournament(prev => ({...prev, doubleLeg: e.target.checked}))}
                                    className="w-5 h-5 rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
                                />
                                <label htmlFor="doubleLeg" className="text-slate-300 font-medium select-none cursor-pointer">Partidos de Ida y Vuelta</label>
                             </div>
                        )}

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Jugadores ({tournament.players.length})</label>
                            </div>
                            <PlayerForm players={tournament.players} onAdd={addPlayer} onRemove={removePlayer} />
                        </div>

                        <Button 
                            onClick={startTournament} 
                            disabled={tournament.players.length < 2}
                            fullWidth 
                            className="h-12 text-lg"
                        >
                            <PlayCircle className="w-5 h-5 mr-2" /> Iniciar Torneo
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Active Tournament View ---

    const activeMatches = tournament.matches.filter(m => m.stage === tournament.currentStage);
    const standings = calculateStandings(tournament.players, tournament.matches);
    const editingPlayer = tournament.players.find(p => p.id === editingPlayerId);

    return (
        <div className="min-h-screen bg-slate-950 pb-24">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={exitToSetup} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex flex-col leading-tight">
                            <span className="font-bold text-white text-sm sm:text-base">{APP_NAME}</span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                                {tournament.currentStage === 'LEAGUE' ? 'Liga' : 'Playoffs'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="secondary" size="sm" onClick={() => setShowManagePlayers(true)} className="hidden sm:flex">
                            <Users className="w-4 h-4 mr-2" /> Jugadores
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => setShowAddMatch(true)} className="hidden sm:flex bg-emerald-600">
                            <PlusCircle className="w-4 h-4 mr-2" /> Nuevo Partido
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Floating Action Button Mobile */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:hidden">
                 <button onClick={() => setShowManagePlayers(true)} className="p-4 rounded-full bg-slate-800 border border-slate-700 text-white shadow-lg shadow-slate-900/50">
                    <Users className="w-5 h-5" />
                </button>
                <button onClick={() => setShowAddMatch(true)} className="p-4 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/50">
                    <PlusCircle className="w-6 h-6" />
                </button>
            </div>

            {/* Modals */}
            
            {/* Add Match Modal */}
            {showAddMatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 space-y-6 relative">
                        <button onClick={() => setShowAddMatch(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Gamepad2 className="w-5 h-5 text-emerald-500"/> Nuevo Partido Manual
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Local</label>
                                <select 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-white"
                                    value={newMatchHome}
                                    onChange={(e) => setNewMatchHome(e.target.value)}
                                >
                                    <option value="">Selecciona jugador</option>
                                    {tournament.players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team})</option>)}
                                </select>
                            </div>
                            <div className="flex justify-center text-slate-500 font-bold">VS</div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Visitante</label>
                                <select 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-white"
                                    value={newMatchAway}
                                    onChange={(e) => setNewMatchAway(e.target.value)}
                                >
                                    <option value="">Selecciona jugador</option>
                                    {tournament.players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.team})</option>)}
                                </select>
                            </div>
                            <Button fullWidth onClick={addManualMatch} disabled={!newMatchHome || !newMatchAway || newMatchHome === newMatchAway}>
                                Agregar al Calendario
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manage Players Modal */}
            {showManagePlayers && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 space-y-6 max-h-[80vh] overflow-y-auto relative">
                         <button onClick={() => { setShowManagePlayers(false); setEditingPlayerId(null); }} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
                         <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <UserCog className="w-5 h-5 text-blue-500"/> Gestionar Jugadores
                        </h3>
                        
                        {editingPlayerId ? (
                             <PlayerForm 
                                players={[]} 
                                onAdd={() => {}} 
                                onRemove={() => {}}
                                onUpdate={updatePlayer}
                                editingPlayer={editingPlayer}
                                onCancelEdit={() => setEditingPlayerId(null)}
                             />
                        ) : (
                            <div className="space-y-3">
                                {tournament.players.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                                {p.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{p.name}</div>
                                                <div className="text-xs text-slate-400">{p.team}</div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setEditingPlayerId(p.id)}>
                                            Editar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                
                {/* Header Status */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {tournament.currentStage === 'LEAGUE' ? 'Fase de Liga' : 'Fase Eliminatoria'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {tournament.players.length} Jugadores • {tournament.type === TournamentType.HYBRID ? 'Híbrido' : tournament.type}
                        </p>
                    </div>
                    
                    {tournament.type === TournamentType.HYBRID && tournament.currentStage === 'LEAGUE' && (
                        <Button onClick={advanceToKnockout} className="bg-blue-600 hover:bg-blue-700">
                            Finalizar Liga e Ir a Playoffs
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800 w-full sm:w-fit">
                    <button
                        onClick={() => setActiveTab('FIXTURES')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'FIXTURES' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" /> Partidos
                        </div>
                    </button>
                    {tournament.type !== TournamentType.KNOCKOUT && tournament.currentStage === 'LEAGUE' && (
                        <button
                            onClick={() => setActiveTab('STANDINGS')}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'STANDINGS' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Table className="w-4 h-4" /> Clasificación
                            </div>
                        </button>
                    )}
                </div>

                {/* AI Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="w-32 h-32 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">AI Analyst</span>
                            <h3 className="text-slate-200 font-semibold text-sm">Resumen del Torneo</h3>
                        </div>
                        {prediction ? (
                             <p className="text-slate-300 text-sm italic">"{prediction}"</p>
                        ) : (
                             <div className="flex items-center gap-3">
                                <p className="text-slate-500 text-xs">Genera una predicción basada en los resultados actuales.</p>
                                <Button variant="ghost" size="sm" onClick={handlePrediction} className="text-xs h-7 bg-slate-700 hover:bg-slate-600">
                                    Analizar Ahora
                                </Button>
                             </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {activeTab === 'STANDINGS' && tournament.type !== TournamentType.KNOCKOUT ? (
                    <Standings table={standings} />
                ) : (
                    <MatchList 
                        matches={activeMatches} 
                        players={tournament.players} 
                        onUpdateScore={updateScore}
                    />
                )}

                {activeMatches.length === 0 && (
                    <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                        <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500">No hay partidos programados para esta fase.</p>
                    </div>
                )}

            </main>
        </div>
    );
};

export default App;