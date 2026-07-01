const {
  buildOpenStreetMapEmbedUrl,
  resolveDefaultMapPayload,
} = require('../../../../react/components/map/DefaultMap.shared');

const {describe, expect, it} = global;

describe('DefaultMap.shared', () => {
  it('normalizes addresses into markers, user coordinates and derived paths', () => {
    const payload = resolveDefaultMapPayload({
      addresses: {
        origin: {
          id: 'origin-1',
          latitude: -23.55052,
          longitude: -46.633308,
          title: 'Origem',
        },
        destination: {
          id: 'destination-1',
          latitude: -23.563987,
          longitude: -46.654321,
          title: 'Destino',
        },
        markers: [
          {
            id: 'pickup-1',
            latitude: -23.551,
            longitude: -46.634,
            title: 'Parada extra',
          },
        ],
        user: {
          latitude: -23.549,
          longitude: -46.632,
        },
      },
    });

    expect(payload.userCoordinates).toEqual({
      latitude: -23.549,
      longitude: -46.632,
    });
    expect(payload.markerPayloads).toHaveLength(3);
    expect(payload.paths).toHaveLength(1);
    expect(payload.paths[0].from.title).toBe('Origem');
    expect(payload.paths[0].to.title).toBe('Destino');
  });

  it('builds an OpenStreetMap embed URL from the available points', () => {
    const url = buildOpenStreetMapEmbedUrl({
      markerPayloads: [
        {
          id: 'marker-1',
          latitude: -23.55052,
          longitude: -46.633308,
        },
      ],
      paths: [
        {
          id: 'path-1',
          from: {
            latitude: -23.551,
            longitude: -46.634,
          },
          to: {
            latitude: -23.563987,
            longitude: -46.654321,
          },
        },
      ],
      userCoordinates: {
        latitude: -23.549,
        longitude: -46.632,
      },
    });

    expect(url).toContain('openstreetmap.org/export/embed.html?bbox=');
    expect(url).toContain('layer=mapnik');
    expect(url).toContain('marker=');
  });

  it('resolves nested config addresses and api key from a single JSON payload', () => {
    const payload = resolveDefaultMapPayload({
      config: {
        googleMapsApiKey: 'config-key',
        addresses: {
          origin: {
            id: 'origin-1',
            latitude: -23.55,
            longitude: -46.63,
            nickname: 'Origem',
          },
          markers: [
            {
              id: 'marker-1',
              latitude: -23.56,
              longitude: -46.64,
              nickname: 'Destino',
            },
          ],
          user: {
            latitude: -23.54,
            longitude: -46.62,
          },
        },
      },
    });

    expect(payload.apiKey).toBe('config-key');
    expect(payload.markerPayloads).toHaveLength(2);
    expect(payload.userCoordinates).toEqual({
      latitude: -23.54,
      longitude: -46.62,
    });
  });
});
