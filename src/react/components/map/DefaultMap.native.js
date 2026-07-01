import React, {useMemo} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';

import DefaultNativeMap from './DefaultNativeMap.native';

import styles from './DefaultMap.styles';
import {
  buildOpenStreetMapEmbedUrl,
  resolveDefaultMapPayload,
} from './DefaultMap.shared';

export default function DefaultMap({
  config = null,
  addresses = null,
  markerPayloads = [],
  paths = [],
  userCoordinates = null,
  apiKey = '',
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
      />
    );
  }

  return (
    <View style={styles.mapContainer}>
      <WebView
        source={{
          uri: buildOpenStreetMapEmbedUrl({
            markerPayloads: resolvedPayload.markerPayloads,
            paths: resolvedPayload.paths,
            userCoordinates: resolvedPayload.userCoordinates,
          }),
        }}
        style={styles.mapViewport}
        originWhitelist={['*']}
      />
    </View>
  );
}
