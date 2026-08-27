import {
  isPostalLookupIncomplete,
  isValidCoord,
  mergePostalLookupPayload,
} from '../../../react/services/addressGeo';

describe('addressGeo CEP fallback helpers', () => {
  test('isValidCoord rejects empty and 0,0 defaults', () => {
    expect(isValidCoord(null)).toBe(false);
    expect(isValidCoord(0)).toBe(false);
    expect(isValidCoord(-23.117)).toBe(true);
  });

  test('incomplete when API returns coords without street/city', () => {
    expect(
      isPostalLookupIncomplete({
        street: '',
        city: '',
        latitude: -23.117082,
        longitude: -46.5425915,
        provider: 'viacep+googlemaps',
      }),
    ).toBe(true);
  });

  test('merge fills ViaCEP text and keeps API coords', () => {
    const merged = mergePostalLookupPayload(
      {
        street: '',
        city: '',
        latitude: -23.117082,
        longitude: -46.5425915,
        provider: 'viacep+googlemaps',
      },
      {
        street: 'Rua Antônio Bonini',
        district: 'Vila Santista',
        city: 'Atibaia',
        uf: 'SP',
        country: 'Brasil',
      },
      'viacep-client',
    );
    expect(merged.street).toBe('Rua Antônio Bonini');
    expect(merged.city).toBe('Atibaia');
    expect(merged.uf).toBe('SP');
    expect(merged.latitude).toBe(-23.117082);
    expect(merged.provider).toBe('viacep+googlemaps+viacep-client');
  });
});
