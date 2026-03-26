const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/DirecteurDashboard.jsx', 'utf8');

code = code.replace(/import axios from 'axios'\n/, "import axios from 'axios'\nimport DirectorSidebar from './DirectorSidebar'\n");

const asideRegex = /<aside className="director-sidebar">[\s\S]*?<\/aside>/;
const componentReplacement = '<DirectorSidebar user={user} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />';
code = code.replace(asideRegex, componentReplacement);

const menuArrayRegex = /const menuItems = \[(?:[\s\S]*?)\n  \]\n/;
code = code.replace(menuArrayRegex, '');

fs.writeFileSync('frontend/src/components/DirecteurDashboard.jsx', code);
