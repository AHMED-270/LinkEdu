import { CheckCircle2, XCircle, Eye, Pencil, Trash2 } from 'lucide-react';

export default function PaiementTable({
  rows,
  months,
  loading,
  busyKey,
  onToggle,
  onView,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {[...Array(6)].map((_, index) => (
            <div key={`payment-skeleton-${index}`} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700">Aucun eleve trouve</h3>
        <p className="mt-2 text-sm text-gray-500">
          Essayez un autre filtre de classe, une autre recherche, ou ajoutez des eleves.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Nom
              </th>
              {months.map((month) => (
                <th
                  key={month.value}
                  className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
                  title={month.name}
                >
                  {month.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id_etudiant} className="hover:bg-blue-50/30 transition-colors">
                <td className="sticky left-0 z-[1] bg-white px-4 py-3 align-top">
                  <p className="text-sm font-semibold text-gray-900">{row.nom} {row.prenom}</p>
                  <p className="text-xs text-gray-500">{row.classe || 'Sans classe'}</p>
                </td>

                {months.map((month) => {
                  const payment = row.paiements?.[String(month.value)] ?? null;
                  const isPaid = payment?.statut === 'paye';
                  const cellKey = `${row.id_etudiant}-${month.value}`;
                  const isBusy = busyKey === cellKey;

                  return (
                    <td key={cellKey} className="px-2 py-3 text-center align-top">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onToggle(row, month.value, payment)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          } ${isBusy ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {isPaid ? 'Paye' : 'Non paye'}
                        </button>

                        {payment && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onView(row, month.value, payment)}
                              className="rounded-md p-1 text-slate-600 hover:bg-slate-100"
                              title="Consulter"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEdit(row, month.value, payment)}
                              className="rounded-md p-1 text-blue-600 hover:bg-blue-50"
                              title="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(row, month.value, payment)}
                              className="rounded-md p-1 text-red-600 hover:bg-red-50"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
