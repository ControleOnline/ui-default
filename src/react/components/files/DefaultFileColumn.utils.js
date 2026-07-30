import {extractFileId, resolveDefaultFileUrl} from '@controleonline/ui-common/src/react/utils/fileUrl';

const FILE_INPUT_TYPES = new Set([
  'document',
  'documents',
  'file',
  'files',
  'image',
  'images',
  'pdf',
]);

const IMAGE_EXTENSIONS = new Set(['avif', 'bmp', 'gif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'webp']);
const PDF_EXTENSIONS = new Set(['pdf']);
const DOCUMENT_EXTENSIONS = new Set(['doc', 'docx', 'odt', 'rtf', 'xls', 'xlsx', 'ods', 'ppt', 'pptx', 'odp']);

export const normalizeFileColumnText = value => String(value ?? '').trim();

export const normalizeFileColumnType = value =>
  normalizeFileColumnText(value).replace(/[^a-z0-9]/gi, '').toLowerCase();

export const isFileInputColumn = column =>
  FILE_INPUT_TYPES.has(normalizeFileColumnType(column?.inputType));

const asArray = value => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  if (typeof value === 'string' && value.includes(',')) {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [value];
};

const pickFilePayload = item =>
  item && typeof item === 'object' && !Array.isArray(item) && item.file
    ? item.file
    : item;

const resolveForcedFileType = column => {
  const inputType = normalizeFileColumnType(column?.inputType);
  if (inputType === 'image' || inputType === 'images') return 'image';
  if (inputType === 'pdf') return 'application';
  if (inputType === 'document' || inputType === 'documents') return 'document';
  return normalizeFileColumnText(column?.fileType);
};

const resolveForcedExtension = column => {
  const inputType = normalizeFileColumnType(column?.inputType);
  if (inputType === 'pdf') return 'pdf';
  return normalizeFileColumnText(column?.extension).toLowerCase();
};

const resolveKind = ({fileType, extension}) => {
  const normalizedType = normalizeFileColumnType(fileType);
  const normalizedExtension = normalizeFileColumnText(extension).replace(/^\./, '').toLowerCase();

  if (normalizedType === 'image' || IMAGE_EXTENSIONS.has(normalizedExtension)) return 'image';
  if (PDF_EXTENSIONS.has(normalizedExtension)) return 'pdf';
  if (DOCUMENT_EXTENSIONS.has(normalizedExtension) || normalizedType === 'document') return 'document';
  if (normalizedType === 'text') return 'text';
  if (normalizedType === 'audio') return 'audio';
  if (normalizedType === 'video') return 'video';
  return 'file';
};

export const normalizeDefaultFileColumnItems = ({
  column = {},
  company = null,
  row = {},
  value,
} = {}) =>
  asArray(value ?? row?.[column?.key || column?.name]).map((item, index) => {
    const payload = pickFilePayload(item);
    const isObject = payload && typeof payload === 'object' && !Array.isArray(payload);
    const id = extractFileId(payload);
    const fileType = isObject
      ? normalizeFileColumnText(payload.fileType) || resolveForcedFileType(column)
      : resolveForcedFileType(column);
    const extension = isObject
      ? normalizeFileColumnText(payload.extension).toLowerCase() || resolveForcedExtension(column)
      : resolveForcedExtension(column);
    const url = isObject && typeof payload.url === 'string'
      ? payload.url
      : resolveDefaultFileUrl(payload, {company});
    const driveUrl = isObject && typeof payload.driveUrl === 'string'
      ? payload.driveUrl
      : '';

    return {
      extension,
      fileName: isObject ? normalizeFileColumnText(payload.fileName) : '',
      fileType,
      id,
      key: `${id || normalizeFileColumnText(payload) || index}`,
      kind: resolveKind({fileType, extension}),
      openUrl: driveUrl || url,
      relationId: item && typeof item === 'object' && !Array.isArray(item) ? extractFileId(item) : null,
      source: payload,
    };
  });
