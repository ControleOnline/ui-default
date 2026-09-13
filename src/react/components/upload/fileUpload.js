import {Platform} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {env as APP_ENV} from '@env';

const extractId = value => {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') return value;

  const raw = typeof value === 'string' ? value : value?.id || value?.['@id'];
  if (!raw) return null;

  const match = String(raw).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const readSessionToken = () => {
  try {
    const sessionString =
      typeof localStorage !== 'undefined' ? localStorage.getItem('session') : null;
    if (!sessionString) return '';
    const cleanString =
      typeof sessionString === 'string' && sessionString.startsWith('__q_objt|')
        ? sessionString.substring('__q_objt|'.length)
        : sessionString;
    const session = JSON.parse(cleanString || '{}');
    return session?.api_key || session?.token || '';
  } catch (e) {
    return '';
  }
};

export const uploadFileToApi = async ({file, context = 'products', peopleId, entityId}) => {
  const token = readSessionToken();
  if (!token) throw new Error('Sessao invalida para upload.');

  const apiEntryPoint = String(APP_ENV?.API_ENTRYPOINT || '').replace(/\/$/, '');
  const host = APP_ENV?.DOMAIN || (typeof location !== 'undefined' ? location.host : '');
  if (!apiEntryPoint) throw new Error('API_ENTRYPOINT nao configurado.');

  const formData = new FormData();

  if (Platform.OS === 'web') {
    formData.append('file', file);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'imagem.jpg',
      type: file.mimeType || file.type || 'image/jpeg',
    });
  }

  formData.append('context', context);
  if (peopleId) formData.append('people', String(extractId(peopleId)));
  if (entityId) formData.append('id', String(extractId(entityId)));

  const response = await fetch(`${apiEntryPoint}/files/upload`, {
    method: 'POST',
    headers: {
      'API-TOKEN': token,
      'App-Domain': host,
      Accept: 'application/json',
    },
    body: formData,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.['@type'] === 'Error') {
    throw new Error(result?.description || result?.message || 'Falha no upload do arquivo.');
  }

  const id = extractId(result?.id || result?.['@id'] || result);
  return {
    ...result,
    id: result?.id || id,
    '@id': result?.['@id'] || (id ? `/files/${id}` : undefined),
    fileName:
      result?.fileName ||
      result?.name ||
      result?.originalName ||
      (file && (file.name || file.fileName)) ||
      (id ? `Arquivo ${id}` : 'Arquivo'),
    fileType: result?.fileType || result?.mimeType || 'image',
    context: result?.context || context,
  };
};

/**
 * Web file picker: input must be in the DOM; avoid focus-race that resolves null
 * before the user finishes choosing (first click appeared to "do nothing").
 */
export const selectFile = async (acceptedTypes = '*/*') => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptedTypes || '';
      input.multiple = false;
      input.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;width:0;height:0;';

      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        try {
          if (input.parentNode) input.parentNode.removeChild(input);
        } catch (e) {
          // ignore
        }
        resolve(value || null);
      };

      input.addEventListener('change', () => {
        finish(input.files && input.files[0] ? input.files[0] : null);
      });
      // Chromium cancel event when user dismisses the dialog
      input.addEventListener('cancel', () => finish(null));

      document.body.appendChild(input);
      // Defer click one frame so it stays tied to the user gesture reliably
      requestAnimationFrame(() => {
        try {
          input.click();
        } catch (e) {
          finish(null);
        }
      });
    });
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: acceptedTypes || '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result?.canceled) {
    return null;
  }

  return result?.assets?.[0] || null;
};

export const toFileIri = fileObj => {
  const iri = fileObj?.['@id'];
  if (iri) return iri;

  const id = extractId(fileObj?.id || fileObj);
  return id ? `/files/${id}` : null;
};

export const extractFileId = extractId;
