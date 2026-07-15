import React, {useMemo} from 'react';
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

  return (
    <View style={styles.mapContainer}>
      <iframe
        title="Mapa"
        srcDoc={buildOpenStreetMapHtml({
          markerPayloads: resolvedPayload.markerPayloads,
          paths: resolvedPayload.paths,
          userCoordinates: resolvedPayload.userCoordinates,
          routeColor: '#0EA5E9',
        })}
        style={{width: '100%', height: '100%', border: 0}}
      />
    </View>
  );
}
