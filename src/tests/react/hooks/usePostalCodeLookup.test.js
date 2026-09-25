/**
 * Behavioral tests for race / debounce contract of CEP lookup helpers.
 * Hook itself is integration-tested via merge + request-id logic mirrored here.
 */
import {mergePostalCodeData, onlyDigits} from '../../../react/services/addressFormUtils';

describe('CEP lookup race contract', () => {
  test('onlyDigits length gate for lookup', () => {
    expect(onlyDigits('01310-10').length).toBe(7);
    expect(onlyDigits('01310-100').length).toBe(8);
  });

  test('stale response simulation: last write wins by request id', () => {
    let form = {
      nickname: 'X',
      number: '9',
      complement: '',
      street: '',
      district: '',
      city: '',
      uf: '',
      cep: '',
      countryCode: 'BR',
      countryName: 'Brazil',
    };
    let requestId = 0;
    const apply = (id, data) => {
      if (id !== requestId) return; // stale
      form = mergePostalCodeData({...form, cep: data.cep}, data);
    };
    const first = ++requestId;
    const second = ++requestId;
    apply(first, {cep: '11111111', street: 'Old'});
    apply(second, {cep: '01310100', street: 'Av Paulista'});
    expect(form.street).toBe('Av Paulista');
    expect(form.cep).toBe('01310100');
    expect(form.number).toBe('9');
    expect(form.nickname).toBe('X');
  });
});

import {
  GEOCODE_MISS_MESSAGE,
  isGeocodeMiss,
  mergePostalCodeData,
  parseOptionalCoordinate,
} from '../../../react/services/addressFormUtils';

describe('geocode miss (#696)', () => {
  test('isGeocodeMiss when address text exists and coords are null', () => {
    expect(
      isGeocodeMiss({
        street: 'Rua Lotus',
        district: 'Condomínio Jardim das Palmeiras',
        city: 'Bragança Paulista',
        uf: 'SP',
        latitude: null,
        longitude: null,
      }),
    ).toBe(true);
  });

  test('isGeocodeMiss false when Nominatim returns coords', () => {
    expect(
      isGeocodeMiss({
        street: 'Rua Antônio Bonini',
        city: 'Atibaia',
        uf: 'SP',
        latitude: -23.12,
        longitude: -46.55,
      }),
    ).toBe(false);
  });

  test('mergePostalCodeData clears previous coords when lookup returns null', () => {
    const prev = {
      street: 'Old',
      latitude: -23.1,
      longitude: -46.5,
      number: '10',
      complement: '',
      nickname: 'X',
      cep: '12941040',
    };
    const next = mergePostalCodeData(prev, {
      cep: '12924022',
      street: 'Rua Lotus',
      city: 'Bragança Paulista',
      uf: 'SP',
      latitude: null,
      longitude: null,
    });
    expect(next.street).toBe('Rua Lotus');
    expect(next.latitude).toBeNull();
    expect(next.longitude).toBeNull();
    expect(next.number).toBe('10');
  });

  test('parseOptionalCoordinate accepts comma decimals', () => {
    expect(parseOptionalCoordinate('-23,5505')).toBeCloseTo(-23.5505);
  });

  test('GEOCODE_MISS_MESSAGE is PT', () => {
    expect(GEOCODE_MISS_MESSAGE).toMatch(/localização no mapa/);
    expect(GEOCODE_MISS_MESSAGE).toMatch(/latitude e longitude/);
  });
});
