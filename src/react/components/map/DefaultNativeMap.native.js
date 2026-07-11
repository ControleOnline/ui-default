import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Image, Linking, Platform, Text, View} from 'react-native';
import {env} from '@env';

import styles from './DefaultNativeMap.styles';
import {
  buildGoogleMapsNavigationUrl,
  buildWazeNavigationUrl,
  buildAndroidWebMapHtml,
  resolveWebViewBaseUrlForDomain,
  resolveMapPopupTheme,
} from './DefaultNativeMap.shared';
import {extractMapCoordinates} from './DefaultMap.shared';

const getNativeMapComponents = () => {
  if (Platform.OS === 'android') {
    return null;
  }

  try {
    return require('react-native-maps');
  } catch {
    return null;
  }
};

const getNativeWebView = () => {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    return require('react-native-webview').WebView;
  } catch {
    return null;
  }
};

const nativeMapComponents = getNativeMapComponents();
const NativeWebView = getNativeWebView();
const NativeMapView = nativeMapComponents?.default || null;
const Marker = nativeMapComponents?.Marker || null;
const Callout = nativeMapComponents?.Callout || null;
const CalloutSubview = nativeMapComponents?.CalloutSubview || null;
const Polyline = nativeMapComponents?.Polyline || null;
const PROVIDER_GOOGLE = nativeMapComponents?.PROVIDER_GOOGLE || null;
export const HAS_NATIVE_MAP_SUPPORT = Boolean(
  (Platform.OS === 'android' && NativeWebView) ||
    (NativeMapView && Marker && Callout),
);

const DEFAULT_ANDROID_ERROR_MESSAGE = 'Nao foi possivel carregar o mapa no Android.';
const GOOGLE_MAPS_WEBVIEW_ERROR_PATTERN =
  /google maps|maps api|referernotallowedmaperror|billingnotenabledmaperror|apikey|invalidkeymaperror|apinotactivatedmaperror/i;

const DEFAULT_REGION = {
  latitude: -23.55052,
  longitude: -46.633308,
  latitudeDelta: 0.24,
  longitudeDelta: 0.24,
};

const decodePolyline = encoded => {
  if (!encoded) {
    return [];
  }

  const coordinates = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = null;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
};

