/**
 * Unit tests for defaultAddressHelpers (app-community#283).
 */
import {
  emptyForm,
  hasCoordinates,
  hydrateFromRow,
  mergePostalCodeData,
  onlyDigits,
  parseOptionalCoordinate,
  buildMapMarkerPayload,
} from '../../../../react/components/address/defaultAddressHelpers';

describe('defaultAddressHelpers', () => {
  test('onlyDigits strips non-digits', () => {
    expect(onlyDigits('12.345-678')).toBe('12345678');
    expect(onlyDigits(null)).toBe('');
  });

  test('parseOptionalCoordinate accepts number and comma decimal', () => {
    expect(parseOptionalCoordinate('-23.5505')).toBe(-23.5505);
    expect(parseOptionalCoordinate('-46,6333')).toBeCloseTo(-46.6333);
    expect(parseOptionalCoordinate('')).toBeNull();
    expect(parseOptionalCoordinate('abc')).toBeNull();
  });

  test('hasCoordinates requires both finite values', () => {
    expect(hasCoordinates({latitude: -23.5, longitude: -46.6})).toBe(true);
    expect(hasCoordinates({latitude: null, longitude: -46.6})).toBe(false);
    expect(hasCoordinates(emptyForm)).toBe(false);
  });

  test('hydrateFromRow maps nested street/district/city/state', () => {
    const row = {
      nickname: 'Matriz',
      number: 100,
      latitude: -23.5,
      longitude: -46.6,
      street: {
        street: 'Av Paulista',
        cep: {cep: '01310100'},
        district: {
          district: 'Bela Vista',
          city: {
            city: 'São Paulo',
            state: {
              uf: 'SP',
              state: 'São Paulo',
              country: {countrycode: 'BR', countryname: 'Brazil'},
            },
          },
        },
      },
    };
    const form = hydrateFromRow(row);
    expect(form.street).toBe('Av Paulista');
    expect(form.district).toBe('Bela Vista');
    expect(form.city).toBe('São Paulo');
    expect(form.uf).toBe('SP');
    expect(form.cep).toBe('01310100');
    expect(form.latitude).toBe(-23.5);
    expect(form.longitude).toBe(-46.6);
  });

  test('mergePostalCodeData fills lat/long from provider payload', () => {
    const prev = {...emptyForm, street: 'Rua A'};
    const data = {
      cep: '01310100',
      street: 'Av Paulista',
      city: 'São Paulo',
      uf: 'SP',
      country: 'Brasil',
      latitude: -23.561,
      longitude: -46.656,
      map: {staticUrl: 'https://example.com/map'},
      provider: 'googlemaps',
    };
    const next = mergePostalCodeData(prev, data);
    expect(next.latitude).toBe(-23.561);
    expect(next.longitude).toBe(-46.656);
    expect(next.provider).toBe('googlemaps');
    expect(next.mapStaticUrl).toBe('https://example.com/map');
    expect(next.countryCode).toBe('BR');
  });

  test('buildMapMarkerPayload returns null without address or coords', () => {
    expect(buildMapMarkerPayload(emptyForm)).toBeNull();
  });

  test('buildMapMarkerPayload includes coords when present', () => {
    const payload = buildMapMarkerPayload({
      ...emptyForm,
      street: 'Av Paulista',
      number: '1000',
      city: 'São Paulo',
      uf: 'SP',
      latitude: -23.5,
      longitude: -46.6,
    });
    expect(payload).not.toBeNull();
    expect(payload.latitude).toBe(-23.5);
    expect(payload.longitude).toBe(-46.6);
  });
});
