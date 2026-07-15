import {resolveAddressDisplayParts} from '@controleonline/ui-common/src/react/utils/entityDisplay';

const normalizeText = value => String(value ?? '').trim();

const isMapConfigObject = value =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeCoordinate = value => {
  const numeric = Number(String(value ?? '').replace(',', '.'));

  return Number.isFinite(numeric) ? numeric : null;
};

const serializeForHtml = value =>
  JSON.stringify(value ?? null).replace(/</g, '\\u003c');

export const extractMapCoordinates = address => {
  if (!address || typeof address !== 'object') {
    return null;
  }

  const latitude = normalizeCoordinate(address.latitude);
  const longitude = normalizeCoordinate(address.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {latitude, longitude};
};

const normalizeMarkerId = (item, latitude, longitude) =>
  normalizeText(item?.id) ||
  `${latitude}:${longitude}:${normalizeText(item?.title || item?.companyName)}`;

const resolveMarkerGeocodeQuery = item => {
  const addressParts = resolveAddressDisplayParts(item);
  const candidates = [
    item?.geocodeQuery,
    item?.navigationQuery,
    item?.searchFor,
    item?.searchQuery,
    item?.addressQuery,
    item?.formattedAddress,
    item?.formatted,
    typeof item?.address === 'string' ? item.address : null,
    [addressParts.streetLine, addressParts.district, addressParts.cityStateLine]
      .filter(Boolean)
      .join(', '),
    addressParts.primary,
    addressParts.nickname,
    item?.title,
    item?.companyName,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return '';
};

export const resolveDefaultMapApiKey = source => {
  if (!isMapConfigObject(source)) {
    return '';
  }

  return normalizeText(
    source.apiKey ||
      source.googleMapsApiKey ||
      source.webGoogleMapsApiKey ||
      source.androidGoogleMapsApiKey ||
      source.maps?.apiKey ||
      source.map?.apiKey ||
      source.mapApiKey,
  );
};

export const normalizeMapMarkerPayload = item => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const coordinates = extractMapCoordinates(item);

  const addressParts = resolveAddressDisplayParts(item);
  const title = normalizeText(
    item.title ||
      item.companyName ||
      item.company ||
      item.label ||
      item.name ||
      addressParts.primary ||
      addressParts.nickname ||
      item.formattedAddress ||
      item.formatted ||
      item.address ||
      item.searchFor,
  );
  const addressLine = normalizeText(
    item.addressLine ||
      item.address ||
      addressParts.streetLine ||
      item.formattedAddress ||
      item.formatted ||
      item.searchFor ||
      title,
  );
  const addressExtra = normalizeText(
    item.addressExtra ||
      [addressParts.district, addressParts.cityStateLine, addressParts.postalCode]
        .filter(Boolean)
        .join(' • '),
  );

  return {
    ...item,
    id: normalizeMarkerId(
      item,
      coordinates?.latitude ?? 'na',
      coordinates?.longitude ?? 'na',
    ),
    ...(coordinates
      ? {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }
      : {}),
    title,
    companyName: normalizeText(item.companyName || item.company || item.groupName || title),
    addressLine,
    addressExtra,
    geocodeQuery: resolveMarkerGeocodeQuery(item),
  };
};

const dedupeByKey = (items, keyResolver) => {
  const seen = new Set();
  const result = [];

  items.forEach(item => {
    const key = keyResolver(item);

    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(item);
  });

  return result;
};

const resolveMarkersFromSource = source => {
  if (!isMapConfigObject(source)) {
    return [];
  }

  const markers = [];

  if (Array.isArray(source.markers)) {
    markers.push(...source.markers);
  }

  if (Array.isArray(source.markerPayloads)) {
    markers.push(...source.markerPayloads);
  }

  if (source.origin) {
    markers.push({...source.origin, __mapRole: 'origin'});
  }

  if (source.destination) {
    markers.push({...source.destination, __mapRole: 'destination'});
  }

  return markers;
};

const resolveExplicitPaths = ({config, addresses, paths}) => {
  if (Array.isArray(paths) && paths.length > 0) {
    return paths;
  }

  const sources = [config, addresses].filter(isMapConfigObject);

  for (const source of sources) {
    if (Array.isArray(source.paths) && source.paths.length > 0) {
      return source.paths;
    }
  }

  if (!sources.length) {
    return [];
  }

  const originDestinationSource = sources.find(
    source => source.origin && source.destination,
  );

  if (originDestinationSource) {
    return [
      {
        from: originDestinationSource.origin,
        to: originDestinationSource.destination,
      },
    ];
  }

  const originMarkersSource = sources.find(
    source => source.origin && Array.isArray(source.markers) && source.markers.length > 0,
  );

  if (originMarkersSource) {
    return originMarkersSource.markers.map(target => ({
      from: originMarkersSource.origin,
      to: target,
    }));
  }

  return [];
};

export const resolveDefaultMapPayload = ({
  config = null,
  addresses = null,
  markerPayloads = [],
  paths = [],
  userCoordinates = null,
  apiKey = '',
} = {}) => {
  const normalizedConfig = isMapConfigObject(config) ? config : null;
  const nestedConfigAddresses = isMapConfigObject(normalizedConfig?.addresses)
    ? normalizedConfig.addresses
    : null;
  const normalizedAddresses =
    (addresses && typeof addresses === 'object' && !Array.isArray(addresses)
      ? addresses
      : nestedConfigAddresses) || null;

  const resolvedApiKey =
    resolveDefaultMapApiKey(normalizedConfig) ||
    resolveDefaultMapApiKey(normalizedAddresses) ||
    normalizeText(apiKey);

  const resolvedUserCoordinates =
    extractMapCoordinates(userCoordinates) ||
    extractMapCoordinates(normalizedConfig?.user) ||
    extractMapCoordinates(normalizedConfig?.userCoordinates) ||
    extractMapCoordinates(normalizedAddresses?.user) ||
    extractMapCoordinates(normalizedAddresses?.userCoordinates) ||
    null;

  const combinedMarkers = [
    ...markerPayloads,
    ...resolveMarkersFromSource(normalizedConfig),
    ...resolveMarkersFromSource(normalizedAddresses),
  ]
    .map(normalizeMapMarkerPayload)
    .filter(Boolean);

  const resolvedMarkers = dedupeByKey(combinedMarkers, item => normalizeText(item?.id));

  const resolvedPaths = dedupeByKey(
    resolveExplicitPaths({
      config: normalizedConfig,
      addresses: normalizedAddresses,
      paths,
    })
      .map(path => {
        const from = normalizeMapMarkerPayload(path?.from || path?.origin || path?.start);
        const to = normalizeMapMarkerPayload(path?.to || path?.destination || path?.end);

        if (!from || !to) {
          return null;
        }

        return {
          id: normalizeText(path?.id) || `${from.id || `${from.latitude}:${from.longitude}`}-${to.id || `${to.latitude}:${to.longitude}`}`,
          from,
          to,
          color: normalizeText(path?.color),
        };
      })
      .filter(Boolean),
    path => normalizeText(path?.id),
  );

  return {
    apiKey: resolvedApiKey,
    markerPayloads: resolvedMarkers,
    paths: resolvedPaths,
    userCoordinates: resolvedUserCoordinates,
  };
};

export const buildGoogleMapsNavigationUrl = ({latitude, longitude}) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return '';
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}`;
};

export const buildWazeNavigationUrl = ({latitude, longitude}) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return '';
  }

  return `https://waze.com/ul?ll=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}&navigate=yes`;
};

