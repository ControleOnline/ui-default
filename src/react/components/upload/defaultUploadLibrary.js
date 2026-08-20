/**
 * Library fetch helpers for DefaultUpload (app-community#296 / #433).
 *
 * Always send itemsPerPage so the API does not default to a tiny page size.
 * For people_media, also load /people_media relations so images linked only
 * via that join (without files.people_id) still appear in the manager.
 */
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

const extractFileIdLocal = value => {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object') {
    return extractFileIdLocal(value.id || value['@id'] || value.fileId);
  }
  const match = String(value).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const dedupeFiles = files => {
  const seen = new Set();
  return files.filter(file => {
    const id = extractFileIdLocal(file);
    if (!id || seen.has(String(id))) return false;
    seen.add(String(id));
    return true;
  });
};

/**
 * Extract file objects from people_media relation items.
 * @param {unknown[]} relations
 * @returns {object[]}
 */
function filesFromPeopleMediaRelations(relations) {
  if (!Array.isArray(relations)) return [];
  const files = [];
  for (const relation of relations) {
    const file = relation?.file;
    if (!file) continue;
    const id = extractFileIdLocal(file);
    if (!id) continue;
    if (typeof file === 'object') {
      files.push({
        ...file,
        id: file.id || id,
        '@id': file['@id'] || `/files/${id}`,
      });
    } else {
      files.push({id, '@id': `/files/${id}`});
    }
  }
  return files;
}

/**
 * Fetch all people_media for a person and return embedded files.
 * @param {{ peopleActions?: object, peopleIri: string }} args
 */
async function fetchPeopleMediaFiles({peopleActions, peopleIri}) {
  if (!peopleIri || typeof peopleActions?.getPeopleMedia !== 'function') {
    return [];
  }
  const pageSize = 100;
  const maxPages = 10;
  const collected = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await peopleActions.getPeopleMedia({
      people: peopleIri,
      page,
      itemsPerPage: pageSize,
      'order[id]': 'DESC',
    });
    const pageItems = normalizeCollection(response);
    collected.push(...pageItems);
    if (pageItems.length < pageSize) break;
  }
  return filesFromPeopleMediaRelations(collected);
}

async function fetchLibraryFiles({
  fileActions,
  companyId,
  fileType,
  libraryContexts,
  peopleActions = null,
}) {
  if (typeof fileActions?.getItems !== 'function') {
    return [];
  }

  const peopleIri = getEntityId(companyId) ? `/people/${getEntityId(companyId)}` : null;
  const pageSize = 500;
  const maxPages = 10;
  const contexts = Array.isArray(libraryContexts) && libraryContexts.length
    ? libraryContexts
    : DEFAULT_LIBRARY_CONTEXTS;

  const fetchContextFiles = async fileContext => {
    const contextFiles = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const params = {
        context: fileContext,
        page,
        itemsPerPage: pageSize,
        'order[fileName]': 'ASC',
      };
      if (fileType) params.fileType = fileType;
      if (peopleIri) params.people = peopleIri;
      const response = await fileActions.getItems(params);
      const pageItems = normalizeCollection(response);
      contextFiles.push(...pageItems);
      if (pageItems.length < pageSize) break;
    }
    return contextFiles;
  };

  const batches = await Promise.all(contexts.map(fetchContextFiles));
  let files = batches.flat();

  // app-community#433: also surface files linked only through people_media
  const includesPeopleMedia = contexts.some(
    c => String(c || '').trim().toLowerCase() === 'people_media',
  );
  if (includesPeopleMedia && peopleIri) {
    try {
      const relationFiles = await fetchPeopleMediaFiles({peopleActions, peopleIri});
      files = files.concat(relationFiles);
    } catch (_) {
      // Library still returns /files results; relation fetch is best-effort enrichment.
    }
  }

  return dedupeFiles(files);
}

module.exports = {
  fetchLibraryFiles,
  filesFromPeopleMediaRelations,
  fetchPeopleMediaFiles,
};
