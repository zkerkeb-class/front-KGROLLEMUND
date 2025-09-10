// Constantes partagées pour les secteurs et spécialités
// Utilisées dans complete-profile et profile pour maintenir la cohérence

export const sectors = [
  { id: 'development', name: 'Développement' },
  { id: 'design', name: 'Design' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'data', name: 'Data & Analytics' },
  { id: 'devops', name: 'DevOps & Infrastructure' },
  { id: 'qa', name: 'QA & Testing' },
  { id: 'other', name: 'Autre' }
];

export const specialtiesBySector = {
  development: [
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'fullstack', label: 'Fullstack' },
    { value: 'mobile', label: 'Mobile (iOS/Android)' },
    { value: 'web', label: 'Développement Web' },
    { value: 'api', label: 'API/Microservices' },
    { value: 'database', label: 'Base de données' },
    { value: 'qa', label: 'QA/Testing' },
    { value: 'autre-dev', label: 'Autres spécialités', allowMultiple: true }
  ],
  design: [
    { value: 'ui', label: 'UI Design' },
    { value: 'ux', label: 'UX Design' },
    { value: 'graphic', label: 'Design Graphique' },
    { value: 'web-design', label: 'Web Design' },
    { value: 'mobile-design', label: 'Mobile Design' },
    { value: 'branding', label: 'Branding' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'autre-design', label: 'Autres spécialités', allowMultiple: true }
  ],
  marketing: [
    { value: 'digital', label: 'Marketing Digital' },
    { value: 'seo', label: 'SEO/SEA' },
    { value: 'social-media', label: 'Réseaux Sociaux' },
    { value: 'content', label: 'Content Marketing' },
    { value: 'email', label: 'Email Marketing' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'growth', label: 'Growth Hacking' },
    { value: 'autre-marketing', label: 'Autres spécialités', allowMultiple: true }
  ],
  data: [
    { value: 'data-science', label: 'Data Science' },
    { value: 'data-analysis', label: 'Analyse de données' },
    { value: 'machine-learning', label: 'Machine Learning' },
    { value: 'ai', label: 'Intelligence Artificielle' },
    { value: 'business-intelligence', label: 'Business Intelligence' },
    { value: 'data-engineering', label: 'Data Engineering' },
    { value: 'statistics', label: 'Statistiques' },
    { value: 'autre-data', label: 'Autres spécialités', allowMultiple: true }
  ],
  devops: [
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'cloud-aws', label: 'Cloud AWS' },
    { value: 'cloud-azure', label: 'Cloud Azure' },
    { value: 'cloud-gcp', label: 'Cloud GCP' },
    { value: 'docker', label: 'Docker/Containers' },
    { value: 'kubernetes', label: 'Kubernetes' },
    { value: 'ci-cd', label: 'CI/CD' },
    { value: 'autre-devops', label: 'Autres spécialités', allowMultiple: true }
  ],
  qa: [
    { value: 'manual-testing', label: 'Tests Manuels' },
    { value: 'automation', label: 'Tests Automatisés' },
    { value: 'performance', label: 'Tests de Performance' },
    { value: 'security', label: 'Tests de Sécurité' },
    { value: 'mobile-testing', label: 'Tests Mobile' },
    { value: 'api-testing', label: 'Tests API' },
    { value: 'load-testing', label: 'Tests de Charge' },
    { value: 'autre-qa', label: 'Autres spécialités', allowMultiple: true }
  ],
  other: [
    { value: 'project-management', label: 'Gestion de Projet' },
    { value: 'consulting', label: 'Conseil' },
    { value: 'formation', label: 'Formation' },
    { value: 'support', label: 'Support Technique' },
    { value: 'sales', label: 'Vente' },
    { value: 'business-analysis', label: 'Analyse Métier' },
    { value: 'freelance-autre', label: 'Activité freelance autre' },
    { value: 'autre-secteur', label: 'Autre secteur' }
  ]
};

// Helper functions pour la compatibilité avec les anciens formats
export const getSectorName = (sectorId) => {
  const sector = sectors.find(s => s.id === sectorId);
  return sector ? sector.name : sectorId;
};

export const getSpecialtyName = (sectorId, specialtyValue) => {
  const sectorSpecialties = specialtiesBySector[sectorId] || [];
  const specialty = sectorSpecialties.find(s => s.value === specialtyValue);
  return specialty ? specialty.label : specialtyValue;
}; 