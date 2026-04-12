const fs = require('fs');
let code = fs.readFileSync('../frontend/src/components/AdminClassForm.jsx', 'utf8');

const regex = /onChange=\{\(e\) => \{\s*if \(e\.target\.checked\) \{\s*setFormData\(prev => \(\{ \.\.\.prev, \s*professeur_ids: \[\.\.\.prev\.professeur_ids, String\(p\.id\)\] \}\)\);\s*setSelectedProfForModal\(p\);\s*setSelectedMatieres\(professeurMatieres\[String\(p\.id\)\] \|\| \[\]\);\s*\} else \{\s*setFormData\(prev => \(\{ \.\.\.prev, professeur_ids: prev\.professeur_ids\.filter\(id => id !== String\(p\.id\)\) \}\)\);\s*const newMatieres = \{ \.\.\.professeurMatieres \};\s*delete newMatieres\[String\(p\.id\)\];\s*setProfesseurMatieres\(newMatieres\);\s*\}\s*\}\}/;

const newStr = \onChange={(e) => {
  if (e.target.checked) {
    setFormData(prev => ({ ...prev, professeur_ids: [...prev.professeur_ids, String(p.id)] }));
    const teacherSet = new Set(teacherSubjects.map(s => normalizeMatiereName(s)));
    const matchedIds = filteredMatieres
      .filter(mat => teacherSet.has(normalizeMatiereName(mat.nom)))
      .map(mat => String(mat.id_matiere || mat.id || mat.ID));
    
    setProfesseurMatieres(prev => ({
      ...prev,
      [String(p.id)]: matchedIds
    }));
  } else {
    setFormData(prev => ({ ...prev, professeur_ids: prev.professeur_ids.filter(id => id !== String(p.id)) }));
    const newMatieres = { ...professeurMatieres };
    delete newMatieres[String(p.id)];
    setProfesseurMatieres(newMatieres);
  }
}}\;

if (regex.test(code)) {
  fs.writeFileSync('../frontend/src/components/AdminClassForm.jsx', code.replace(regex, newStr));
  console.log('Replaced successfully');
} else {
  console.log('Could not find regex string');
}
