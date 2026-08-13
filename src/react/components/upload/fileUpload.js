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

export const uploadFileToApi = async ({file, context = 'products', peopleId, entityId}) => {
  const session = JSON.parse(localStorage.getItem('session') || '{}');
  const token = session?.api_key || session?.token;
  if (!token) throw new Error('Sessao invalida para upload.');

  const apiEntryPoint = String(APP_ENV?.API_ENTRYPOINT || '').replace(/\/$/, '');
  const host = APP_ENV?.DOMAIN || (typeof location !== 'undefined' ? location.host : '');
  if (!apiEntryPoint) throw new Error('API_ENTRYPOINT nao configurado.');

  const formData = new FormData();

  if (Platform.OS === 'web') {
    if (!file || (typeof Blob !== 'undefined' && !(file instanceof Blob) && !(typeof File !== 'undefined' && file instanceof File))) {
      throw new Error('Arquivo invalido para upload.');
    }
    if (typeof file.size === 'number' && file.size <= 0) {
      throw new Error('Arquivo vazio.');
    }
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

  return result;
};

export const selectFile = async (acceptedTypes = '*/*') => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      if (acceptedTypes) {
        input.accept = acceptedTypes;
      }
      input.onchange = event => resolve(event?.target?.files?.[0] || null);
      input.click();
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
