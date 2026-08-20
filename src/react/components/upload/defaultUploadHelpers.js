/**
 * Pure helpers for DefaultUpload (app-community#296 modularization).
 * task-432: getContextLabel accepts file object or context string.
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
  const value =
    relation?.id ||
    relation?.['@id'] ||
    relation?.mediaId ||
    relation?.media?.id ||
    relation?.media?.['@id'] ||
    relation?.peopleMedia?.id ||
    relation?.peopleMedia?.['@id'] ||
    relation;
  const match = String(value || '').match(/(\d+)$/);
  return match ? match[1] : null;
};

const normalizeAttachmentRelation = relation => {
  const relationId = getEntityId(relation);

  if (!relation || typeof relation !== 'object' || relation?.id || !relationId) {
    return relation;
  }

  return {
    ...relation,
    id: relationId,
  };
};

const getRelationFileId = relation => extractFileId(relation?.file);

const getFileName = file => {
  const id = extractFileId(file);
  return file?.fileName || file?.name || file?.originalName || (id ? `Arquivo ${id}` : 'Arquivo');
};

/**
 * Accepts a context string or a file-like object (uses .context).
 * Avoids String(object) → "[object Object]" in the manager modal badge.
 */
const getContextLabel = contextOrFile => {
  if (contextOrFile == null || contextOrFile === '') {
    return 'sem contexto';
  }

  if (typeof contextOrFile === 'object' && !Array.isArray(contextOrFile)) {
    const fromFile =
      contextOrFile.context ??
      contextOrFile.fileContext ??
      contextOrFile.file_context ??
      '';
    if (fromFile != null && fromFile !== '' && typeof fromFile !== 'object') {
      return String(fromFile).trim() || 'sem contexto';
    }
    return 'sem contexto';
  }

  return String(contextOrFile).trim() || 'sem contexto';
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
  normalizeAttachmentRelation,
  getRelationFileId,
  getFileName,
  getContextLabel,
  dedupeFiles,
};
