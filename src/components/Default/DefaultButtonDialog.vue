<template>
  <q-btn
    class="q-pa-xs btn-primary"
    dense
    :icon="configs.icon"
    @click="openModal = true"
  >
    <q-tooltip>
      {{ $tt(configs.store, "btn", configs.store) }}
    </q-tooltip>
  </q-btn>
  <q-dialog v-model="openModal" maximized>
    <q-card class="">
      <q-card-section class="row col-12 q-pa-sm">
        <q-toolbar class="">
          <q-toolbar-title class="">
            {{ $tt(configs.store, "title", configs.store) }}
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
          :context="configs.context"
          :configs="configs"
          :is="configs.component"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script>
export default {
  props: {
    configs: {},
  },
  computed: {},
  created() {},
  data() {
    return {
      openModal: false,
    };
  },
  watch: {},
  methods: {},
};
</script>
