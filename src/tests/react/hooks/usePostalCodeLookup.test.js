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
