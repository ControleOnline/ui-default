import React from 'react';
import {Image, Text, View} from 'react-native';
import DefaultMap from '../map/DefaultMap';
import {hasCoordinates} from './defaultAddressHelpers';
import {styles} from './defaultAddressStyles';

/**
 * Map + facade preview pane for DefaultAddress.
 */
export default function DefaultAddressMapPane({
  form,
  mapMarkerPayload,
  mapUserCoordinates,
  isDesktop,
}) {
  return (
    <View style={[styles.mapPane, isDesktop && styles.mapPaneDesktop]}>
      <Text style={styles.mapPaneTitle}>Mapa</Text>
      {hasCoordinates(form) || mapMarkerPayload ? (
        <View style={[styles.liveMap, isDesktop && styles.liveMapDesktop]}>
          <DefaultMap
            markerPayloads={mapMarkerPayload ? [mapMarkerPayload] : []}
            userCoordinates={mapUserCoordinates}
          />
        </View>
      ) : form.mapStaticUrl ? (
        <Image
          source={{uri: form.mapStaticUrl}}
          style={[styles.mapImage, isDesktop && styles.mapImageDesktop]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.mapPlaceholder, isDesktop && styles.mapImageDesktop]}>
          <Text style={styles.mapPlaceholderTitle}>Mapa indisponível</Text>
          <Text style={styles.mapPlaceholderText}>
            Consulte um CEP para carregar a localização quando a API retornar a
            imagem, ou informe latitude/longitude manualmente.
          </Text>
        </View>
      )}

      {/* Fachada only when provider returned street-view URL (not OSM). */}
      {form.facadeUrl ? (
        <>
          <Text style={styles.mapPaneTitle}>Fachada</Text>
          <Image
            source={{uri: form.facadeUrl}}
            style={styles.facadeImage}
            resizeMode="cover"
          />
        </>
      ) : null}
    </View>
  );
}
