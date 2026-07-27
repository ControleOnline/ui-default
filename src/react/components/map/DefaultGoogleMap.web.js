import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Image, Platform, Text, TouchableOpacity, View} from 'react-native';

import styles from './DefaultGoogleMap.styles';
import {
  buildGoogleMapsNavigationUrl,
  buildWazeNavigationUrl,
} from './DefaultMap.shared';
import {resolveMapPopupTheme} from './DefaultNativeMap.shared';
import {resolveAddressDisplayParts} from '@controleonline/ui-common/src/react/utils/entityDisplay';

const GOOGLE_MAPS_SCRIPT_ID = 'shop-google-maps-api-script';
const GOOGLE_MAPS_CALLBACK_NAME = '__shopGoogleMapsApiReady__';
const GOOGLE_MAPS_LOAD_TIMEOUT_MS = 15000;
const GOOGLE_MAPS_POLL_INTERVAL_MS = 100;
const ROUTE_COLOR = '#0EA5E9';
const markerIconUrlValidationCache = new Map();

const buildPopupTravelSummary = (item, routeSummary = null) => {
  const distanceLabel =
    routeSummary?.distanceLabel || item?.distanceLabel || '';
  const durationLabel =
    routeSummary?.durationLabel ||
    item?.durationLabel ||
    item?.travelDurationLabel ||
    '';

  if (!distanceLabel && !durationLabel) {
    return '';
  }

  return `
    <div class="shop-map-popup-summary">
      ${[distanceLabel, durationLabel].filter(Boolean).join(' • ')}
    </div>
  `;
};

const buildPopupTravelSummaryText = (item, routeSummary = null) =>
  buildPopupTravelSummary(item, routeSummary)
    .replace(/<\/?div[^>]*>/g, '')
    .trim();

const normalizeText = value => String(value || '').trim();

