/**
 * Library fetch helpers for DefaultUpload (app-community#296 / #433 / #670).
 *
 * Always send itemsPerPage so the API does not default to a tiny page size.
 * Also hydrate known file ids (certificates are public=false and may not
 * appear in the collection filter).
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

function resolvePeopleMediaTypeLabel(relation) {
  const mediaType = relation?.mediaType;
  if (!mediaType) return '';
  if (typeof mediaType === 'string') {
    // Prefer last path segment only when it looks like a label, not a numeric id
    const segment = String(mediaType).split('/').filter(Boolean).pop() || '';
    if (segment && !/^\d+$/.test(segment)) return segment.trim();
    return '';
  }
  return String(
    mediaType.type || mediaType.name || mediaType.label || mediaType.code || '',
  ).trim();
}

function filesFromPeopleMediaRelations(relations) {
  if (!Array.isArray(relations)) return [];
  // Group by file id and collect media_types where the image is used (#814)
  const byFileId = new Map();
  for (const relation of relations) {
    const file = relation?.file;
    if (!file) continue;
    const id = extractFileIdLocal(file);
    if (!id) continue;
    const typeLabel = resolvePeopleMediaTypeLabel(relation);
    const key = String(id);
    const existing = byFileId.get(key);
    if (existing) {
      if (typeLabel && !existing.mediaTypesUsed.includes(typeLabel)) {
        existing.mediaTypesUsed.push(typeLabel);
      }
      continue;
    }
    // Always tag people_media library entries so the manager can preview as image
    // even when API returns a bare IRI / minimal File payload.
    const base =
      typeof file === 'object'
        ? {
            ...file,
            id: file.id || id,
            '@id': file['@id'] || `/files/${id}`,
            context: file.context || 'people_media',
            fileType: file.fileType || file.mimeType || 'image',
            fileName: file.fileName || file.name || file.originalName || `Arquivo ${id}`,
          }
        : {
            id,
            '@id': `/files/${id}`,
            context: 'people_media',
            fileType: 'image',
            fileName: `Arquivo ${id}`,
          };
    byFileId.set(key, {
      ...base,
      mediaTypesUsed: typeLabel ? [typeLabel] : [],
    });
  }
  return Array.from(byFileId.values()).map(file => ({
    ...file,
    mediaTypesUsed: Array.isArray(file.mediaTypesUsed)
      ? [...file.mediaTypesUsed].sort((a, b) =>
          String(a).localeCompare(String(b), 'pt-BR', {sensitivity: 'base'}),
        )
      : [],
  }));
}

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

async function fetchKnownFiles({fileActions, knownFileIds = []}) {
  if (typeof fileActions?.get !== 'function') return [];
  const ids = [...new Set(knownFileIds.map(extractFileIdLocal).filter(Boolean))];
  const files = [];
  for (const id of ids) {
    try {
      const item = await fileActions.get(id);
      if (item && typeof item === 'object') files.push(item);
    } catch (_) {
      // item GET is best-effort so a missing id does not empty the library
    }
  }
  return files;
}

function synthesizeKnownImageFiles(knownFileIds = [], fileType = 'image', context = 'people_media') {
  const preferImage = String(fileType || '').toLowerCase() === 'image';
  return knownFileIds
    .map(extractFileIdLocal)
    .filter(Boolean)
    .map(id => ({
      id,
      '@id': `/files/${id}`,
      context,
      fileType: preferImage ? 'image' : fileType || undefined,
      fileName: `Arquivo ${id}`,
    }));
}

async function fetchLibraryFiles({
  fileActions,
  companyId,
  fileType,
  libraryContexts,
  peopleActions = null,
  knownFileIds = [],
}) {
  const peopleIri = getEntityId(companyId) ? `/people/${getEntityId(companyId)}` : null;
  const contexts = Array.isArray(libraryContexts) && libraryContexts.length
    ? libraryContexts
    : DEFAULT_LIBRARY_CONTEXTS;
  const includesPeopleMedia = contexts.some(
    c => String(c || '').trim().toLowerCase() === 'people_media',
  );

  // people_media is company-scoped via /people_media — never GET /files collection/item
  // (those endpoints 404 for private company media while /download still works).
  if (includesPeopleMedia) {
    let files = [];
    if (peopleIri) {
      try {
        files = await fetchPeopleMediaFiles({peopleActions, peopleIri});
      } catch (_) {
        files = [];
      }
    }
    const existing = new Set(
      files.map(file => String(extractFileIdLocal(file) || '')).filter(Boolean),
    );
    const stubs = synthesizeKnownImageFiles(knownFileIds, fileType, 'people_media').filter(
      file => !existing.has(String(file.id)),
    );
    return dedupeFiles(files.concat(stubs));
  }

  if (typeof fileActions?.getItems !== 'function') {
    return fetchKnownFiles({fileActions, knownFileIds});
  }

  const pageSize = 500;
  const maxPages = 10;

  const fetchContextFiles = async fileContext => {
    const contextFiles = [];
    for (let page = 1; page <= maxPages; page += 1) {
      const params = {
        context: fileContext,
        page,
        itemsPerPage: pageSize,
      };
      if (fileType) params.fileType = fileType;
      if (peopleIri) params.people = peopleIri;
      try {
        const response = await fileActions.getItems(params);
        const pageItems = normalizeCollection(response);
        contextFiles.push(...pageItems);
        if (pageItems.length < pageSize) break;
      } catch (_) {
        // Collection filter may 404 for some contexts — skip page
        break;
      }
    }
    return contextFiles;
  };

  const batches = await Promise.all(contexts.map(fetchContextFiles));
  let files = batches.flat();

  if (knownFileIds.length) {
    // Prefer stubs over GET /files/{id} when item endpoint 404s for private files
    const knownFiles = await fetchKnownFiles({fileActions, knownFileIds});
    if (knownFiles.length) {
      files = knownFiles.concat(files);
    } else {
      files = synthesizeKnownImageFiles(knownFileIds, fileType, contexts[0]).concat(files);
    }
  }

  return dedupeFiles(files);
}

module.exports = {
  fetchLibraryFiles,
  filesFromPeopleMediaRelations,
  resolvePeopleMediaTypeLabel,
  fetchPeopleMediaFiles,
  fetchKnownFiles,
  synthesizeKnownImageFiles,
};
