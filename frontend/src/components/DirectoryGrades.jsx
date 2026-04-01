import React from 'react';
import DirectoryFallback from './DirectoryFallback';

function DirectoryGrades({ userRole }) {
  return (
    <DirectoryFallback activeMenu="Notes & Examens" userRole={userRole} />
  );
}

export default DirectoryGrades;