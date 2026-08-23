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
 * Always preserves number, complement and nickname (manual fields).
 * When preserveFilledFields is true, also keeps non-empty street/city/etc.
 */
export function mergePostalCodeData(
  prev,
  data,
  {preserveFilledFields = false} = {},
) {
  const keep = (key, nextValue) =>
    preserveFilledFields && String(prev[key] || '').trim()
      ? prev[key]
      : nextValue || prev[key] || '';

  const countryRaw = data?.country;
  const isBrazil =
    countryRaw === 'Brasil' || countryRaw === 'Brazil' || countryRaw === 'BR';

  return {
    ...prev,
    // Manual fields never overwritten by lookup
    number: prev.number,
    complement: prev.complement,
    nickname: prev.nickname,
    cep: onlyDigits(data?.cep || prev.cep),
    street: keep('street', data?.street),
    district: keep('district', data?.district),
    city: keep('city', data?.city),
    uf: keep('uf', data?.uf || data?.state),
    stateName: keep('stateName', data?.state),
    countryCode: isBrazil ? 'BR' : countryRaw || prev.countryCode,
    countryName: isBrazil
      ? 'Brazil'
      : countryRaw || prev.countryName,
    latitude: data?.latitude ?? data?.map?.latitude ?? prev.latitude,
    longitude: data?.longitude ?? data?.map?.longitude ?? prev.longitude,
    mapStaticUrl: data?.map?.staticUrl || prev.mapStaticUrl || null,
    facadeUrl: data?.facade?.streetViewUrl || prev.facadeUrl || null,
    provider: data?.provider || prev.provider || null,
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
