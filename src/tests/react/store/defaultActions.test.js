/* global describe, expect, it */

global.localStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

const {
  STORE_ACTION_META_KEY,
  splitStoreActionPayload,
  buildStoreErrorCommitOptions,
} = require('../../../store/default/actions')

describe('default store action controls', () => {
  it('separates local store metadata from the request payload', () => {
    const input = {
      id: '15',
      phone: 925578229,
      [STORE_ACTION_META_KEY]: {
        skipSystemError: true,
        dedupeKey: 'phone-save',
      },
    }

    const result = splitStoreActionPayload(input)

    expect(result).toEqual({
      payload: {
        id: '15',
        phone: 925578229,
      },
      storeMeta: {
        skipSystemError: true,
        dedupeKey: 'phone-save',
      },
    })
    expect(input[STORE_ACTION_META_KEY]).toEqual({
      skipSystemError: true,
      dedupeKey: 'phone-save',
    })
  })

  it('builds commit options only from supported metadata', () => {
    expect(
      buildStoreErrorCommitOptions({
        skipSystemError: true,
        dedupeKey: 'contact-save',
        providerKey: 'modal',
        position: 'top',
        ignored: true,
      }),
    ).toEqual({
      skipSystemError: true,
      dedupeKey: 'contact-save',
      providerKey: 'modal',
      position: 'top',
    })
  })
})
