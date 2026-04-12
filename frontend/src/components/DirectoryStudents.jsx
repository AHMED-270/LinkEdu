import React from 'react';
import DirectoryFallback from './DirectoryFallback';

function DirectoryStudents({ userRole }) {
  return (
    <DirectoryFallback activeMenu="Liste des Etudiants" userRole={userRole} />
  );
}

export default DirectoryStudents;