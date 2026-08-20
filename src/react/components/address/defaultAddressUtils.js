/**
 * Helpers for DefaultAddress form (hydration, CEP merge, geolocation).
 */
const emptyForm = {
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

const hydrateFromRow = row => {
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
  };
};

const onlyDigits = value => String(value || '').replace(/\D+/g, '');

const hasAddressText = form =>
  [
    form?.street,
    form?.number,
    form?.district,
    form?.city,
    form?.uf,
    form?.cep,
  ].some(value => String(value || '').trim().length > 0);

const hasCoordinates = form =>
  Number.isFinite(Number(form?.latitude)) && Number.isFinite(Number(form?.longitude));

const mergePostalCodeData = (prev, data, {preserveFilledFields = false} = {}) => {
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

const getCurrentCoordinates = () =>
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


export {
  emptyForm,
  hydrateFromRow,
  onlyDigits,
  hasAddressText,
  hasCoordinates,
  mergePostalCodeData,
  getCurrentCoordinates,
};
