<template>
    <label
      v-if="
        configs.showLabels &&
        configs.labelType != 'stack-label' &&
        configs.store &&
        (!column.preview || !data || !data['@id'])
      "
    >
      {{ $tt(configs.store, "input", column.label) }}
    </label>
    <label
      v-else-if="
        configs.showLabels &&
        configs.labelType != 'stack-label' &&
        (!column.preview || !data || !data['@id'])
      "
    >
      {{ column.label }}
    </label>
    </template>

<script>

export default {
  props: {
    column: {
      type: Object,
      required: true,
    },
    configs: {
      type: Object,
      required: true,
    },
  },


};
</script>