<template>
  <q-btn
    class="q-pa-xs btn-primary"
    dense
    :disable="configs.disable"
    :icon="configs.icon"
    @click="
      $emit('click', $event);
      openModal = true;
    "
  >
    <q-tooltip>
      {{ $tt(configs.store, "btn", configs.label || configs.store) }}
    </q-tooltip>
  </q-btn>
  <q-dialog v-model="openModal" :full-width="configs['full-width'] != false">
    <q-card class="">
      <q-card-section class="row col-12 q-pa-sm">
        <q-toolbar class="">
          <q-toolbar-title class="">
            {{ $tt(configs.store, "title", configs.label || configs.store) }}
          </q-toolbar-title>
          <q-btn
            class="btn-primary"
            no-caps
            flat
            v-close-popup
            round
            dense
            icon="close"
          />
        </q-toolbar>
      </q-card-section>
      <q-card-section class="row q-pa-md">
        <component
          :context="configs.context || configs.store"
          :configs="configs"
          :data="row"
          :index="configs.index"
          :is="configs.component"
          @saved="saved"
          @error="error"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script>
export default {
  props: {
    configs: { default: {} },
    row: { default: {} },
  },
  computed: {},
  created() {},
  data() {
    return {
      openModal: false,
    };
  },
  watch: {},
  methods: {
    error(data) {
      this.$emit("error", data);
    },
    saved(data, editIndex) {
      this.openModal = false;
      this.$emit("saved", data, editIndex);
    },
    loadData() {
      this.$emit("loadData");
    },
  },
};
</script>
