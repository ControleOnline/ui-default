import React, { useMemo } from 'react'
import { Text, View } from 'react-native'

import styles from './DefaultExtraData.styles'

const MAX_CELL_ITEMS = 4

const formatKey = key =>
  String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, letter => letter.toUpperCase())

const formatScalar = value => {
  if (value === true) return 'true'
  if (value === false) return 'false'
  return String(value ?? '').trim()
}

const summarizeValue = value => {
  if (Array.isArray(value)) return `${value.length}`
  if (value && typeof value === 'object') {
    return Object.keys(value).filter(Boolean).slice(0, 3).join(', ')
  }

  return formatScalar(value)
}

const resolveArrayKey = (item, index) =>
  item?.name || item?.id || item?.code || item?.source || `${index + 1}`

const buildItem = (key, value, depth = 0) => {
  if (Array.isArray(value)) {
    return {
      key,
      value: summarizeValue(value),
      children: value.map((item, index) =>
        buildItem(resolveArrayKey(item, index), item, depth + 1),
      ),
      depth,
    }
  }

  if (value && typeof value === 'object') {
    return {
      key,
      value: summarizeValue(value),
      children: Object.entries(value)
        .filter(([, itemValue]) => itemValue !== null && itemValue !== undefined && itemValue !== '')
        .map(([childKey, childValue]) => buildItem(childKey, childValue, depth + 1)),
      depth,
    }
  }

  return {
    key,
    value: formatScalar(value),
    children: [],
    depth,
  }
}

const normalizeExtraData = value => {
  if (!value) return []

  const parsed = typeof value === 'string'
    ? JSON.parse(value)
    : value

  if (Array.isArray(parsed)) {
    return parsed
      .map((item, index) => {
        const key = item?.field || item?.key || item?.name || resolveArrayKey(item, index)
        const itemValue = item?.value ?? item?.configValue ?? item?.data ?? item
        return buildItem(key, itemValue)
      })
      .filter(item => item.value || item.children.length > 0)
  }

  if (!parsed || typeof parsed !== 'object') {
    return []
  }

  return Object.entries(parsed)
    .filter(([, itemValue]) => itemValue !== null && itemValue !== undefined && itemValue !== '')
    .map(([key, itemValue]) => buildItem(key, itemValue))
}

const ExtraDataItem = ({ item, variant = 'cell' }) => {
  const isCard = variant === 'card'
  const children = Array.isArray(item.children) ? item.children : []

  return (
    <View style={[styles.item, isCard ? styles.cardItem : null]}>
      <Text style={styles.key} numberOfLines={1}>
        {formatKey(item.key)}
      </Text>
      {item.value ? (
        <Text style={styles.value} numberOfLines={isCard ? 4 : 1}>
          {item.value}
        </Text>
      ) : null}
      {isCard && children.length > 0 ? (
        <View style={styles.children}>
          {children.map((child, index) => (
            <ExtraDataItem
              key={`${item.key}-${child.key}-${index}`}
              item={child}
              variant={variant}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

const DefaultExtraData = ({ value, variant = 'cell' }) => {
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

  const isCard = variant === 'card'
  const visibleItems = isCard ? items : items.slice(0, MAX_CELL_ITEMS)

  return (
    <View style={[styles.wrap, isCard ? styles.cardWrap : null]}>
      {visibleItems.map((item, index) => (
        <ExtraDataItem
          key={`${item.key}-${index}`}
          item={item}
          variant={variant}
        />
      ))}
      {!isCard && items.length > MAX_CELL_ITEMS ? (
        <Text style={styles.more} numberOfLines={1}>
          +{items.length - MAX_CELL_ITEMS}
        </Text>
      ) : null}
    </View>
  )
}

export default DefaultExtraData
