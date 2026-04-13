import { useMemo, useState } from 'react';
import { FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';

const INITIAL_MATIERES = [
  { id: 1, nom: 'Mathematiques', niveau: 'college', coefficient: 2 },
  { id: 2, nom: 'Physique', niveau: 'lycee', coefficient: 2 },
  { id: 3, nom: 'Francais', niveau: 'primaire', coefficient: 1 },
];

export default function AdminMatieres() {
  const [matieres, setMatieres] = useState(INITIAL_MATIERES);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ nom: '', niveau: 'college', coefficient: 1 });

  const filteredMatieres = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return matieres;

    return matieres.filter((item) => {
      return (
        item.nom.toLowerCase().includes(term) ||
        item.niveau.toLowerCase().includes(term)
      );
    });
  }, [matieres, searchTerm]);

  const addMatiere = (event) => {
    event.preventDefault();

    const nom = formData.nom.trim();
    const coefficient = Number(formData.coefficient);
    if (!nom || !Number.isFinite(coefficient)) return;

    setMatieres((prev) => [
      {
        id: Date.now(),
        nom,
        niveau: formData.niveau,
        coefficient,
      },
      ...prev,
    ]);

    setFormData((prev) => ({ ...prev, nom: '', coefficient: 1 }));
  };

  const removeMatiere = (id) => {
    setMatieres((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section style={{ padding: '16px' }}>
      <h2 style={{ marginTop: 0 }}>Gestion des Matieres</h2>

      <form onSubmit={addMatiere} style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px' }}>
          <input
            type="text"
            placeholder="Nom de la matiere"
            value={formData.nom}
            onChange={(event) => setFormData((prev) => ({ ...prev, nom: event.target.value }))}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
            required
          />
          <select
            value={formData.niveau}
            onChange={(event) => setFormData((prev) => ({ ...prev, niveau: event.target.value }))}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          >
            <option value="maternelle">Maternelle</option>
            <option value="primaire">Primaire</option>
            <option value="college">College</option>
            <option value="lycee">Lycee</option>
          </select>
          <input
            type="number"
            min="0"
            max="10"
            value={formData.coefficient}
            onChange={(event) => setFormData((prev) => ({ ...prev, coefficient: event.target.value }))}
            style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
          <button
            type="submit"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            <FiPlus /> Ajouter
          </button>
        </div>
      </form>

      <div style={{ marginBottom: '12px', position: 'relative', maxWidth: '320px' }}>
        <FiSearch style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Matiere</th>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Niveau</th>
              <th style={{ textAlign: 'left', padding: '10px 12px' }}>Coefficient</th>
              <th style={{ textAlign: 'right', padding: '10px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatieres.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px' }}>{item.nom}</td>
                <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{item.niveau}</td>
                <td style={{ padding: '10px 12px' }}>{item.coefficient}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => removeMatiere(item.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
                  >
                    <FiTrash2 /> Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {filteredMatieres.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '14px 12px', color: '#64748b' }}>
                  Aucune matiere.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}