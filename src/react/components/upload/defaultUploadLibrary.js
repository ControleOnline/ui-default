/**
 * Library fetch helpers for DefaultUpload (app-community#296 / #433).
 * Always send itemsPerPage so the API does not default to a tiny page size
 * (which caused the avatar manager to show only 1 of N associated images).
 */
const {
  normalizeCollection,
  getEntityId,
  dedupeFiles,
  DEFAULT_LIBRARY_CONTEXTS,
} = require('./defaultUploadHelpers');

async function fetchLibraryFiles({
  fileActions,
  companyId,
  fileType,
  libraryContexts,
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
  return dedupeFiles(batches.flat());
}

module.exports = {fetchLibraryFiles};
