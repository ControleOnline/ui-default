const onlyDigits = value => String(value || '').replace(/\D+/g, '');

export const emptyAddressForm = {
  nickname: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  uf: '',
  stateName: '',
  countryCode: 'BR',
  countryName: 'Brazil',
  latitude: null,
  longitude: null,
  mapStaticUrl: null,
  facadeUrl: null,
  provider: null,
};

export function hydrateAddressFromRow(row) {
  if (!row || typeof row !== 'object') {
    return {...emptyAddressForm};
  }
  const street = row?.street?.street || row?.street || '';
  const district = row?.street?.district?.district || row?.district || '';
  const city = row?.street?.district?.city?.city || row?.city || '';
  const stateEntity = row?.street?.district?.city?.state || row?.state;
  const countryEntity = stateEntity?.country || row?.country;
  return {
    ...emptyAddressForm,
    nickname: row?.nickname || '',
    cep: String(row?.street?.cep?.cep || row?.cep || row?.postal_code || ''),
    street: typeof street === 'string' ? street : '',
    number: row?.number != null ? String(row.number) : '',
    complement: row?.complement || '',
    district,
    city,
    uf: stateEntity?.uf || row?.uf || '',
    stateName: stateEntity?.state || '',
    countryCode: countryEntity?.countrycode || countryEntity?.code || 'BR',
    countryName: countryEntity?.countryname || countryEntity?.name || 'Brazil',
    latitude: row?.latitude ?? null,
    longitude: row?.longitude ?? null,
  };
}

export function hasAddressText(form) {
  return [
    form?.street,
    form?.number,
    form?.district,
    form?.city,
    form?.uf,
    form?.cep,
  ].some(value => String(value || '').trim().length > 0);
}

export function hasCoordinates(form) {
  const lat = Number(form?.latitude);
  const lng = Number(form?.longitude);
  // 0,0 is the API/entity default for "no coordinates"
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001)
  );
}

/**
 * Merge postal-code API payload into form state.
 * Preserves complement and nickname (manual).
 * On CEP lookup (preserveFilledFields=false): clears number and replaces
 * auto-filled address/coords — no residual from previous CEP (#746).
 * When preserveFilledFields is true, also keeps non-empty street/city/etc.
 */
export function mergePostalCodeData(
  prev,
  data,
  {preserveFilledFields = false} = {},
) {
  const pick = (key, nextValue) => {
    if (preserveFilledFields && String(prev[key] || '').trim()) {
      return prev[key];
    }
    if (
      nextValue !== undefined &&
      nextValue !== null &&
      String(nextValue).trim() !== ''
    ) {
      return nextValue;
    }
    // Fresh CEP lookup must not keep residual street/city/etc.
    if (!preserveFilledFields) {
      return nextValue == null ? '' : String(nextValue);
    }
    return prev[key] || '';
  };

  const countryRaw = data?.country;
  const isBrazil =
    countryRaw === 'Brasil' || countryRaw === 'Brazil' || countryRaw === 'BR';

  const latitude =
    data?.latitude !== undefined
      ? data.latitude
      : data?.map?.latitude !== undefined
        ? data.map.latitude
        : preserveFilledFields
          ? prev.latitude
          : null;
  const longitude =
    data?.longitude !== undefined
      ? data.longitude
      : data?.map?.longitude !== undefined
        ? data.map.longitude
        : preserveFilledFields
          ? prev.longitude
          : null;

  return {
    ...prev,
    // Número do imóvel anterior não se aplica ao novo CEP (#746)
    number: preserveFilledFields ? prev.number : '',
    complement: prev.complement,
    nickname: prev.nickname,
    cep: onlyDigits(data?.cep || prev.cep),
    street: pick('street', data?.street),
    district: pick('district', data?.district),
    city: pick('city', data?.city),
    uf: pick('uf', data?.uf || data?.state),
    stateName: pick('stateName', data?.state),
    countryCode: isBrazil ? 'BR' : countryRaw || prev.countryCode || 'BR',
    countryName: isBrazil
      ? 'Brazil'
      : countryRaw || prev.countryName || 'Brazil',
    latitude,
    longitude,
    mapStaticUrl: preserveFilledFields
      ? data?.map?.staticUrl || prev.mapStaticUrl || null
      : data?.map?.staticUrl || null,
    facadeUrl: preserveFilledFields
      ? data?.facade?.streetViewUrl || prev.facadeUrl || null
      : data?.facade?.streetViewUrl || null,
    provider: data?.provider || (preserveFilledFields ? prev.provider : null) || null,
  };
}

/** Clear fields derived from a previous CEP when lookup fails (#746). */
export function clearPostalCodeDerivedFields(prev) {
  return {
    ...prev,
    number: '',
    street: '',
    district: '',
    city: '',
    uf: '',
    stateName: '',
    latitude: null,
    longitude: null,
    mapStaticUrl: null,
    facadeUrl: null,
    provider: null,
  };
}

export function buildMapMarkerPayload(form) {
  if (!hasAddressText(form) && !hasCoordinates(form)) {
    return null;
  }
  const addressLine = [form.street, form.number].filter(Boolean).join(', ');
  const addressExtra = [
    form.district,
    [form.city, form.uf].filter(Boolean).join(' - '),
    form.countryName || form.countryCode,
    form.cep,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    id: 'default-address-preview',
    title: form.nickname || 'Endereco',
    addressLine: addressLine || addressExtra || 'Endereco',
    addressExtra,
    latitude: form.latitude,
    longitude: form.longitude,
    geocodeQuery: [
      addressLine,
      form.district,
      [form.city, form.uf].filter(Boolean).join(' - '),
      form.countryName || form.countryCode,
      form.cep,
    ]
      .filter(Boolean)
      .join(', '),
  };
}

export {onlyDigits};

export const GEOCODE_MISS_MESSAGE =
  'Não foi possível obter a localização no mapa para este endereço. Você pode ajustar latitude e longitude manualmente.';

export function parseOptionalCoordinate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(String(value).trim().replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : null;
}

/** True when CEP/address text arrived but Nominatim (or API) left coords empty. */
export function isGeocodeMiss(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const hasText = [
    data.street,
    data.district,
    data.city,
    data.uf,
    data.state,
  ].some(value => String(value || '').trim().length > 0);
  if (!hasText) {
    return false;
  }
  const lat = data.latitude ?? data.map?.latitude;
  const lon = data.longitude ?? data.map?.longitude;
  return !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon));
}

export function getCurrentCoordinates() {
  return new Promise(resolve => {
    const geolocation =
      typeof navigator !== 'undefined' ? navigator.geolocation : null;

    if (!geolocation?.getCurrentPosition) {
      resolve(null);
      return;
    }

    geolocation.getCurrentPosition(
      position => {
        const latitude = Number(position?.coords?.latitude);
        const longitude = Number(position?.coords?.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          resolve(null);
          return;
        }

        resolve({latitude, longitude});
      },
      () => resolve(null),
      {enableHighAccuracy: true, timeout: 8000, maximumAge: 60000},
    );
  });
}
