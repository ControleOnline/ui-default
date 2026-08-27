/* global describe, expect, test, beforeEach */

jest.mock('@controleonline/ui-common/src/api', () => ({
  api: {
    fetch: jest.fn(),
  },
}));

const {api} = require('@controleonline/ui-common/src/api');
const {lookupPostalCode} = require('../../../react/services/addressGeo');
const {mergePostalCodeData} = require('../../../react/services/addressFormUtils');

const CEP = '12941040';

const API_PROD_INCOMPLETE = {
  cep: CEP,
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

describe('lookupPostalCode #637 (prod payload + client fallback)', () => {
  beforeEach(() => {
    api.fetch.mockReset();
    global.fetch = jest.fn();
  });

  test('API 200 with empty street/city is completed by ViaCEP; coords stay from API', async () => {
    api.fetch.mockResolvedValue(API_PROD_INCOMPLETE);
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        erro: false,
        logradouro: 'Rua Antônio Bonini',
        bairro: 'Vila Santista',
        localidade: 'Atibaia',
        uf: 'SP',
      }),
    });

    const payload = await lookupPostalCode(CEP);

    expect(api.fetch).toHaveBeenCalledWith(`postal-codes/${CEP}`, {
      method: 'GET',
    });
    expect(payload.street).toBe('Rua Antônio Bonini');
    expect(payload.city).toBe('Atibaia');
    expect(payload.uf).toBe('SP');
    expect(payload.district).toBe('Vila Santista');
    expect(Number(payload.latitude)).toBeCloseTo(-23.117, 2);
    expect(Number(payload.longitude)).toBeCloseTo(-46.543, 2);
    expect(String(payload.provider)).toContain('viacep-client');

    const form = mergePostalCodeData(
      {
        nickname: '',
        number: '',
        complement: '',
        cep: CEP,
        street: '',
        district: '',
        city: '',
        uf: '',
        countryCode: 'BR',
        latitude: null,
        longitude: null,
      },
      payload,
    );
    expect(form.street).toBe('Rua Antônio Bonini');
    expect(form.city).toBe('Atibaia');
    expect(form.uf).toBe('SP');
    expect(String(form.latitude)).not.toBe('');
    expect(String(form.latitude)).not.toBe('—');
    expect(String(form.longitude)).not.toBe('—');
  });

  test('does not throw Postalcode services are not available when ViaCEP fills text', async () => {
    api.fetch.mockRejectedValue({
      message: 'Postalcode services are not available',
      response: {data: {detail: 'Postalcode services are not available'}},
    });
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: 'Rua Antônio Bonini',
        bairro: 'Vila Santista',
        localidade: 'Atibaia',
        uf: 'SP',
      }),
    });

    const payload = await lookupPostalCode(CEP);
    expect(payload.street).toBe('Rua Antônio Bonini');
    expect(payload.city).toBe('Atibaia');
    expect(payload.uf).toBe('SP');
  });
});