const fetchRouteData = async ({apiKey, origin, destination}) => {
  if (
    !apiKey ||
    !Number.isFinite(origin?.latitude) ||
    !Number.isFinite(origin?.longitude) ||
    !Number.isFinite(destination?.latitude) ||
    !Number.isFinite(destination?.longitude)
  ) {
    return {
      coordinates: [],
      distanceLabel: '',
      durationLabel: '',
    };
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      `${origin.latitude},${origin.longitude}`,
    )}&destination=${encodeURIComponent(
      `${destination.latitude},${destination.longitude}`,
    )}&mode=driving&key=${encodeURIComponent(apiKey)}`,
  );
  const payload = await response.json();
  const encodedPoints = payload?.routes?.[0]?.overview_polyline?.points;
  const activeLeg = payload?.routes?.[0]?.legs?.[0] || null;

  if (payload?.status !== 'OK' || !encodedPoints) {
    return {
      coordinates: [],
      distanceLabel: '',
      durationLabel: '',
    };
  }

  return {
    coordinates: decodePolyline(encodedPoints),
    distanceLabel: String(activeLeg?.distance?.text || '').trim(),
    durationLabel: String(activeLeg?.duration?.text || '').trim(),
  };
};

const buildRegion = coordinates => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return DEFAULT_REGION;
  }

  if (coordinates.length === 1) {
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }

  const latitudes = coordinates.map(item => item.latitude);
  const longitudes = coordinates.map(item => item.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.45, 0.04),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.45, 0.04),
  };
};

const MetaRow = ({label, value, popupTheme}) => {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, popupTheme && {color: popupTheme.textMuted}]}>
        {label}
      </Text>
      <Text style={[styles.metaValue, popupTheme && {color: popupTheme.modalText}]}>
        {value}
      </Text>
    </View>
  );
};

const CalloutAction = ({label, onPress, popupTheme, primary = false}) => {
  if (!CalloutSubview || !label || typeof onPress !== 'function') {
    return null;
  }

  return (
    <CalloutSubview
      onPress={onPress}
      style={[
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        popupTheme && {
          borderColor: popupTheme.buttonBackground,
          backgroundColor: popupTheme.buttonBackground,
        },
      ]}>
      <Text
        style={[
          styles.actionText,
          primary && styles.actionTextPrimary,
          popupTheme && {color: popupTheme.buttonText},
        ]}>
        {label}
      </Text>
    </CalloutSubview>
  );
};

const buildTravelSummary = (item, routeSummary = null) => {
  const distanceLabel =
    routeSummary?.distanceLabel || item?.distanceLabel || '';
  const durationLabel =
    routeSummary?.durationLabel ||
    item?.durationLabel ||
    item?.travelDurationLabel ||
    '';

  return [distanceLabel, durationLabel].filter(Boolean).join(' • ');
};

const resolveMarkerNavigationUrls = item => {
  const position = {
    latitude: Number(item?.latitude),
    longitude: Number(item?.longitude),
  };

  return {
    googleMapsUrl:
      item?.googleMapsUrl ||
      buildGoogleMapsNavigationUrl(position),
    wazeUrl:
      item?.wazeUrl ||
      buildWazeNavigationUrl(position),
  };
};

export default function DefaultNativeMap({
  apiKey = '',
  markerPayloads = [],
  paths = [],
  routeColor = '#0EA5E9',
  userCoordinates = null,
  popupTheme = null,
}) {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [selectedRouteSummary, setSelectedRouteSummary] = useState(null);
  const [androidMapState, setAndroidMapState] = useState('loading');
  const [androidMapErrorMessage, setAndroidMapErrorMessage] = useState('');
  const hasUserCoordinates =
    Number.isFinite(userCoordinates?.latitude) &&
    Number.isFinite(userCoordinates?.longitude);
  const baseMapCoordinates = useMemo(() => {
    const coordinates = markerPayloads
      .map(item => ({
        latitude: Number(item?.latitude),
        longitude: Number(item?.longitude),
      }))
      .filter(
        item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude),
      );

    if (hasUserCoordinates) {
      coordinates.push({
        latitude: Number(userCoordinates.latitude),
        longitude: Number(userCoordinates.longitude),
      });
    }

    return coordinates;
  }, [hasUserCoordinates, markerPayloads, userCoordinates]);
  const pathCoordinates = useMemo(
    () =>
      (Array.isArray(paths) ? paths : []).flatMap(path => {
        const from = extractMapCoordinates(path?.from || path?.origin || path?.start);
        const to = extractMapCoordinates(path?.to || path?.destination || path?.end);

        return [from, to].filter(Boolean);
      }),
    [paths],
  );
  const selectedMarker = useMemo(
    () => markerPayloads.find(item => item.id === selectedMarkerId) || null,
    [markerPayloads, selectedMarkerId],
  );
  const focusCoordinates = useMemo(() => {
    const combinedCoordinates = [...baseMapCoordinates, ...pathCoordinates];

    if (routeCoordinates.length > 1) {
      return routeCoordinates;
    }

    if (
      hasUserCoordinates &&
      Number.isFinite(selectedMarker?.latitude) &&
      Number.isFinite(selectedMarker?.longitude)
    ) {
      return [
        {
          latitude: Number(userCoordinates.latitude),
          longitude: Number(userCoordinates.longitude),
        },
        {
          latitude: Number(selectedMarker.latitude),
          longitude: Number(selectedMarker.longitude),
        },
      ];
    }

    return combinedCoordinates;
  }, [
    baseMapCoordinates,
    hasUserCoordinates,
    routeCoordinates,
    pathCoordinates,
    selectedMarker?.latitude,
    selectedMarker?.longitude,
    userCoordinates,
  ]);

  const initialRegion = useMemo(() => buildRegion(focusCoordinates), [focusCoordinates]);
  const androidMapBaseUrl = useMemo(
    () => resolveWebViewBaseUrlForDomain(env?.DOMAIN),
    [],
  );
  const resolvedPopupTheme = useMemo(
    () => resolveMapPopupTheme(popupTheme),
    [popupTheme],
  );
  const androidMapHtml = useMemo(() => {
    if (Platform.OS !== 'android') {
      return '';
    }

    return buildAndroidWebMapHtml({
      apiKey,
      markerPayloads,
      paths,
      routeColor,
      userCoordinates,
      popupTheme: resolvedPopupTheme,
    });
  }, [apiKey, markerPayloads, paths, resolvedPopupTheme, routeColor, userCoordinates]);

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

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    setAndroidMapState('loading');
    setAndroidMapErrorMessage('');
    return undefined;
  }, [androidMapHtml]);

  useEffect(() => {
    if (!hasUserCoordinates || !selectedMarker || !apiKey || !Polyline) {
      setRouteCoordinates([]);
      setSelectedRouteSummary(null);
      return undefined;
    }

    let cancelled = false;

    fetchRouteData({
      apiKey,
      origin: {
        latitude: Number(userCoordinates.latitude),
        longitude: Number(userCoordinates.longitude),
      },
      destination: {
        latitude: Number(selectedMarker.latitude),
        longitude: Number(selectedMarker.longitude),
      },
    })
      .then(routeData => {
        if (!cancelled) {
          setRouteCoordinates(
            Array.isArray(routeData?.coordinates) ? routeData.coordinates : [],
          );
          setSelectedRouteSummary({
            distanceLabel: String(routeData?.distanceLabel || '').trim(),
            durationLabel: String(routeData?.durationLabel || '').trim(),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRouteCoordinates([]);
          setSelectedRouteSummary(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [Polyline, apiKey, hasUserCoordinates, selectedMarker, userCoordinates]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || focusCoordinates.length === 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      if (!mapRef.current) {
        return;
      }

      if (focusCoordinates.length === 1) {
        mapRef.current.animateToRegion(buildRegion(focusCoordinates), 250);
        return;
      }

      mapRef.current.fitToCoordinates(focusCoordinates, {
        animated: true,
        edgePadding: {
          top: 56,
          right: 32,
          bottom: 56,
          left: 32,
        },
      });
    }, 60);

    return () => clearTimeout(timeoutId);
  }, [focusCoordinates, mapReady]);

  const openExternalUrl = useCallback(url => {
    const normalizedUrl = String(url || '').trim();
    if (!normalizedUrl) {
      return;
    }

    Linking.openURL(normalizedUrl).catch(() => {});
  }, []);

  const handleAndroidNavigation = useCallback(
    request => {
      const url = String(request?.url || '');

      if (!url || url === 'about:blank') {
        return true;
      }

      if (
        url.includes('google.com/maps') ||
        url.includes('maps.google.com') ||
        url.includes('waze.com/ul')
      ) {
        openExternalUrl(url);
        return false;
      }

      return true;
    },
    [openExternalUrl],
  );

  if (!apiKey || (markerPayloads.length === 0 && !hasUserCoordinates && pathCoordinates.length === 0)) {
    return null;
  }

  if (Platform.OS === 'android') {
    return (
      <View style={styles.mapContainer}>
        <NativeWebView
          source={{html: androidMapHtml, baseUrl: androidMapBaseUrl}}
          style={styles.mapViewport}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={handleAndroidNavigation}
          onMessage={event => {
            try {
              const message = JSON.parse(event.nativeEvent.data);

              if (message?.type === 'ready') {
                setAndroidMapState('ready');
                setAndroidMapErrorMessage('');
                return;
              }

              if (message?.type === 'open-url') {
                openExternalUrl(message?.url);
                return;
              }

              if (message?.type === 'error') {
                setAndroidMapState('error');
                setAndroidMapErrorMessage(
                  String(message?.message || '').trim() || DEFAULT_ANDROID_ERROR_MESSAGE,
                );
                return;
              }

              if (message?.type === 'window-error') {
                setAndroidMapState('error');
                setAndroidMapErrorMessage(
                  String(message?.message || '').trim() || DEFAULT_ANDROID_ERROR_MESSAGE,
                );
                return;
              }

              if (message?.type === 'console') {
                const consoleMessage = String(message?.message || '').trim();

                if (GOOGLE_MAPS_WEBVIEW_ERROR_PATTERN.test(consoleMessage)) {
                  setAndroidMapErrorMessage(consoleMessage);
                }
              }
            } catch {
              setAndroidMapState('error');
              setAndroidMapErrorMessage(DEFAULT_ANDROID_ERROR_MESSAGE);
            }
          }}
          onError={() => {
            setAndroidMapState('error');
            setAndroidMapErrorMessage(current =>
              current || DEFAULT_ANDROID_ERROR_MESSAGE,
            );
          }}
        />
        {androidMapState !== 'ready' ? (
          <View style={styles.mapOverlay}>
            {androidMapState !== 'error' ? (
              <ActivityIndicator color={routeColor} />
            ) : null}
            <Text style={styles.mapOverlayText}>
              {androidMapState === 'error'
                ? androidMapErrorMessage || DEFAULT_ANDROID_ERROR_MESSAGE
                : 'Carregando mapa das unidades...'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <NativeMapView
      ref={mapRef}
      style={styles.mapViewport}
      initialRegion={initialRegion}
      provider={Platform.OS === 'android' && PROVIDER_GOOGLE ? PROVIDER_GOOGLE : undefined}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass
      rotateEnabled
      toolbarEnabled={false}
      onMapReady={() => setMapReady(true)}>
      {hasUserCoordinates ? (
        <Marker
          key="shop-user-location"
          coordinate={{
            latitude: Number(userCoordinates.latitude),
            longitude: Number(userCoordinates.longitude),
          }}
          title="Sua localizacao"
          description="Posicao atual do cliente"
          onPress={() => {
            setSelectedMarkerId(null);
            setRouteCoordinates([]);
            setSelectedRouteSummary(null);
          }}
        />
      ) : null}
      {Polyline && routeCoordinates.length > 1 ? (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={routeColor}
          strokeWidth={5}
        />
      ) : null}
      {Polyline && Array.isArray(paths)
        ? paths.map(path => {
            const from = extractMapCoordinates(path?.from || path?.origin || path?.start);
            const to = extractMapCoordinates(path?.to || path?.destination || path?.end);

            if (!from || !to) {
              return null;
            }

            return (
              <Polyline
                key={path?.id || `${from.latitude}:${from.longitude}-${to.latitude}:${to.longitude}`}
                coordinates={[from, to]}
                strokeColor={path?.color || routeColor}
                strokeWidth={4}
              />
            );
          })
        : null}
      {markerPayloads.map(item => {
        const navigationUrls = resolveMarkerNavigationUrls(item);
        const title = item?.unitAlias || item?.alias || item?.companyName || item?.title;
        const travelSummary =
          selectedMarkerId === item.id
            ? buildTravelSummary(item, selectedRouteSummary)
            : buildTravelSummary(item, null);
        const logoFallback = String(title || 'CO')
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map(chunk => chunk[0] || '')
          .join('')
          .toUpperCase();

        return (
          <Marker
            key={item.id}
            coordinate={{
              latitude: Number(item.latitude),
              longitude: Number(item.longitude),
            }}
            title={item.title}
            description={item.addressLine}
            onPress={() => setSelectedMarkerId(item.id)}>
            {item.markerIconUrl ? (
              <View style={styles.markerWrap}>
                <Image
                  source={{uri: item.markerIconUrl}}
                  style={styles.markerIcon}
                  resizeMode="contain"
                />
              </View>
            ) : null}
            <Callout tooltip>
              <View
                style={[
                  styles.calloutCard,
                  {
                    backgroundColor: resolvedPopupTheme.modalBackground,
                    shadowColor: resolvedPopupTheme.modalShadow,
                  },
                ]}>
                <View style={styles.headerRow}>
                  <View
                    style={[
                      styles.logoWrap,
                      {borderColor: resolvedPopupTheme.dividerBorder},
                    ]}>
                    {item?.companyLogoUrl ? (
                      <Image
                        source={{uri: item.companyLogoUrl}}
                        style={styles.logoImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text
                        style={[
                          styles.logoFallback,
                          {color: resolvedPopupTheme.buttonBackground},
                        ]}>
                        {logoFallback}
                      </Text>
                    )}
                  </View>
                  <View style={styles.headerContent}>
                    <Text
                      style={[
                        styles.title,
                        {color: resolvedPopupTheme.modalHeaderText},
                      ]}>
                      {title}
                    </Text>
                  </View>
                </View>
                {item.addressLine ? (
                  <Text style={[styles.line, {color: resolvedPopupTheme.modalText}]}>
                    {item.addressLine}
                  </Text>
                ) : null}
                {item.addressExtra ? (
                  <Text style={[styles.line, {color: resolvedPopupTheme.modalText}]}>
                    {item.addressExtra}
                  </Text>
                ) : null}

                {travelSummary ? (
                  <Text
                    style={[
                      styles.summaryText,
                      {color: resolvedPopupTheme.textMuted},
                    ]}>
                    {travelSummary}
                  </Text>
                ) : null}

                <View style={styles.actionsRow}>
                  <CalloutAction
                    label="Abrir no Maps"
                    onPress={() => openExternalUrl(navigationUrls.googleMapsUrl)}
                    popupTheme={resolvedPopupTheme}
                    primary
                  />
                  <CalloutAction
                    label="Abrir no Waze"
                    onPress={() => openExternalUrl(navigationUrls.wazeUrl)}
                    popupTheme={resolvedPopupTheme}
                    primary
                  />
                </View>
              </View>
            </Callout>
          </Marker>
        );
      })}
    </NativeMapView>
  );
}
