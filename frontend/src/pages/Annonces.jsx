<<<<<<<<< Temporary merge branch 1
﻿import { useEffect, useState } from 'react';
import { 
  Bell, Plus, MessageCircle, Calendar, User, 
  CheckCircle2, AlertCircle, Send, Info, UserCircle2, 
  MoreHorizontal, Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { professorGet, professorPost } from '../services/professorApi';

export default function Annonces() {
  const [annonces, setAnnonces] = useState([]);
  const [filter, setFilter] = useState('all'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const loadAnnonces = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await professorGet('/api/professeur/annonces');
      setAnnonces(data.announcements || []);
    } catch {
      setError('Impossible de charger les annonces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnonces();
  }, []);
=========
import { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { Inbox } from 'lucide-react';
import './Annonces.css';

export default function Annonces() {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
>>>>>>>>> Temporary merge branch 2

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

<<<<<<<<< Temporary merge branch 1
  const publishAnnouncement = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setIsPublishing(true);
    try {
      await professorPost('/api/professeur/annonces', { title, content });
      setTitle('');
      setContent('');
      await loadAnnonces();
    } catch {
      setError('Publication impossible pour le moment.');
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredAnnonces = filter === 'unread' ? annonces.filter(a => !a.read) : annonces;
  const unreadCount = annonces.filter(a => !a.read).length;

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="layout-content">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Megaphone className="text-blue-600" size={28} /> Communication Interne
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gérez et consultez les annonces officielles de l'établissement.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="badge bg-red-100 text-red-600 border-red-200 font-bold px-3"
              >
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* === MAIN CONTENT (Announcements) === */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* Create Announcement Card */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 border-2 border-blue-50">
            <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Plus size={16} /> Publier un message
            </h3>
            <form onSubmit={publishAnnouncement} className="flex flex-col gap-4">
              <input
                type="text"
                className="form-input text-lg font-bold border-none bg-slate-50 focus:bg-white px-4 py-3"
                placeholder="Quel est l'objet de votre annonce ?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="form-input min-h-[100px] border-none bg-slate-50 focus:bg-white px-4 py-3 resize-none"
                placeholder="Rédigez le contenu détaillé ici..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex justify-end">
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isPublishing || !title.trim() || !content.trim()}
                  className="btn btn-primary px-8 shadow-md"
                >
                  {isPublishing ? 'Envoi...' : <><Send size={16} className="mr-2"/> Diffuser</>}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* List Toolbar */}
          <div className="flex justify-between items-center px-2">
            <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
              {['all', 'unread'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`relative px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                    filter === t ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {filter === t && (
                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-white shadow-sm rounded-lg -z-10" />
                  )}
                  {t === 'all' ? 'Toutes les annonces' : 'Messages non lus'}
                </button>
              ))}
            </div>
          </div>

          {/* Announcements List */}
          <motion.div 
            variants={containerVariants} initial="hidden" animate="visible"
            className="flex flex-col gap-4"
          >
            {loading ? (
              <div className="py-20 text-center"><span className="loading-spinner border-blue-500" /></div>
            ) : filteredAnnonces.length === 0 ? (
              <div className="card p-12 text-center text-slate-400 bg-slate-50/50">
                <Info size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Aucune annonce trouvée dans cette catégorie.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredAnnonces.map(annonce => (
                  <motion.div 
                    layout key={annonce.id} variants={itemVariants}
                    className={`card p-6 flex gap-5 hover:shadow-md transition-shadow relative overflow-hidden group ${!annonce.read ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-slate-200'}`}
                  >
                    {!annonce.read && (
                      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black py-1 px-8 rotate-45 translate-x-4 translate-y-[-4px]">NEW</div>
                      </div>
                    )}

                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!annonce.read ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Bell size={24} className={!annonce.read ? 'animate-pulse' : ''} />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">{annonce.title}</h4>
                        <div className="flex gap-2">
                           {!annonce.read && (
                            <button 
                              onClick={() => markAsRead(annonce.id)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
                            >
                              Marquer lu
                            </button>
                           )}
                           <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={18}/></button>
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm mb-4 leading-relaxed">{annonce.content}</p>
                      
                      <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><User size={12}/></div>
                          {annonce.author}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                          <Calendar size={14} /> {annonce.date}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        </div>

        {/* === SIDEBAR (Contacts) === */}
        <aside className="xl:col-span-4 flex flex-col gap-6">
          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-white">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCircle2 className="text-slate-400" size={20} /> Contacts Administratifs
              </h3>
            </div>
            <div className="p-2 bg-slate-50/50">
              <div className="flex flex-col gap-1">
                {[
                  { name: 'Directeur', role: 'Direction Générale', icon: 'D', color: 'var(--primary-500)' },
                  { name: 'Surveillant Général', role: 'Vie Scolaire', icon: 'S', color: 'var(--accent-green)' },
                  { name: 'Support IT', role: 'Assistance Technique', icon: 'I', color: 'var(--accent-orange)' }
                ].map((contact, idx) => (
                  <button key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all text-left group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: contact.color }}>
                      {contact.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{contact.name}</p>
                      <p className="text-xs text-slate-500">{contact.role}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <MessageCircle size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
               <button className="btn btn-outline w-full text-xs font-bold justify-center">Annuaire complet</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Bell size={120}/></div>
            <h4 className="font-bold mb-1 relative z-10">Notifications Push</h4>
            <p className="text-sm text-blue-100 mb-4 relative z-10 leading-relaxed">Activez les notifications pour ne jamais manquer une urgence administrative.</p>
            <button className="bg-white text-blue-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors relative z-10 shadow-sm">Paramétrer</button>
          </div>
        </aside>

=========
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
          <h2 className="flex items-center gap-3">
            <Inbox className="w-8 h-8 text-indigo-600" />
            Annonces de l'Établissement
          </h2>
          <p>Téléchargez chaque annonce en Word ou PDF (modèle scolaire).</p>
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
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pièce</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléchargement</th>
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
                    <p className="text-base font-medium text-gray-500">Aucune annonce trouvée</p>
                    <p className="text-sm mt-1">Aucune annonce disponible pour le moment.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
>>>>>>>>> Temporary merge branch 2
      </div>
    </div>
  );
}

