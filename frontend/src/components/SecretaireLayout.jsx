import Header from './Header';
import SecretaireSidebar from './SecretaireSidebar';

export default function SecretaireLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, marginTop: '64px' }}>
        <SecretaireSidebar />
        <main style={{ flex: 1, marginLeft: '260px', padding: '32px 40px', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
