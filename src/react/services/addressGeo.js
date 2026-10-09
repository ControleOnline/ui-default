import {api} from '@controleonline/ui-common/src/api';

const onlyDigits = value => String(value || '').replace(/\D+/g, '');

const hasText = value => String(value || '').trim().length > 0;

export function isValidCoord(value) {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) > 0.000001;
}

export function isPostalLookupIncomplete(data) {
  if (!data || typeof data !== 'object') {
    return true;
  }
  const missingText = !hasText(data.street) || !hasText(data.city);
  const missingCoords =
    !isValidCoord(data.latitude ?? data?.map?.latitude) ||
    !isValidCoord(data.longitude ?? data?.map?.longitude);
  return missingText || missingCoords;
}

export function mergePostalLookupPayload(base, extra, providerSuffix) {
  const src = extra && typeof extra === 'object' ? extra : {};
  const next = {...(base && typeof base === 'object' ? base : {})};
  const fill = (key, value) => {
    if (!hasText(next[key]) && hasText(value)) {
      next[key] = value;
    }
  };
  fill('street', src.street);
  fill('district', src.district);
  fill('city', src.city);
  fill('state', src.state || src.uf);
  fill('uf', src.uf || src.state);
  fill('country', src.country);
  if (!isValidCoord(next.latitude) && isValidCoord(src.latitude)) {
    next.latitude = Number(src.latitude);
  }
  if (!isValidCoord(next.longitude) && isValidCoord(src.longitude)) {
    next.longitude = Number(src.longitude);
  }
  if (providerSuffix) {
    const current = String(next.provider || '').trim();
    next.provider = current
      ? `${current}+${providerSuffix}`
      : providerSuffix;
  }
  return next;
}

function mapViaCepPayload(json, digits) {
  if (!json || json.erro) {
    return null;
  }
  return {
    cep: digits,
    street: json.logradouro || '',
    district: json.bairro || '',
    city: json.localidade || '',
    state: json.uf || '',
    uf: json.uf || '',
    country: 'Brasil',
    provider: 'viacep-client',
  };
}

export async function lookupViaCep(cep) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }
  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) {
    throw new Error(`ViaCEP HTTP ${response.status}`);
  }
  const json = await response.json();
  const mapped = mapViaCepPayload(json, digits);
  if (!mapped) {
    throw new Error('CEP não encontrado');
  }
  return mapped;
}

function buildNominatimQuery(data, digits) {
  const cepFormatted =
    digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  return [
    data?.street,
    data?.district,
    data?.city,
    data?.uf || data?.state,
    cepFormatted,
    'Brasil',
  ]
    .map(part => String(part || '').trim())
    .filter(Boolean)
    .join(', ');
}

export async function lookupNominatimCoords(data, digits) {
  const q = buildNominatimQuery(data, digits);
  if (!q) {
    return null;
  }
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ControleOnline-ui-default/task-637',
    },
  });
  if (!response.ok) {
    return null;
  }
  const rows = await response.json();
  if (!Array.isArray(rows) || !rows[0]?.lat || !rows[0]?.lon) {
    return null;
  }
  return {
    latitude: Number(rows[0].lat),
    longitude: Number(rows[0].lon),
    formatted: rows[0].display_name || null,
    provider: 'nominatim-client',
  };
}

export async function lookupPostalCode(cep) {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  let payload = {cep: digits};
  let apiError = null;

  try {
    const apiData = await api.fetch(`postal-codes/${digits}`, {method: 'GET'});
    if (apiData && typeof apiData === 'object') {
      payload = {...payload, ...apiData, cep: digits};
    }
  } catch (e) {
    apiError = e;
  }

  if (!hasText(payload.street) || !hasText(payload.city)) {
    try {
      const viaCep = await lookupViaCep(digits);
      payload = mergePostalLookupPayload(payload, viaCep, viaCep.provider);
    } catch (e) {
      // ViaCEP "CEP não encontrado" (or HTTP error) must surface so the form
      // clears residual address/coords/number (#746) — do not swallow.
      if (isPostalLookupIncomplete(payload)) {
        throw new Error(
          e?.message ||
            apiError?.message ||
            apiError?.response?.data?.detail ||
            'CEP inválido ou serviço indisponível',
        );
      }
    }
  }

  if (
    !isValidCoord(payload.latitude ?? payload?.map?.latitude) ||
    !isValidCoord(payload.longitude ?? payload?.map?.longitude)
  ) {
    try {
      const geo = await lookupNominatimCoords(payload, digits);
      if (geo) {
        payload = mergePostalLookupPayload(payload, geo, geo.provider);
      }
    } catch {
      // coords optional if text fields already filled
    }
  }

  // No usable address text after all providers → treat as not found (#746)
  if (!hasText(payload.street) && !hasText(payload.city)) {
    throw new Error(
      apiError?.message ||
        apiError?.response?.data?.detail ||
        'CEP não encontrado',
    );
  }

  return payload;
}

export async function listCountries(q = '') {
  const params = q ? {q} : {};
  const data = await api.fetch('address-geo/countries', {method: 'GET', params});
  return Array.isArray(data?.member) ? data.member : [];
}

export async function listStates(country = 'BR') {
  const data = await api.fetch('address-geo/states', {
    method: 'GET',
    params: {country},
  });
  return Array.isArray(data?.member) ? data.member : [];
}

export function buildAddressSavePayload(form, peopleIri) {
  const payload = {
    street: form.street || '',
    city: form.city || '',
    district: form.district || '',
    state: form.uf || form.state || '',
    country: form.countryCode || form.country || 'BR',
    people: peopleIri,
    number: form.number ?? '',
    complement: form.complement || '',
    nickname: form.nickname || '',
    cep: onlyDigits(form.cep),
    latitude: form.latitude ?? 0,
    longitude: form.longitude ?? 0,
  };

  if (Array.isArray(form.categories)) {
    payload.categories = form.categories;
  } else if (Array.isArray(form.category)) {
    payload.category = form.category;
  }

  return payload;
}
