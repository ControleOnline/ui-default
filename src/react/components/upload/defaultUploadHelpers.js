/**
 * Pure helpers for DefaultUpload (app-community#296 modularization).
 */
const {extractFileId} = require('./fileUpload');

const DEFAULT_LIBRARY_CONTEXTS = ['products', 'products-category'];

const normalizeCollection = response => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.member)) return response.member;
  if (Array.isArray(response?.['hydra:member'])) return response['hydra:member'];
  return [];
};

const getEntityId = relation => {
  const value = relation?.id || relation?.['@id'] || relation;
  const match = String(value || '').match(/(\d+)$/);
  return match ? match[1] : null;
};

const getRelationFileId = relation => extractFileId(relation?.file);

const getFileName = file => {
  const id = extractFileId(file);
  return file?.fileName || file?.name || file?.originalName || (id ? `Arquivo ${id}` : 'Arquivo');
};

const getContextLabel = context => {
  if (!context) return 'sem contexto';
  return String(context).trim();
};

const dedupeFiles = files => {
  const seen = new Set();
  return files.filter(file => {
    const id = extractFileId(file);
    if (!id || seen.has(String(id))) return false;
    seen.add(String(id));
    return true;
  });
};


module.exports = {
  DEFAULT_LIBRARY_CONTEXTS,
  normalizeCollection,
  getEntityId,
  getRelationFileId,
  getFileName,
  getContextLabel,
  dedupeFiles,
};
