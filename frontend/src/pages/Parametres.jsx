import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Parametres.css';

export default function Parametres() {
  const { user, updateAuthenticatedUser } = useAuth();

  const initialName = useMemo(() => {
    if (user?.name) return user.name;
    const first = user?.prenom || '';
    const last = user?.nom || '';
    return `${first} ${last}`.trim();
  }, [user]);

  const [name, setName] = useState(initialName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    const prenom = parts.slice(0, -1).join(' ') || (parts[0] || '');
    const nom = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || '');

    updateAuthenticatedUser({
      name: trimmedName,
      email: email.trim(),
      prenom,
      nom,
    });

    setMessage('Parametres enregistres avec succes.');
  };

  return (
    <div className="dashboard-content" style={{ maxWidth: '760px' }}>
      <div className="card-panel" style={{ padding: '20px' }}>
        <h2 style={{ marginTop: 0 }}>Parametres du profil</h2>
        <p style={{ color: '#64748b', marginBottom: '16px' }}>
          Modifiez vos informations personnelles.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label htmlFor="profile-name" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nom complet</label>
              <input
                id="profile-name"
                className="form-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="profile-email" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Email</label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '16px',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 16px',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Enregistrer
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '12px', color: '#166534', fontWeight: 600 }}>{message}</p>
        )}
      </div>
    </div>
  );
}