const formatPostalCode = value => {
  const digits = String(value || '').replace(/\D+/g, '');

  if (digits.length !== 8) {
    return normalizeText(value);
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const extractAddressExtraFallback = value => {
  const parts = String(value || '')
    .split('•')
    .map(item => normalizeText(item))
    .filter(Boolean);

  const postalCodeLine = formatPostalCode(parts.find(item => /\d{5,8}/.test(item)));
  const cityStateLine = normalizeText(
    parts.find(item => /\b[A-Z]{2}\b/.test(item) || item.includes('/')),
  );

  return {
    cityStateLine,
    postalCodeLine,
  };
};

const extractAddressDisplayLines = item => {
  const addressParts = resolveAddressDisplayParts(item);
  const addressExtraFallback = extractAddressExtraFallback(item?.addressExtra);
  const primaryLine = normalizeText(
    addressParts.streetLine || addressParts.primary || item?.addressLine,
  );
  const cityStateLine = normalizeText(
    addressParts.cityStateLine || addressExtraFallback.cityStateLine,
  );
  const postalCodeLine = formatPostalCode(
    addressParts.postalCode || addressExtraFallback.postalCodeLine,
  );

  return {
    primaryLine,
    cityStateLine,
    postalCodeLine,
  };
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

const buildPopupTitle = item =>
  item?.unitAlias || item?.alias || item?.companyName || item?.title || 'Unidade';

const buildLogoFallback = item => {
  const title = buildPopupTitle(item);

  return String(title || 'CO')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(chunk => chunk[0] || '')
    .join('')
    .toUpperCase();
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

const resolveMarkerIconUrl = url => {
  const normalizedUrl = String(url || '').trim();

  if (
    !normalizedUrl ||
    typeof window === 'undefined' ||
    typeof window.Image !== 'function'
  ) {
    return Promise.resolve('');
  }

  if (markerIconUrlValidationCache.has(normalizedUrl)) {
    return markerIconUrlValidationCache.get(normalizedUrl);
  }

  const validationPromise = new Promise(resolve => {
    const image = new window.Image();
    const finalize = value => {
      const resolvedValue = String(value || '').trim();
      markerIconUrlValidationCache.set(
        normalizedUrl,
        Promise.resolve(resolvedValue),
      );
      resolve(resolvedValue);
    };

    image.onload = () => finalize(normalizedUrl);
    image.onerror = () => finalize('');
    image.src = normalizedUrl;
  });

  markerIconUrlValidationCache.set(normalizedUrl, validationPromise);
  return validationPromise;
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
  popupTheme = null,
}) {
  const containerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const activeRouteRequestIdRef = useRef(0);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [selectedRouteSummary, setSelectedRouteSummary] = useState(null);
  const resolvedPopupTheme = useMemo(
    () => resolveMapPopupTheme(popupTheme),
    [popupTheme],
  );
  const selectedMarker = useMemo(
    () => markerPayloads.find(item => item.id === selectedMarkerId) || null,
    [markerPayloads, selectedMarkerId],
  );

  useEffect(() => {
    if (!selectedMarkerId) {
      setSelectedRouteSummary(null);
      return;
    }

    if (!selectedMarker) {
      setSelectedMarkerId(null);
      setSelectedRouteSummary(null);
    }
  }, [selectedMarker, selectedMarkerId]);

  const openExternalUrl = useCallback(url => {
    const normalizedUrl = String(url || '').trim();
    if (!normalizedUrl || typeof window === 'undefined') {
      return;
    }

    window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
  }, []);

  const closePopup = useCallback(() => {
    activeRouteRequestIdRef.current += 1;
    setSelectedMarkerId(null);
    setSelectedRouteSummary(null);
    directionsRendererRef.current?.set('directions', null);
  }, []);

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
        directionsRendererRef.current = directionsRenderer;
        const resolveMarkerPayload = async item => {
          const latitude = Number(item?.latitude);
          const longitude = Number(item?.longitude);
          const markerIconUrl = await resolveMarkerIconUrl(item?.markerIconUrl);
          const resolvedItem = markerIconUrl
            ? {
                ...item,
                markerIconUrl,
              }
            : item?.markerIconUrl
              ? {
                  ...item,
                  markerIconUrl: '',
                }
              : item;

          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            return {
              item: resolvedItem,
              position: {
                lat: latitude,
                lng: longitude,
              },
            };
          }

          if (!resolvedItem?.geocodeQuery) {
            return null;
          }

          const geocoder = new google.maps.Geocoder();

          return new Promise(resolve => {
            geocoder.geocode({address: resolvedItem.geocodeQuery}, (results, status) => {
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
                item: resolvedItem,
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
            setSelectedMarkerId(item.id);
            setSelectedRouteSummary(null);

            if (!directionsService || !directionsRenderer) {
              return;
            }

            const routeRequestId = activeRouteRequestIdRef.current + 1;
            activeRouteRequestIdRef.current = routeRequestId;

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
                  routeRequestId !== activeRouteRequestIdRef.current
                ) {
                  return;
                }

                if (status === 'OK' && response) {
                  const activeLeg = response?.routes?.[0]?.legs?.[0] || null;
                  directionsRenderer.setDirections(response);
                  setSelectedRouteSummary({
                    distanceLabel: String(activeLeg?.distance?.text || '').trim(),
                    durationLabel: String(activeLeg?.duration?.text || '').trim(),
                  });
                  return;
                }

                directionsRenderer.set('directions', null);
                setSelectedRouteSummary(null);
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
      directionsRendererRef.current = null;
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

  const selectedTitle = buildPopupTitle(selectedMarker);
  const selectedLogoFallback = buildLogoFallback(selectedMarker);
  const selectedTravelSummary = buildPopupTravelSummaryText(
    selectedMarker,
    selectedRouteSummary,
  );
  const selectedNavigationPosition = selectedMarker
    ? {
        latitude: Number(selectedMarker.latitude),
        longitude: Number(selectedMarker.longitude),
      }
    : null;
  const selectedAddressLines = extractAddressDisplayLines(selectedMarker);
  const selectedGoogleMapsUrl = selectedMarker
    ? selectedMarker.googleMapsUrl ||
      buildGoogleMapsNavigationUrl(selectedNavigationPosition)
    : '';
  const selectedWazeUrl = selectedMarker
    ? selectedMarker.wazeUrl || buildWazeNavigationUrl(selectedNavigationPosition)
    : '';

  return (
    <View style={styles.mapRoot}>
      <View ref={containerRef} style={styles.mapViewport} />
      {selectedMarker ? (
        <View pointerEvents="box-none" style={styles.popupOverlay}>
          <View
            style={[
              styles.popupCard,
              {
                backgroundColor: resolvedPopupTheme.modalBackground,
                shadowColor: resolvedPopupTheme.modalShadow,
              },
            ]}>
            <View style={styles.popupHeaderRow}>
              <View
                style={[
                  styles.popupLogoWrap,
                  {borderColor: resolvedPopupTheme.dividerBorder},
                ]}>
                {selectedMarker.companyLogoUrl ? (
                  <Image
                    source={{uri: selectedMarker.companyLogoUrl}}
                    style={styles.popupLogoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text
                    style={[
                      styles.popupLogoFallback,
                      {color: resolvedPopupTheme.buttonBackground},
                    ]}>
                    {selectedLogoFallback}
                  </Text>
                )}
              </View>
              <View style={styles.popupTitleWrap}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.popupTitle,
                    {color: resolvedPopupTheme.modalHeaderText},
                  ]}>
                  {selectedTitle}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                accessibilityLabel="Fechar detalhes da unidade"
                onPress={closePopup}
                style={styles.popupCloseButton}>
                <Text
                  style={[
                    styles.popupCloseText,
                    {color: resolvedPopupTheme.modalHeaderText},
                  ]}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.popupInfoCard,
                {
                  backgroundColor: resolvedPopupTheme.pageBackground,
                  borderColor: resolvedPopupTheme.dividerBorder,
                },
              ]}>
              {selectedAddressLines.primaryLine ? (
                <Text
                  style={[
                    styles.popupLine,
                    {color: resolvedPopupTheme.modalText},
                  ]}>
                  {selectedAddressLines.primaryLine}
                </Text>
              ) : null}
              {selectedAddressLines.cityStateLine ? (
                <Text
                  style={[
                    styles.popupLine,
                    {color: resolvedPopupTheme.modalText},
                  ]}>
                  {selectedAddressLines.cityStateLine}
                </Text>
              ) : null}
              {selectedAddressLines.postalCodeLine ? (
                <Text
                  style={[
                    styles.popupLine,
                    {color: resolvedPopupTheme.modalText},
                  ]}>
                  {selectedAddressLines.postalCodeLine}
                </Text>
              ) : null}
              {selectedTravelSummary ? (
                <Text
                  style={[
                    styles.popupSummary,
                    {color: resolvedPopupTheme.textMuted},
                  ]}>
                  {selectedTravelSummary}
                </Text>
              ) : null}
            </View>

            <View style={styles.popupActionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openExternalUrl(selectedGoogleMapsUrl)}
                style={[
                  styles.popupActionButton,
                  {backgroundColor: resolvedPopupTheme.buttonBackground},
                ]}>
                <Text
                  style={[
                    styles.popupActionText,
                    {color: resolvedPopupTheme.buttonText},
                  ]}>
                  Abrir no Maps
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openExternalUrl(selectedWazeUrl)}
                style={[
                  styles.popupActionButton,
                  {backgroundColor: resolvedPopupTheme.buttonBackground},
                ]}>
                <Text
                  style={[
                    styles.popupActionText,
                    {color: resolvedPopupTheme.buttonText},
                  ]}>
                  Abrir no Waze
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
