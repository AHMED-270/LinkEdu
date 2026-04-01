export const ROLE = {
  ADMIN: 'admin',
  DIRECTEUR: 'directeur',
  PROFESSEUR: 'professeur',
  ETUDIANT: 'etudiant',
  PARENT: 'parent',
  SECRETAIRE: 'secretaire',
};

export const ROLE_META = {
  [ROLE.ADMIN]: {
    label: 'Administrateur',
    displayLabel: 'SUPER ADMIN',
    homeRoute: '/admin',
    badgeClass: 'badge-red',
  },
  [ROLE.DIRECTEUR]: {
    label: 'Directeur',
    displayLabel: 'DIRECTION',
    homeRoute: '/directeur',
    badgeClass: 'badge-blue',
  },
  [ROLE.PROFESSEUR]: {
    label: 'Professeur',
    displayLabel: 'Professeur',
    homeRoute: '/dashboard',
    badgeClass: 'badge-blue',
  },
  [ROLE.ETUDIANT]: {
    label: 'Etudiant',
    displayLabel: 'Etudiant',
    homeRoute: '/etudiant',
    badgeClass: 'badge-green',
  },
  [ROLE.PARENT]: {
    label: 'Parent',
    displayLabel: 'Parent',
    homeRoute: '/parent',
    badgeClass: 'badge-blue',
  },
  [ROLE.SECRETAIRE]: {
    label: 'Secretaire',
    displayLabel: 'Secretaire',
    homeRoute: '/login',
    badgeClass: 'badge-blue',
  },
};

export function getRoleMeta(role) {
  return ROLE_META[role] ?? {
    label: 'Utilisateur',
    displayLabel: 'UTILISATEUR',
    homeRoute: '/login',
    badgeClass: 'badge-blue',
  };
}

export function getHomeRouteByRole(role) {
  return getRoleMeta(role).homeRoute;
}

export function getRoleDisplayLabel(role) {
  return getRoleMeta(role).displayLabel;
}

export function getRoleLabel(role) {
  return getRoleMeta(role).label;
}

export function getRoleBadgeClass(role) {
  return getRoleMeta(role).badgeClass;
}

export function getPortalLabelByRole(role) {
  return `Portail ${getRoleLabel(role)}`;
}