const collectCoordinates = ({markerPayloads = [], paths = [], userCoordinates = null}) => {
  const coordinates = [];

  markerPayloads.forEach(item => {
    const point = extractMapCoordinates(item);
    if (point) {
      coordinates.push(point);
    }
  });

  if (userCoordinates) {
    coordinates.push(userCoordinates);
  }

  paths.forEach(path => {
    const from = extractMapCoordinates(path?.from);
    const to = extractMapCoordinates(path?.to);

    if (from) {
      coordinates.push(from);
    }

    if (to) {
      coordinates.push(to);
    }
  });

  return coordinates.filter(
    item =>
      Number.isFinite(item?.latitude) &&
      Number.isFinite(item?.longitude),
  );
};

export const buildOpenStreetMapEmbedUrl = ({
  markerPayloads = [],
  paths = [],
  userCoordinates = null,
} = {}) => {
  const coordinates = collectCoordinates({
    markerPayloads,
    paths,
    userCoordinates,
  });

  if (coordinates.length === 0) {
    return 'https://www.openstreetmap.org/export/embed.html?layer=mapnik';
  }

  const latitudes = coordinates.map(item => item.latitude);
  const longitudes = coordinates.map(item => item.longitude);
  const south = Math.min(...latitudes);
  const north = Math.max(...latitudes);
  const west = Math.min(...longitudes);
  const east = Math.max(...longitudes);
  const padding = 0.01;
  const center = coordinates[0];

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    `${west - padding},${south - padding},${east + padding},${north + padding}`,
  )}&layer=mapnik&marker=${encodeURIComponent(
    `${normalizeCoordinate(center.latitude) || 0},${normalizeCoordinate(center.longitude) || 0}`,
  )}`;
};

export const buildOpenStreetMapHtml = ({
  markerPayloads = [],
  paths = [],
  userCoordinates = null,
  routeColor = '#0EA5E9',
} = {}) => {
  const markers = serializeForHtml(markerPayloads);
  const routes = serializeForHtml(paths);
  const user = serializeForHtml(userCoordinates);
  const routeStroke = serializeForHtml(routeColor || '#0EA5E9');

  return `<!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <style>
        html, body, #map {
          margin: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #f8fafc;
          font-family: Arial, sans-serif;
        }

        .leaflet-container {
          background: #e2e8f0;
        }

        .marker-popup {
          min-width: 180px;
          color: #0f172a;
          font-size: 12px;
          line-height: 1.4;
        }

        .marker-popup-title {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .marker-popup-line {
          color: #334155;
          margin-top: 2px;
        }

        .map-error {
          position: absolute;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.8);
          color: #ffffff;
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          z-index: 10;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div id="error" class="map-error"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        window.__SHOP_MAP_MARKERS__ = ${markers};
        window.__SHOP_MAP_PATHS__ = ${routes};
        window.__SHOP_MAP_USER__ = ${user};
        window.__SHOP_MAP_ROUTE_COLOR__ = ${routeStroke};

        function escapeHtml(value) {
          return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function showError(message) {
          var errorElement = document.getElementById('error');
          errorElement.textContent = message;
          errorElement.style.display = 'flex';
        }

        function toPoint(item) {
          if (!item) {
            return null;
          }

          var latitude = Number(item.latitude);
          var longitude = Number(item.longitude);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return {
            lat: latitude,
            lng: longitude,
          };
        }

        function buildPopupContent(item) {
          var title = escapeHtml(item && item.title ? item.title : item && item.companyName ? item.companyName : '');
          var addressLine = escapeHtml(item && item.addressLine ? item.addressLine : '');
          var addressExtra = escapeHtml(item && item.addressExtra ? item.addressExtra : '');

          return (
            '<div class="marker-popup">' +
              '<div class="marker-popup-title">' + title + '</div>' +
              (addressLine ? '<div class="marker-popup-line">' + addressLine + '</div>' : '') +
              (addressExtra ? '<div class="marker-popup-line">' + addressExtra + '</div>' : '') +
            '</div>'
          );
        }

        function resolveCircleColor(item, fallback) {
          if (item && item.__mapRole === 'origin') {
            return '#16a34a';
          }

          if (item && item.__mapRole === 'destination') {
            return '#c10015';
          }

          if (item && item.__mapRole === 'user') {
            return '#0ea5e9';
          }

          return fallback || '#64748b';
        }

        function addPointToBounds(bounds, point) {
          if (!point) {
            return;
          }

          bounds.extend([point.lat, point.lng]);
        }

        function createCircleMarker(map, point, item, color) {
          return L.circleMarker([point.lat, point.lng], {
            radius: item && item.__mapRole === 'user' ? 9 : 8,
            color: color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.92,
          }).addTo(map);
        }

        function resolveMarkerIcon(item) {
          var iconUrl = item && item.markerIconUrl ? String(item.markerIconUrl).trim() : '';

          if (!iconUrl) {
            return Promise.resolve(null);
          }

          return new Promise(function (resolve) {
            var image = new Image();

            image.onload = function () {
              resolve(
                L.icon({
                  iconUrl: iconUrl,
                  iconSize: [42, 42],
                  iconAnchor: [21, 42],
                  popupAnchor: [0, -36],
                }),
              );
            };

            image.onerror = function () {
              resolve(null);
            };

            image.src = iconUrl;
          });
        }

        function createMapMarker(map, point, item, color) {
          if (
            item &&
            (item.__mapRole === 'user' ||
              item.__mapRole === 'origin' ||
              item.__mapRole === 'destination')
          ) {
            return Promise.resolve(createCircleMarker(map, point, item, color));
          }

          return resolveMarkerIcon(item).then(function (icon) {
            if (icon) {
              return L.marker([point.lat, point.lng], {
                icon: icon,
              }).addTo(map);
            }

            return L.marker([point.lat, point.lng]).addTo(map);
          });
        }

        try {
          if (!window.L) {
            showError('Nao foi possivel carregar o mapa.');
            throw new Error('map-library-missing');
          }

          if (L.Icon && L.Icon.Default && typeof L.Icon.Default.mergeOptions === 'function') {
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
          }

          var map = L.map('map', {
            zoomControl: true,
            attributionControl: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
          }).addTo(map);

          var bounds = L.latLngBounds([]);
          var markers = Array.isArray(window.__SHOP_MAP_MARKERS__) ? window.__SHOP_MAP_MARKERS__ : [];
          var routes = Array.isArray(window.__SHOP_MAP_PATHS__) ? window.__SHOP_MAP_PATHS__ : [];
          var userCoordinates = window.__SHOP_MAP_USER__;

          if (
            userCoordinates &&
            Number.isFinite(userCoordinates.latitude) &&
            Number.isFinite(userCoordinates.longitude)
          ) {
            var userPoint = {
              lat: Number(userCoordinates.latitude),
              lng: Number(userCoordinates.longitude),
            };
            var userMarker = createCircleMarker(map, userPoint, {__mapRole: 'user'}, '#0ea5e9');
            userMarker.bindPopup('<div class="marker-popup"><div class="marker-popup-title">Sua localização</div></div>');
            addPointToBounds(bounds, userPoint);
          }

          Promise.all(
            markers.map(function (item) {
              var point = toPoint(item);

              if (!point) {
                return Promise.resolve(null);
              }

              var color = resolveCircleColor(item, '#64748b');

              return createMapMarker(map, point, item, color).then(function (marker) {
                marker.bindPopup(buildPopupContent(item));
                addPointToBounds(bounds, point);
                return marker;
              });
            }),
          ).then(function () {
            function resolveRouteCoordinates(path) {
              var from = toPoint(path && (path.from || path.origin || path.start));
              var to = toPoint(path && (path.to || path.destination || path.end));

              if (!from || !to) {
                return Promise.resolve(null);
              }

              var routeUrl =
                'https://router.project-osrm.org/route/v1/driving/' +
                from.lng +
                ',' +
                from.lat +
                ';' +
                to.lng +
                ',' +
                to.lat +
                '?overview=full&geometries=geojson&steps=false';

              return fetch(routeUrl)
                .then(function (response) {
                  if (!response || !response.ok) {
                    throw new Error('route-unavailable');
                  }

                  return response.json();
                })
                .then(function (payload) {
                  var geometry = payload && payload.routes && payload.routes[0] && payload.routes[0].geometry;
                  var coordinates = geometry && Array.isArray(geometry.coordinates)
                    ? geometry.coordinates
                        .map(function (pair) {
                          return {
                            lat: Number(pair && pair[1]),
                            lng: Number(pair && pair[0]),
                          };
                        })
                        .filter(function (point) {
                          return Number.isFinite(point.lat) && Number.isFinite(point.lng);
                        })
                    : [];

                  return {
                    path: path,
                    coordinates: coordinates.length > 1 ? coordinates : [from, to],
                  };
                })
                .catch(function () {
                  return {
                    path: path,
                    coordinates: [from, to],
                  };
                });
            }

            Promise.all(routes.map(resolveRouteCoordinates)).then(function (resolvedRoutes) {
              (resolvedRoutes || [])
                .filter(Boolean)
                .forEach(function (entry) {
                  var coordinates = Array.isArray(entry.coordinates) ? entry.coordinates : [];

                  if (coordinates.length < 2) {
                    return;
                  }

                  L.polyline(
                    coordinates.map(function (point) {
                      return [point.lat, point.lng];
                    }),
                    {
                      color:
                        entry.path && entry.path.color
                          ? entry.path.color
                          : window.__SHOP_MAP_ROUTE_COLOR__ || '#0ea5e9',
                      weight: 4,
                      opacity: 0.78,
                    },
                  ).addTo(map);

                  coordinates.forEach(function (point) {
                    addPointToBounds(bounds, point);
                  });
                });

              if (!bounds.isValid()) {
                map.setView([-14.235004, -51.92528], 4);
              } else {
                map.fitBounds(bounds.pad(0.2), {
                  padding: [32, 32],
                  animate: false,
                });
              }

              setTimeout(function () {
                map.invalidateSize();
              }, 0);
            });
          });
        } catch (error) {
          showError('Nao foi possivel carregar o mapa.');
        }
      </script>
    </body>
  </html>`;
};
