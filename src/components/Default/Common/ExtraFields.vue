<template>
  <q-btn
    class="q-pa-xs btn-primary"
    dense
    icon="add"
    @click="openFields = true"
  >
    <q-tooltip>
      {{ $tt(configs.store, "tooltip", "extra") }}
    </q-tooltip>
  </q-btn>
  <q-dialog v-model="openFields" full-width>
    <q-card class="">
      <q-card-section class="row col-12 q-pa-sm">
        <q-toolbar class="">
          <q-toolbar-title class="">{{
            $tt(configs.store, "title", "filters")
          }}</q-toolbar-title>
          <q-btn no-caps flat v-close-popup round dense icon="close" />
        </q-toolbar>
      </q-card-section>
      <q-card-section class="row items-center no-wrap">
        <FieldsTypes :context="context" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script>
import FieldsTypes from "@controleonline/ui-common/src/components/Fields/types";

export default {
  props: {
    configs: {
      type: Object,
      required: true,
    },
  },
  components: {
    FieldsTypes,
  },
  computed: {},
  created() {
    this.context = this.configs?.extraFields?.context || this.configs.store;
  },
  data() {
    return {
      context: null,
      openFields: false,
    };
  },
  watch: {},
  methods: {},
};
</script>
