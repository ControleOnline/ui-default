import React, {useMemo} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';

import DefaultNativeMap from './DefaultNativeMap.native';

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
      <DefaultNativeMap
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
      <WebView
        source={{
          html: buildOpenStreetMapHtml({
            markerPayloads: resolvedPayload.markerPayloads,
            paths: resolvedPayload.paths,
            userCoordinates: resolvedPayload.userCoordinates,
            routeColor: '#0EA5E9',
          }),
        }}
        style={styles.mapViewport}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}
