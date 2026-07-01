/* global describe, expect, it */

global.localStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

jest.mock('@controleonline/ui-common/src/api', () => ({
  api: {
    fetch: jest.fn(),
  },
}))

const {api} = require('@controleonline/ui-common/src/api')
const types = require('../../../store/default/mutation_types')
const {
  STORE_ACTION_META_KEY,
  splitStoreActionPayload,
  buildStoreErrorCommitOptions,
  get,
} = require('../../../store/default/actions')

describe('default store action controls', () => {
  beforeEach(() => {
    api.fetch.mockReset()
  })

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

  it('keeps the current item mounted while reloading when preserveItem is requested', async () => {
    api.fetch.mockResolvedValue({
      '@id': '/orders/15',
      id: 15,
      name: 'Pedido atualizado',
    })

    const commit = jest.fn()
    const getters = {
      resourceEndpoint: 'orders',
      item: {
        '@id': '/orders/15',
        id: 15,
        name: 'Pedido antigo',
      },
    }

    await get(
      {commit, getters},
      {
        id: '15',
        [STORE_ACTION_META_KEY]: {
          preserveItem: true,
        },
      },
    )

    expect(api.fetch).toHaveBeenCalledWith('orders/15', {})
    expect(commit).toHaveBeenCalledWith(types.SET_ISLOADING, true)
    expect(commit).toHaveBeenCalledWith(types.SET_ERROR, null)
    expect(commit).not.toHaveBeenCalledWith(types.SET_ITEM, {})
    expect(commit).toHaveBeenCalledWith(types.SET_ITEM, {
      '@id': '/orders/15',
      id: 15,
      name: 'Pedido atualizado',
    })
    expect(commit).toHaveBeenCalledWith(types.SET_ISLOADING, false)
  })
})
