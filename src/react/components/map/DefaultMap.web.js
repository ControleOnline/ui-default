import React, {useEffect, useMemo, useRef} from 'react';
import {View} from 'react-native';

import DefaultGoogleMap from './DefaultGoogleMap.web';

import styles from './DefaultMap.styles';
import {
  buildOpenStreetMapHtml,
  resolveDefaultMapPayload,
} from './DefaultMap.shared';

export default function DefaultMap({
  config = null,
  addresses = null,
  markerPayloads = [],
  paths = [],
  userCoordinates = null,
  apiKey = '',
  popupTheme = null,
}) {
  const iframeRef = useRef(null);
  const resolvedPayload = useMemo(
    () =>
      resolveDefaultMapPayload({
        config,
        addresses,
        markerPayloads,
        paths,
        userCoordinates,
        apiKey,
      }),
    [apiKey, addresses, config, markerPayloads, paths, userCoordinates],
  );

  const mapKey = useMemo(() => {
    const markers = resolvedPayload.markerPayloads || [];
    const first = markers[0] || {};
    const user = resolvedPayload.userCoordinates || {};
    return [
      first.latitude,
      first.longitude,
      first.geocodeQuery || first.addressLine || '',
      user.latitude,
      user.longitude,
      markers.length,
      (resolvedPayload.paths || []).length,
    ].join('|');
  }, [resolvedPayload]);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el) {
      return undefined;
    }

    const bump = () => {
      try {
        const win = el.contentWindow;
        if (win && typeof win.dispatchEvent === 'function') {
          win.dispatchEvent(new Event('resize'));
        }
      } catch (e) {
        // empty srcDoc during mount
      }
    };

    const onLoad = () => {
      bump();
      setTimeout(bump, 50);
      setTimeout(bump, 250);
      setTimeout(bump, 800);
    };

    el.addEventListener('load', onLoad);
    return () => el.removeEventListener('load', onLoad);
  }, [mapKey]);

  if (
    resolvedPayload.markerPayloads.length === 0 &&
    !resolvedPayload.userCoordinates &&
    resolvedPayload.paths.length === 0
  ) {
    return null;
  }

  if (resolvedPayload.apiKey) {
    return (
      <DefaultGoogleMap
        apiKey={resolvedPayload.apiKey}
        markerPayloads={resolvedPayload.markerPayloads}
        userCoordinates={resolvedPayload.userCoordinates}
        paths={resolvedPayload.paths}
        popupTheme={popupTheme}
      />
    );
  }

  const html = buildOpenStreetMapHtml({
    markerPayloads: resolvedPayload.markerPayloads,
    paths: resolvedPayload.paths,
    userCoordinates: resolvedPayload.userCoordinates,
    routeColor: '#0EA5E9',
  });

  return (
    <View style={[styles.mapContainer, {height: '100%', minHeight: 220, width: '100%', flex: 1}]}>
      <iframe
        ref={iframeRef}
        key={mapKey}
        title="Mapa"
        srcDoc={html}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 220,
          border: 0,
          display: 'block',
        }}
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </View>
  );
}
