// ProblemList komponenta - Lista problema sa filterima

'use client';

import { useMemo, useState } from 'react';
import { MARKER_COLORS, STATUS_LABELS, PRIORITY_LABELS } from '@/utils/constants';

export default function ProblemList({ problems = [], onProblemClick, onEditProblem, onDeleteProblem, onStatusFilterChange }) {
  const [filter, setFilter] = useState('svi');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtriranje problema
  const filteredProblems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return problems.filter((problem) => {
      const matchesFilter = filter === "svi" || problem.status === filter;
      const matchesSearch =
        (problem.title || "").toLowerCase().includes(term) ||
        (problem.description || "").toLowerCase().includes(term) ||
        (problem.problemType || "").toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [problems, filter, searchTerm]);

  function applyFilter(next) {
    setFilter(next);
    onStatusFilterChange?.(next); // ✅ sync with map
  }

  // Statistika
  const stats = {
    total: problems.length,
    primeceno: problems.filter(p => p.status === 'primeceno').length,
    prijavljeno: problems.filter(p => p.status === 'prijavljeno').length,
    reseno: problems.filter(p => p.status === 'reseno').length,
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Lista problema</h2>

      {/* Statistika */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-blue-100 p-2 rounded text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-600">Ukupno</div>
        </div>
        <div className="bg-red-100 p-2 rounded text-center">
          <div className="text-2xl font-bold">{stats.primeceno}</div>
          <div className="text-xs text-gray-600">Primećeno</div>
        </div>
        <div className="bg-orange-100 p-2 rounded text-center">
          <div className="text-2xl font-bold">{stats.prijavljeno}</div>
          <div className="text-xs text-gray-600">Prijavljeno</div>
        </div>
        <div className="bg-green-100 p-2 rounded text-center">
          <div className="text-2xl font-bold">{stats.reseno}</div>
          <div className="text-xs text-gray-600">Rešeno</div>
        </div>
      </div>

      {/* Pretraga */}
      <input
        type="text"
        placeholder="Pretraži probleme..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Filter */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => applyFilter('svi')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'svi' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Svi
        </button>
        <button
          onClick={() => applyFilter('primeceno')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'primeceno' ? 'bg-red-600 text-white' : 'bg-gray-200'
          }`}
        >
          Primećeno
        </button>
        <button
          onClick={() => applyFilter('prijavljeno')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'prijavljeno' ? 'bg-orange-600 text-white' : 'bg-gray-200'
          }`}
        >
          Prijavljeno
        </button>
        <button
          onClick={() => applyFilter('reseno')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'reseno' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}
        >
          Rešeno
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredProblems.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nema problema</p>
        ) : (
          filteredProblems.map((problem) => (
            <div
              key={problem.id}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition"
              onClick={() => onProblemClick(problem)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm">{problem.title}</h3>
                <span
                  className="px-2 py-1 rounded text-xs font-semibold text-white"
                  style={{ backgroundColor: MARKER_COLORS[problem.status] }}
                >
                  {STATUS_LABELS[problem.status]}
                </span>
              </div>
              
              <p className="text-xs text-gray-600 mb-2">{problem.problemType}</p>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">
                  Prioritet: {PRIORITY_LABELS[problem.priority]}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditProblem(problem);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Izmeni
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Da li ste sigurni da želite da obrišete ovaj problem?')) {
                        onDeleteProblem(problem.id);
                      }
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}