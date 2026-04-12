import React, { useState } from "react";
import { LayoutDashboard, Calendar, Users, Star, FileText, MessageCircle, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import "./ProfesseurDashboard.css";

export default function ProfesseurDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState("Emploi du temps");

  const weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const timeSlots = ["08:00", "09:30", "11:00", "14:00"];
  
  const mockWeekSchedule = {
    "08:00": {
      "Lundi": { subject: "Physique Chimie", class: "2BAC-G1", room: "Salle A12" },
      "Mardi": null,
      "Mercredi": { subject: "Physique Chimie", class: "2BAC-G1", room: "Salle A12", status: "en-cours" },
      "Jeudi": { subject: "SVT", class: "TCS-G2", room: "Labo 2" },
      "Vendredi": { subject: "Physique Chimie", class: "2BAC-G1", room: "Salle A12" },
      "Samedi": { subject: "Mathématiques", class: "1BAC-G3", room: "Salle B04" }
    },
    "09:30": {
      "Lundi": { subject: "Mathématiques", class: "1BAC-G3", room: "Salle B04" },
      "Mardi": { subject: "Physique Chimie", class: "2BAC-G2", room: "Salle A12" },
      "Mercredi": { subject: "Mathématiques", class: "1BAC-G3", room: "Salle B04" },
      "Jeudi": null,
      "Vendredi": { subject: "SVT", class: "TCS-G2", room: "Labo 2" },
      "Samedi": null
    },
    "11:00": {
      "Lundi": null,
      "Mardi": { subject: "Physique Chimie", class: "2BAC-G1", room: "Labo 1" },
      "Mercredi": { subject: "SVT", class: "TCS-G2", room: "Labo 2" },
      "Jeudi": { subject: "Physique Chimie", class: "2BAC-G2", room: "Salle A12" },
      "Vendredi": null,
      "Samedi": null
    },
    "14:00": {
      "Lundi": { subject: "SVT", class: "TCS-G2", room: "Labo 2" },
      "Mardi": null,
      "Mercredi": { subject: "Physique Chimie", class: "2BAC-G2", room: "Salle A12" },
      "Jeudi": { subject: "Mathématiques", class: "1BAC-G3", room: "Salle B04" },
      "Vendredi": null,
      "Samedi": null
    }
  };

  const menuItems = [
    { name: "Tableau de bord", icon: <LayoutDashboard size={20} /> },
    { name: "Emploi du temps", icon: <Calendar size={20} /> },
    { name: "Mes Classes", icon: <Users size={20} /> },
    { name: "Notes & Absences", icon: <Star size={20} /> },
    { name: "Devoirs & Ressources", icon: <FileText size={20} /> },
    { name: "Annonces", icon: <MessageCircle size={20} /> },
    { name: "Paramètres", icon: <Settings size={20} /> }
  ];

  return (
    <div className="prof-layout">
      <aside className="prof-sidebar">
        <div className="prof-profile">
          <img src="https://i.pravatar.cc/150?u=abdelhadi" alt="Profile" className="prof-avatar" />
          <div className="prof-info">
            <h2>ABDELHADI</h2>
            <p>professeur</p>
          </div>
        </div>

        <nav className="prof-nav">
          {menuItems.map(item => (
            <button
              key={item.name}
              className={\prof-nav-item \\}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </button>
          ))}

          <button className="prof-nav-item logout-btn" onClick={onLogout}>      
            <span className="nav-icon"><LogOut size={20} /></span>
            <span className="nav-text">Se déconnecter</span>
          </button>
        </nav>
      </aside>

      <main className="prof-content">
        {activeMenu === "Emploi du temps" && (
          <div className="schedule-view">
            <div className="schedule-header-top">
              <div>
                <h1 className="schedule-title">Emploi du Temps</h1>
                <p className="schedule-subtitle">Semaine du 24 au 29 Mars 2026</p>
              </div>
              <div className="schedule-controls">
                <ChevronLeft className="control-icon" size={20} style={{cursor: 'pointer', color: '#1e293b'}} />
                <span className="week-label">Semaine 13</span>
                <ChevronRight className="control-icon" size={20} style={{cursor: 'pointer', color: '#1e293b'}} />
                
                <div className="view-toggle">
                  <button className="toggle-btn active">Semaine</button>
                  <button className="toggle-btn">Jour</button>
                </div>
              </div>
            </div>

            <div className="schedule-grid-wrap">
              <div className="schedule-grid">
                {/* Header Row */}
                <div className="sg-corner"></div>
                {weekDays.map(day => (
                  <div key={day} className={\sg-header-day \\}>
                    {day}
                  </div>
                ))}

                {/* Grid Rows */}
                {timeSlots.map((time) => (
                  <React.Fragment key={time}>
                    <div className="sg-time">{time}</div>
                    {weekDays.map((day) => {
                      const slot = mockWeekSchedule[time]?.[day];
                      return (
                        <div key={\\-\\} className={\sg-cell \\}>
                          {slot && (
                            <div className={\course-card \\}>
                              <div className="course-accent"></div>
                              <div className="course-details">
                                {slot.status === 'en-cours' && <span className="badge-en-cours">En cours</span>}
                                <h3 className="course-subject">{slot.subject}</h3>
                                <p className="course-class">{slot.class}</p>
                                <p className="course-room">{slot.room}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              
              <button className="scroll-right-btn">
                <ChevronRight size={24} color="white" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
