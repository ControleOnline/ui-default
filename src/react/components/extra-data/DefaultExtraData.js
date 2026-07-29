import React, { useMemo } from 'react'
import { Text, View } from 'react-native'

import styles from './DefaultExtraData.styles'

const normalizeExtraData = value => {
  if (!value) return []

  const parsed = typeof value === 'string'
    ? JSON.parse(value)
    : value

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return []
  }

  return Object.entries(parsed)
    .filter(([, itemValue]) => itemValue !== null && itemValue !== undefined && itemValue !== '')
    .map(([key, itemValue]) => ({
      key,
      value: typeof itemValue === 'object' ? JSON.stringify(itemValue) : String(itemValue),
    }))
}

const DefaultExtraData = ({ value }) => {
  const items = useMemo(() => {
    try {
      return normalizeExtraData(value)
    } catch {
      return []
    }
  }, [value])

  if (items.length === 0) {
    return <Text style={styles.empty}>-</Text>
  }

  return (
    <View style={styles.wrap}>
      {items.slice(0, 4).map(item => (
        <View key={item.key} style={styles.item}>
          <Text style={styles.key} numberOfLines={1}>
            {item.key}
          </Text>
          <Text style={styles.value} numberOfLines={1}>
            {item.value}
          </Text>
        </View>
      ))}
      {items.length > 4 ? (
        <Text style={styles.more} numberOfLines={1}>
          +{items.length - 4}
        </Text>
      ) : null}
    </View>
  )
}

export default DefaultExtraData
