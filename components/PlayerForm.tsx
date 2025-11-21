
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Shield, Save, X } from 'lucide-react';
import { Player } from '../types';
import { Button } from './Button';
import { MOCK_TEAMS } from '../constants';

interface PlayerFormProps {
    players: Player[];
    onAdd: (name: string, team: string) => void;
    onRemove: (id: string) => void;
    onUpdate?: (id: string, name: string, team: string) => void;
    editingPlayer?: Player | null;
    onCancelEdit?: () => void;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ 
    players, 
    onAdd, 
    onRemove, 
    onUpdate, 
    editingPlayer, 
    onCancelEdit 
}) => {
    const [name, setName] = useState('');
    const [team, setTeam] = useState('');

    // Load data when editingPlayer changes
    useEffect(() => {
        if (editingPlayer) {
            setName(editingPlayer.name);
            setTeam(editingPlayer.team);
        } else {
            setName('');
            setTeam('');
        }
    }, [editingPlayer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && team.trim()) {
            if (editingPlayer && onUpdate) {
                onUpdate(editingPlayer.id, name, team);
            } else {
                onAdd(name, team);
            }
            // Only clear if not editing (parent handles closing edit mode)
            if (!editingPlayer) {
                setName('');
                setTeam('');
            }
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Jugador</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full pl-10 bg-slate-900 border border-slate-700 rounded-md py-2 text-sm text-white placeholder-slate-500 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Nombre / Nickname"
                            autoFocus={!!editingPlayer}
                        />
                    </div>
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Equipo FIFA</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Shield className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            value={team}
                            onChange={(e) => setTeam(e.target.value)}
                            list="teams-suggestions"
                            className="block w-full pl-10 bg-slate-900 border border-slate-700 rounded-md py-2 text-sm text-white placeholder-slate-500 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Ej. Real Madrid"
                        />
                        <datalist id="teams-suggestions">
                            {MOCK_TEAMS.map(t => <option key={t} value={t} />)}
                        </datalist>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                     {editingPlayer && onCancelEdit && (
                        <Button type="button" variant="ghost" onClick={onCancelEdit} className="flex-1 sm:flex-none">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                    <Button type="submit" disabled={!name || !team} className="flex-1 sm:flex-none min-w-[100px]">
                        {editingPlayer ? <><Save className="h-4 w-4 mr-2" /> Guardar</> : <><Plus className="h-4 w-4 mr-2" /> Agregar</>}
                    </Button>
                </div>
            </form>

            {!editingPlayer && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {players.map(player => (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                                    {player.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">{player.name}</p>
                                    <p className="text-xs text-slate-400">{player.team}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onRemove(player.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {players.length === 0 && (
                        <div className="col-span-full text-center py-8 text-slate-500 text-sm italic bg-slate-900/50 rounded-lg border border-dashed border-slate-800">
                            No hay jugadores registrados. Agrega al menos 2.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
