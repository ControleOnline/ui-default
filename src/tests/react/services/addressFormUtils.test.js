import {
  mergePostalCodeData,
  onlyDigits,
  hydrateAddressFromRow,
  hasCoordinates,
} from '../../../react/services/addressFormUtils';

describe('addressFormUtils', () => {
  test('onlyDigits strips non-digits and keeps order', () => {
    expect(onlyDigits('01310-100')).toBe('01310100');
    expect(onlyDigits('abc')).toBe('');
  });

  test('mergePostalCodeData fills empty fields from API', () => {
    const prev = {
      nickname: 'Casa',
      number: '100',
      complement: 'Apto 1',
      cep: '',
      street: '',
      district: '',
      city: '',
      uf: '',
      stateName: '',
      countryCode: 'BR',
      countryName: 'Brazil',
      latitude: null,
      longitude: null,
    };
    const data = {
      cep: '01310100',
      street: 'Av Paulista',
      district: 'Bela Vista',
      city: 'São Paulo',
      uf: 'SP',
      state: 'São Paulo',
      country: 'Brasil',
      latitude: -23.5,
      longitude: -46.6,
    };
    const next = mergePostalCodeData(prev, data);
    expect(next.street).toBe('Av Paulista');
    expect(next.district).toBe('Bela Vista');
    expect(next.city).toBe('São Paulo');
    expect(next.uf).toBe('SP');
    expect(next.cep).toBe('01310100');
    expect(next.number).toBe('100');
    expect(next.complement).toBe('Apto 1');
    expect(next.nickname).toBe('Casa');
    expect(next.countryCode).toBe('BR');
  });

  test('mergePostalCodeData never clears number/complement/nickname', () => {
    const prev = {
      nickname: 'Trabalho',
      number: '42',
      complement: 'Sala 3',
      street: 'Rua X',
      district: 'Centro',
      city: 'Rio',
      uf: 'RJ',
      cep: '20000000',
      countryCode: 'BR',
      countryName: 'Brazil',
    };
    const data = {
      cep: '01310100',
      street: 'Av Paulista',
      district: 'Bela Vista',
      city: 'São Paulo',
      uf: 'SP',
      country: 'Brazil',
    };
    const next = mergePostalCodeData(prev, data);
    expect(next.number).toBe('42');
    expect(next.complement).toBe('Sala 3');
    expect(next.nickname).toBe('Trabalho');
    expect(next.street).toBe('Av Paulista');
  });

  test('preserveFilledFields keeps existing street/city', () => {
    const prev = {
      nickname: '',
      number: '1',
      complement: '',
      street: 'Minha Rua',
      district: '',
      city: 'Minha Cidade',
      uf: '',
      cep: '01310100',
      countryCode: 'BR',
      countryName: 'Brazil',
    };
    const data = {
      street: 'API Street',
      district: 'API Dist',
      city: 'API City',
      uf: 'SP',
      cep: '01310100',
    };
    const next = mergePostalCodeData(prev, data, {preserveFilledFields: true});
    expect(next.street).toBe('Minha Rua');
    expect(next.city).toBe('Minha Cidade');
    expect(next.district).toBe('API Dist');
    expect(next.uf).toBe('SP');
  });

  test('hydrateAddressFromRow maps nested street entities', () => {
    const row = {
      nickname: 'HQ',
      number: 10,
      complement: 'Bloco B',
      street: {
        street: 'Rua Nested',
        district: {
          district: 'Centro',
          city: {
            city: 'Campinas',
            state: {uf: 'SP', state: 'São Paulo', country: {countrycode: 'BR', countryname: 'Brazil'}},
          },
        },
        cep: {cep: '13000000'},
      },
    };
    const form = hydrateAddressFromRow(row);
    expect(form.street).toBe('Rua Nested');
    expect(form.district).toBe('Centro');
    expect(form.city).toBe('Campinas');
    expect(form.uf).toBe('SP');
    expect(form.cep).toBe('13000000');
    expect(form.number).toBe('10');
  });

  test('hasCoordinates requires finite lat/lng', () => {
    expect(hasCoordinates({latitude: -23, longitude: -46})).toBe(true);
    expect(hasCoordinates({latitude: null, longitude: -46})).toBe(false);
    expect(hasCoordinates({latitude: 0, longitude: 0})).toBe(false);
    expect(hasCoordinates({latitude: '0', longitude: '0'})).toBe(false);
  });
});
