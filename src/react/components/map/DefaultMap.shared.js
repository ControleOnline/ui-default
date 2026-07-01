import {resolveAddressDisplayParts} from '@controleonline/ui-common/src/react/utils/entityDisplay';

const normalizeText = value => String(value ?? '').trim();

const isMapConfigObject = value =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeCoordinate = value => {
  const numeric = Number(String(value ?? '').replace(',', '.'));

  return Number.isFinite(numeric) ? numeric : null;
};

export const extractMapCoordinates = address => {
  if (!address || typeof address !== 'object') {
    return null;
  }

  const latitude = [
    address.latitude,
    address.lat,
    address.location?.latitude,
    address.location?.lat,
    address.coords?.latitude,
    address.coords?.lat,
    address.coordinate?.latitude,
    address.coordinate?.lat,
  ]
    .map(normalizeCoordinate)
    .find(value => value !== null);

  const longitude = [
    address.longitude,
    address.lng,
    address.lon,
    address.location?.longitude,
    address.location?.lng,
    address.coords?.longitude,
    address.coords?.lng,
    address.coordinate?.longitude,
    address.coordinate?.lng,
  ]
    .map(normalizeCoordinate)
    .find(value => value !== null);

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

  const [primarySource] = sources;

  if (primarySource.origin && primarySource.destination) {
    return [
      {
        from: primarySource.origin,
        to: primarySource.destination,
      },
    ];
  }

  if (
    primarySource.origin &&
    Array.isArray(primarySource.markers) &&
    primarySource.markers.length > 0
  ) {
    return primarySource.markers.map(target => ({
      from: primarySource.origin,
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
