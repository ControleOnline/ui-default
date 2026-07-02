import React, {useEffect, useRef} from 'react';
import {Platform, View} from 'react-native';

import styles from './DefaultGoogleMap.styles';
import {
  buildGoogleMapsNavigationUrl,
  buildWazeNavigationUrl,
} from './DefaultMap.shared';

const GOOGLE_MAPS_SCRIPT_ID = 'shop-google-maps-api-script';
const GOOGLE_MAPS_CALLBACK_NAME = '__shopGoogleMapsApiReady__';
const GOOGLE_MAPS_LOAD_TIMEOUT_MS = 15000;
const GOOGLE_MAPS_POLL_INTERVAL_MS = 100;
const ROUTE_COLOR = '#0EA5E9';

const escapeHtml = value =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildPopupLine = value => {
  if (!value) {
    return '';
  }

  return `<div class="shop-map-popup-line">${escapeHtml(value)}</div>`;
};

const buildPopupMeta = (label, value) => {
  if (!value) {
    return '';
  }

  return `
    <div class="shop-map-popup-meta">
      <span class="shop-map-popup-meta-label">${escapeHtml(label)}</span>
      <span>${escapeHtml(value)}</span>
    </div>
  `;
};

const buildPopupContent = (item, position) => {
  const navigationPosition = position || {
    latitude: Number(item?.latitude),
    longitude: Number(item?.longitude),
  };
  const googleMapsUrl =
    item?.googleMapsUrl ||
    buildGoogleMapsNavigationUrl(navigationPosition);
  const wazeUrl = item?.wazeUrl || buildWazeNavigationUrl(navigationPosition);

  return `
  <div class="shop-map-popup">
    <div class="shop-map-popup-company">${escapeHtml(item.companyName)}</div>
    <div class="shop-map-popup-title">${escapeHtml(item.title)}</div>
    ${buildPopupLine(item.addressLine)}
    ${buildPopupLine(item.addressExtra)}
    <div class="shop-map-popup-meta-list">
      ${buildPopupMeta('Telefone', item.phoneLabel)}
      ${buildPopupMeta('Distancia', item.distanceLabel)}
      ${buildPopupMeta('Horario', item.openingHours)}
    </div>
    <div class="shop-map-popup-actions">
      <a
        class="shop-map-popup-action shop-map-popup-action-primary"
        href="${escapeHtml(googleMapsUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir no Maps
      </a>
      <a
        class="shop-map-popup-action"
        href="${escapeHtml(wazeUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Waze
      </a>
    </div>
  </div>
`;
};

const normalizeCoordinate = value => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const extractCoordinates = address => {
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

const injectPopupStyles = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.getElementById('shop-google-map-popup-styles')) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'shop-google-map-popup-styles';
  styleElement.textContent = `
    .shop-map-popup {
      min-width: 220px;
      max-width: 280px;
      color: #0f172a;
      font-family: Arial, sans-serif;
    }

    .shop-map-popup-company {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0369a1;
      margin-bottom: 6px;
    }

    .shop-map-popup-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .shop-map-popup-line {
      font-size: 13px;
      line-height: 1.45;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .shop-map-popup-meta-list {
      display: grid;
      gap: 6px;
      margin-top: 10px;
    }

    .shop-map-popup-meta {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      font-size: 12px;
      color: #334155;
    }

    .shop-map-popup-meta-label {
      color: #64748b;
    }

    .shop-map-popup-actions {
      display: flex;
      gap: 8px;
      margin-top: 14px;
    }

    .shop-map-popup-action {
      flex: 1;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      text-align: center;
      text-decoration: none;
      color: #0f172a;
      font-size: 12px;
      font-weight: 700;
      background: #ffffff;
    }

    .shop-map-popup-action-primary {
      border-color: transparent;
      background: #0ea5e9;
      color: #ffffff;
    }
  `;
  document.head.appendChild(styleElement);
};

