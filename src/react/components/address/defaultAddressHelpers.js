/**
 * Pure helpers for DefaultAddress — keep the component under the 500-line limit.
 * @see app-community#283 (franchise address lat/long + manual fields)
 */

export const emptyForm = {
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
  categories: [],
};

export const onlyDigits = value => String(value || '').replace(/\D+/g, '');

export const hydrateFromRow = row => {
  if (!row || typeof row !== 'object') {
    return {...emptyForm};
  }
  const street = row?.street?.street || row?.street || '';
  const district = row?.street?.district?.district || row?.district || '';
  const city = row?.street?.district?.city?.city || row?.city || '';
  const stateEntity = row?.street?.district?.city?.state || row?.state;
  const countryEntity = stateEntity?.country || row?.country;
  return {
    ...emptyForm,
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
    categories: Array.isArray(row?.categories)
      ? row.categories
      : Array.isArray(row?.category)
        ? row.category
        : [],
  };
};

export const hasAddressText = form =>
  [form?.street, form?.number, form?.district, form?.city, form?.uf, form?.cep].some(
    value => String(value || '').trim().length > 0,
  );

export const hasCoordinates = form =>
  Number.isFinite(Number(form?.latitude)) && Number.isFinite(Number(form?.longitude));

export const parseOptionalCoordinate = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const mergePostalCodeData = (prev, data, {preserveFilledFields = false} = {}) => {
  const keep = (key, nextValue) =>
    preserveFilledFields && String(prev[key] || '').trim()
      ? prev[key]
      : nextValue || prev[key];

  return {
    ...prev,
    cep: onlyDigits(data.cep || prev.cep),
    street: keep('street', data.street),
    district: keep('district', data.district),
    city: keep('city', data.city),
    uf: keep('uf', data.uf || data.state),
    stateName: keep('stateName', data.state),
    countryCode:
      data.country === 'Brasil' || data.country === 'Brazil'
        ? 'BR'
        : data.country || prev.countryCode,
    countryName:
      data.country === 'Brasil' ? 'Brazil' : data.country || prev.countryName,
    latitude: data.latitude ?? data.map?.latitude ?? prev.latitude,
    longitude: data.longitude ?? data.map?.longitude ?? prev.longitude,
    mapStaticUrl: data.map?.staticUrl || prev.mapStaticUrl || null,
    facadeUrl: data.facade?.streetViewUrl || prev.facadeUrl || null,
    provider: data.provider || prev.provider || null,
  };
};

export const getCurrentCoordinates = () =>
  new Promise(resolve => {
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

export const buildMapMarkerPayload = form => {
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
};
