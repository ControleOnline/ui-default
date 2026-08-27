import {
  isPostalLookupIncomplete,
  isValidCoord,
  mergePostalLookupPayload,
} from '../../../react/services/addressGeo';
import {mergePostalCodeData} from '../../../react/services/addressFormUtils';

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

  test('#637 form hydrate: API empty street + ViaCEP + coords → Atibaia fields', () => {
    const apiProd = {
      cep: '12941040',
      street: '',
      district: '',
      city: '',
      state: '',
      uf: '',
      country: 'Brasil',
      latitude: -23.117082,
      longitude: -46.5425915,
      provider: 'viacep+googlemaps',
    };
    expect(isPostalLookupIncomplete(apiProd)).toBe(true);

    const afterViaCep = mergePostalLookupPayload(
      apiProd,
      {
        street: 'Rua Antônio Bonini',
        district: 'Vila Santista',
        city: 'Atibaia',
        uf: 'SP',
        country: 'Brasil',
        provider: 'viacep-client',
      },
      'viacep-client',
    );
    expect(isPostalLookupIncomplete(afterViaCep)).toBe(false);

    const form = mergePostalCodeData(
      {
        nickname: '',
        number: '',
        complement: '',
        cep: '12941040',
        street: '',
        district: '',
        city: '',
        uf: '',
        countryCode: 'BR',
        latitude: null,
        longitude: null,
      },
      afterViaCep,
    );
    expect(form.street).toBe('Rua Antônio Bonini');
    expect(form.city).toBe('Atibaia');
    expect(form.uf).toBe('SP');
    expect(Number(form.latitude)).toBeCloseTo(-23.117, 2);
    expect(Number(form.longitude)).toBeCloseTo(-46.543, 2);
    expect(form.street).not.toBe('—');
    expect(form.city).not.toBe('—');
  });
});
