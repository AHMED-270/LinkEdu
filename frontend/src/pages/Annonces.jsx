import { useEffect, useState } from 'react';
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

  const markAsRead = (id) => {
    setAnnonces(annonces.map(a => a.id === id ? { ...a, read: true } : a));
  };

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
          <p className="text-slate-500 text-sm mt-1">GÃ©rez et consultez les annonces officielles de l'Ã©tablissement.</p>
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
                placeholder="RÃ©digez le contenu dÃ©taillÃ© ici..."
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
                <p className="font-medium">Aucune annonce trouvÃ©e dans cette catÃ©gorie.</p>
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
                  { name: 'Directeur', role: 'Direction GÃ©nÃ©rale', icon: 'D', color: 'var(--primary-500)' },
                  { name: 'Surveillant GÃ©nÃ©ral', role: 'Vie Scolaire', icon: 'S', color: 'var(--accent-green)' },
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
            <button className="bg-white text-blue-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors relative z-10 shadow-sm">ParamÃ©trer</button>
          </div>
        </aside>

      </div>
    </div>
  );
}