const loadGoogleMapsApi = apiKey => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__shopGoogleMapsPromise) {
    return window.__shopGoogleMapsPromise;
  }

  const loadPromise = new Promise((resolve, reject) => {
    let settled = false;
    let pollTimer = null;
    let timeoutTimer = null;

    const cleanup = () => {
      if (pollTimer) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }

      if (timeoutTimer) {
        window.clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };

    const resolveMaps = () => {
      if (settled || !window.google?.maps) {
        return false;
      }

      settled = true;
      cleanup();
      resolve(window.google.maps);
      return true;
    };

    const rejectMaps = error => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    const startWatching = () => {
      if (settled || pollTimer || timeoutTimer) {
        return;
      }

      pollTimer = window.setInterval(() => {
        resolveMaps();
      }, GOOGLE_MAPS_POLL_INTERVAL_MS);

      timeoutTimer = window.setTimeout(() => {
        rejectMaps(new Error('google-maps-load-failed'));
      }, GOOGLE_MAPS_LOAD_TIMEOUT_MS);
    };

    const handleLoad = () => {
      if (resolveMaps()) {
        return;
      }

      startWatching();
    };

    const handleError = () => {
      rejectMaps(new Error('google-maps-load-failed'));
    };

    window[GOOGLE_MAPS_CALLBACK_NAME] = handleLoad;

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, {once: true});
      existingScript.addEventListener('error', handleError, {once: true});
      startWatching();
      return;
    }

    const existingMapsScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]',
    );
    if (existingMapsScript) {
      existingMapsScript.addEventListener('load', handleLoad, {once: true});
      existingMapsScript.addEventListener('error', handleError, {once: true});
      startWatching();
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&loading=async&callback=${GOOGLE_MAPS_CALLBACK_NAME}`;
    script.addEventListener('load', handleLoad, {once: true});
    script.addEventListener('error', handleError, {once: true});
    document.head.appendChild(script);
    startWatching();
  });

  window.__shopGoogleMapsPromise = loadPromise.catch(error => {
    window.__shopGoogleMapsPromise = null;
    throw error;
  });

  return window.__shopGoogleMapsPromise;
};

const fitMapToBounds = ({google, map, markerCount, userCoordinates}) => {
  const bounds = new google.maps.LatLngBounds();

  if (
    userCoordinates &&
    Number.isFinite(userCoordinates.latitude) &&
    Number.isFinite(userCoordinates.longitude)
  ) {
    bounds.extend({
      lat: userCoordinates.latitude,
      lng: userCoordinates.longitude,
    });
  }

  return {
    bounds,
    finalize() {
      if (bounds.isEmpty()) {
        return;
      }

      map.fitBounds(bounds, {
        top: 56,
        right: 32,
        bottom: 56,
        left: 32,
      });

      google.maps.event.addListenerOnce(map, 'idle', () => {
        if (markerCount === 1 && map.getZoom() > 15) {
          map.setZoom(15);
        }
      });
    },
  };
};

export default function DefaultGoogleMap({
  apiKey,
  markerPayloads = [],
  paths = [],
  userCoordinates = null,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    const container = containerRef.current;
    if (
      !container ||
      !apiKey ||
      (markerPayloads.length === 0 && !(Array.isArray(paths) && paths.length > 0) && !userCoordinates)
    ) {
      return undefined;
    }

    let cancelled = false;

    injectPopupStyles();

    loadGoogleMapsApi(apiKey)
      .then(async () => {
        if (cancelled || !container || !window.google?.maps) {
          return;
        }

        const google = window.google;
        const map = new google.maps.Map(container, {
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
          zoomControl: false,
          disableDefaultUI: true,
        });

        const infoWindow = new google.maps.InfoWindow({maxWidth: 320});
        const hasUserCoordinates =
          Number.isFinite(userCoordinates?.latitude) &&
          Number.isFinite(userCoordinates?.longitude);
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = directionsService
          && hasUserCoordinates
          ? new google.maps.DirectionsRenderer({
              map,
              suppressMarkers: true,
              preserveViewport: false,
              polylineOptions: {
                strokeColor: ROUTE_COLOR,
                strokeOpacity: 0.92,
                strokeWeight: 5,
              },
            })
          : null;
        let activeRouteRequestId = 0;
        const resolveMarkerPayload = item => {
          const latitude = Number(item?.latitude);
          const longitude = Number(item?.longitude);

          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            return Promise.resolve({
              item,
              position: {
                lat: latitude,
                lng: longitude,
              },
            });
          }

          if (!item?.geocodeQuery) {
            return Promise.resolve(null);
          }

          const geocoder = new google.maps.Geocoder();

          return new Promise(resolve => {
            geocoder.geocode({address: item.geocodeQuery}, (results, status) => {
              const location = results?.[0]?.geometry?.location;

              if (status !== 'OK' || !location) {
                resolve(null);
                return;
              }

              const resolvedLatitude = Number(location.lat());
              const resolvedLongitude = Number(location.lng());

              if (
                !Number.isFinite(resolvedLatitude) ||
                !Number.isFinite(resolvedLongitude)
              ) {
                resolve(null);
                return;
              }

              resolve({
                item,
                position: {
                  lat: resolvedLatitude,
                  lng: resolvedLongitude,
                },
              });
            });
          });
        };
        const resolvedMarkers = (await Promise.all(
          markerPayloads.map(resolveMarkerPayload),
        )).filter(Boolean);
        const {bounds, finalize} = fitMapToBounds({
          google,
          map,
          markerCount: resolvedMarkers.length,
          userCoordinates,
        });

        if (
          userCoordinates &&
          Number.isFinite(userCoordinates.latitude) &&
          Number.isFinite(userCoordinates.longitude)
        ) {
          new google.maps.Marker({
            position: {
              lat: userCoordinates.latitude,
              lng: userCoordinates.longitude,
            },
            map,
            title: 'Sua localizacao',
            zIndex: 999,
          });
        }

        resolvedMarkers.forEach(entry => {
          const item = entry.item;
          const position = entry.position;
          const markerOptions = {
            position,
            map,
            title: item.title,
            animation: google.maps.Animation.DROP,
          };

          if (item.markerIconUrl) {
            markerOptions.icon = {
              url: item.markerIconUrl,
              scaledSize: new google.maps.Size(42, 42),
            };
          }

          const marker = new google.maps.Marker(markerOptions);

          bounds.extend(position);

          marker.addListener('click', () => {
            infoWindow.setContent(buildPopupContent(item, position));
            infoWindow.open({
              anchor: marker,
              map,
              shouldFocus: false,
            });

            if (!directionsService || !directionsRenderer) {
              return;
            }

            const routeRequestId = activeRouteRequestId + 1;
            activeRouteRequestId = routeRequestId;

            directionsService.route(
              {
                origin: {
                  lat: userCoordinates.latitude,
                  lng: userCoordinates.longitude,
                },
                destination: position,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (response, status) => {
                if (
                  cancelled ||
                  !directionsRenderer ||
                  routeRequestId !== activeRouteRequestId
                ) {
                  return;
                }

                if (status === 'OK' && response) {
                  directionsRenderer.setDirections(response);
                  return;
                }

                directionsRenderer.set('directions', null);
              },
            );
          });
        });

        const resolveRouteCoordinates = path => {
          const from = extractCoordinates(path?.from || path?.origin || path?.start);
          const to = extractCoordinates(path?.to || path?.destination || path?.end);

          if (!from || !to) {
            return Promise.resolve(null);
          }

          return new Promise(resolve => {
            directionsService.route(
              {
                origin: from,
                destination: to,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (response, status) => {
                if (cancelled) {
                  resolve(null);
                  return;
                }

                const overviewPath = response?.routes?.[0]?.overview_path;
                const coordinates =
                  Array.isArray(overviewPath) && overviewPath.length > 1
                    ? overviewPath
                        .map(point => ({
                          lat: Number(typeof point.lat === 'function' ? point.lat() : point.lat),
                          lng: Number(typeof point.lng === 'function' ? point.lng() : point.lng),
                        }))
                        .filter(
                          item => Number.isFinite(item.lat) && Number.isFinite(item.lng),
                        )
                    : [from, to];

                if (status !== 'OK' && coordinates.length < 2) {
                  resolve(null);
                  return;
                }

                resolve({
                  path,
                  coordinates,
                });
              },
            );
          });
        };

        const resolvedRoutes = await Promise.all(
          (Array.isArray(paths) ? paths : []).map(resolveRouteCoordinates),
        );

        if (cancelled) {
          return;
        }

        resolvedRoutes.filter(Boolean).forEach(entry => {
          const coordinates = Array.isArray(entry?.coordinates) ? entry.coordinates : [];

          if (coordinates.length < 2) {
            return;
          }

          coordinates.forEach(point => {
            bounds.extend(point);
          });

          new google.maps.Polyline({
            path: coordinates,
            geodesic: true,
            strokeColor: normalizeText(entry?.path?.color || '') || ROUTE_COLOR,
            strokeOpacity: 0.72,
            strokeWeight: 4,
            map,
          });
        });

        finalize();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [apiKey, markerPayloads, paths, userCoordinates]);

  if (
    Platform.OS !== 'web' ||
    !apiKey ||
    (markerPayloads.length === 0 &&
      !Boolean(userCoordinates) &&
      (!Array.isArray(paths) || paths.length === 0))
  ) {
    return null;
  }

  return <View ref={containerRef} style={styles.mapViewport} />;
}
