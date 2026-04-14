import { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { Inbox } from 'lucide-react';
import './Annonces.css';

export default function Annonces() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true);
      try {
        const res = await axios.get(apiBaseUrl + '/api/professeur/annonces', {
          withCredentials: true,
          withXSRFToken: true,
        });
        setAnnonces(res.data?.announcements || []);
      } catch (error) {
        console.error(error);
        setAnnonces([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const fileSafe = (text) => String(text || 'annonce').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 45);

  const downloadBlob = (content, type, fileName) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const buildWordTemplate = (annonce) => {
    const dateText = formatDate(annonce.raw_date);
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${annonce.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 36px; color: #111; }
            .header { border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 24px; }
            .school { font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
            .subtitle { font-size: 12px; color: #444; margin-top: 4px; }
            .meta { margin-top: 10px; font-size: 12px; color: #333; }
            .title { font-size: 24px; font-weight: 700; margin: 10px 0 14px; }
            .content { font-size: 14px; line-height: 1.65; white-space: pre-wrap; }
            .photo { margin-top: 18px; }
            .photo img { max-width: 520px; border: 1px solid #ddd; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school">LinkedU - Document Scolaire Officiel</div>
            <div class="subtitle">Service de communication interne</div>
            <div class="meta">Auteur: ${annonce.author || 'Inconnu'} | Date: ${dateText}</div>
          </div>
          <div class="title">${annonce.title || ''}</div>
          <div class="content">${(annonce.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          ${annonce.photo_url ? `<div class="photo"><img src="${annonce.photo_url}" alt="Photo annonce" /></div>` : ''}
        </body>
      </html>
    `;
  };

  const downloadAnnonceWord = (annonce) => {
    const html = buildWordTemplate(annonce);
    downloadBlob(`\ufeff${html}`, 'application/msword;charset=utf-8;', `annonce-${fileSafe(annonce.title)}.doc`);
  };

  const downloadAnnoncePdf = (annonce) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 18;

    doc.setFillColor(18, 24, 38);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LinkedU - Document Scolaire Officiel', margin, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Service de communication interne', margin, 19);

    y = 36;
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const titleLines = doc.splitTextToSize(annonce.title || 'Annonce', pageWidth - margin * 2);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Auteur: ${annonce.author || 'Inconnu'}`, margin, y);
    y += 6;
    doc.text(`Date: ${formatDate(annonce.raw_date)}`, margin, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(11);
    const contentLines = doc.splitTextToSize(annonce.content || '', pageWidth - margin * 2);
    doc.text(contentLines, margin, y);

    doc.save(`annonce-${fileSafe(annonce.title)}.pdf`);
  };

  return (
    <div className="annonces-page">
      <div className="annonces-header animate-fade-in">
        <div>
<<<<<<< HEAD
          <h2 className="flex items-center gap-3">
            <Inbox className="w-8 h-8 text-indigo-600" />
            Annonces de l'├ëtablissement
          </h2>
          <p>T├®l├®chargez chaque annonce en Word ou PDF (mod├¿le scolaire).</p>
=======
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Megaphone className="text-blue-600" size={28} /> Communication Interne
          </h1>
          <p className="text-slate-500 text-sm mt-1">Affichage en table simple: Voir et Télécharger.</p>
        </div>
      </header>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Rechercher par titre d'annonce..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>
          <span className="text-sm font-semibold text-slate-500">{filteredAnnonces.length} annonce(s)</span>
        </div>

        {error && (
          <div className="m-4 card p-3 border border-red-100 bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Titre</th>
                <th className="py-3 px-4 font-bold">Auteur</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <span className="loading-spinner border-blue-500" />
                  </td>
                </tr>
              ) : filteredAnnonces.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Info size={40} className="mx-auto mb-2 opacity-30" />
                    Aucune annonce trouvée.
                  </td>
                </tr>
              ) : (
                filteredAnnonces.map((annonce) => (
                  <tr key={annonce.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{annonce.title}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{annonce.author || '-'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">{formatDateOnly(annonce.date)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAnnonce(annonce)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white bg-slate-100 text-slate-600 transition-colors hover:bg-slate-600 hover:text-white"
                        >
                          <Eye size={14} /> 
                        </button>
                        <button
                          type="button"
                          disabled={!hasAttachment(annonce)}
                          onClick={() => downloadAttachment(annonce)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Download size={14} /> 
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
>>>>>>> 78db954bb8f9de8159957adfa96a2d298d6c39d8
        </div>
      </div>

      <div className="table-wrapper animate-fade-in bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ animationDelay: '0.1s' }}>
        <table className="table w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Titre</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contenu</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Auteur</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pi├¿ce</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">T├®l├®chargement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-4 px-6">Chargement des annonces...</td>
              </tr>
            ) : annonces.length > 0 ? (
              annonces.map((annonce) => (
                <tr key={annonce.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-4 px-6">{annonce.title}</td>
                  <td className="py-4 px-6">{annonce.content}</td>
                  <td className="py-4 px-6">{annonce.author || '-'}</td>
                  <td className="py-4 px-6">{annonce.date || formatDate(annonce.raw_date)}</td>
                  <td className="py-4 px-6">{annonce.photo_url ? 'Photo jointe' : 'Aucune'}</td>
                  <td className="py-4 px-6">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => downloadAnnonceWord(annonce)}
                      >
                        Word
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => downloadAnnoncePdf(annonce)}
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Inbox className="w-12 h-12 mb-3 text-gray-200" />
                    <p className="text-base font-medium text-gray-500">Aucune annonce trouv├®e</p>
                    <p className="text-sm mt-1">Aucune annonce disponible pour le moment.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
