import React from 'react';
import { TableRow } from '../types';
import { Trophy } from 'lucide-react';

interface StandingsProps {
    table: TableRow[];
}

export const Standings: React.FC<StandingsProps> = ({ table }) => {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 shadow-xl">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-900/80 uppercase tracking-wider text-xs font-semibold text-slate-400">
                        <tr>
                            <th className="px-4 py-3 text-center w-12">#</th>
                            <th className="px-4 py-3">Jugador / Equipo</th>
                            <th className="px-4 py-3 text-center">PJ</th>
                            <th className="px-4 py-3 text-center">G</th>
                            <th className="px-4 py-3 text-center">E</th>
                            <th className="px-4 py-3 text-center">P</th>
                            <th className="px-4 py-3 text-center hidden sm:table-cell">GF</th>
                            <th className="px-4 py-3 text-center hidden sm:table-cell">GC</th>
                            <th className="px-4 py-3 text-center">DG</th>
                            <th className="px-4 py-3 text-center text-emerald-400">PTS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {table.map((row, index) => (
                            <tr key={row.playerId} className={`hover:bg-slate-700/30 transition-colors ${index < 4 ? 'bg-emerald-900/10' : ''}`}>
                                <td className="px-4 py-3 text-center font-mono text-slate-500">
                                    {index === 0 ? <Trophy className="h-4 w-4 text-yellow-400 mx-auto" /> : index + 1}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-white">{row.name}</div>
                                    <div className="text-xs text-slate-400">{row.team}</div>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-300">{row.played}</td>
                                <td className="px-4 py-3 text-center text-slate-400">{row.won}</td>
                                <td className="px-4 py-3 text-center text-slate-400">{row.drawn}</td>
                                <td className="px-4 py-3 text-center text-slate-400">{row.lost}</td>
                                <td className="px-4 py-3 text-center hidden sm:table-cell text-slate-500">{row.gf}</td>
                                <td className="px-4 py-3 text-center hidden sm:table-cell text-slate-500">{row.ga}</td>
                                <td className="px-4 py-3 text-center font-mono text-slate-300">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                                <td className="px-4 py-3 text-center font-bold text-emerald-400 text-base">{row.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};