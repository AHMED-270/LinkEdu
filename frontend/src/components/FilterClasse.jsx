import { Search, Filter, CalendarDays } from 'lucide-react';

export default function FilterClasse({
  classes,
  classValue,
  onClassChange,
  searchValue,
  onSearchChange,
  annee,
  onAnneeChange,
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Rechercher un eleve..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="relative">
        <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <select
          value={classValue}
          onChange={(event) => onClassChange(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">Toutes les classes</option>
          {classes.map((classe) => (
            <option key={classe.id_classe} value={String(classe.id_classe)}>
              {classe.label || `${classe.nom || ''} - ${classe.niveau || ''}`.trim()}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="number"
          min="2000"
          max="2100"
          value={annee}
          onChange={(event) => onAnneeChange(event.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-gray-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
    </div>
  );
}
