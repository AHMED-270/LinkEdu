const fs = require('fs');
let content = fs.readFileSync('C:/Users/PC/LinkEdu/frontend/src/components/LoginCard.jsx', 'utf8');
content = content.replace(/'http:\/\/localhost:8000'/g, "'http://127.0.0.1:8000'");
fs.writeFileSync('C:/Users/PC/LinkEdu/frontend/src/components/LoginCard.jsx', content);
console.log('Fixed API URL');
