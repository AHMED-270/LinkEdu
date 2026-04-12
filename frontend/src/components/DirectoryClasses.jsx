import React from 'react';
import DirectoryFallback from './DirectoryFallback';

function DirectoryClasses({ userRole }) {
  return (
    <DirectoryFallback activeMenu="Liste des Classes" userRole={userRole} />
  );
}

export default DirectoryClasses;