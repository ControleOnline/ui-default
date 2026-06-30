const EMPTY_CUSTOM_RANGE = {
  from: '',
  to: '',
};

export const resolveNextDateFilterValue = (currentValue, optionKey) => {
  if (optionKey === 'all') {
    return null;
  }

  if (optionKey === 'custom') {
    return currentValue && typeof currentValue === 'object'
      ? currentValue
      : {
        shortcut: 'custom',
        customRange: EMPTY_CUSTOM_RANGE,
      };
  }

  return {
    ...(currentValue && typeof currentValue === 'object' ? currentValue : {}),
    shortcut: optionKey,
    customRange:
      currentValue?.customRange && typeof currentValue.customRange === 'object'
        ? currentValue.customRange
        : EMPTY_CUSTOM_RANGE,
  };
};

