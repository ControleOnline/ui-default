<template>
  <q-btn
    :class="configs.class || 'q-pa-xs btn-primary'"
    dense
    :size="configs.size"
    :disable="configs.disable"
    :icon="configs.icon"
    @click="
      $emit('click', $event);
      openModal = true;
    "
  >
    <q-tooltip>
      {{
        $tt(
          configs.store,
          "btn",
          configs.label || configs.context || configs.store
        )
      }}
    </q-tooltip>
  </q-btn>
  <q-dialog
    v-model="openModal"
    :full-width="configs['full-width'] != false"
    :full-height="configs['full-height'] == true"
  >
    <q-card class="">
      <q-card-section
        class="row col-12 q-pa-sm fixed bg-primary sticky-top full-width"
      >
        <q-toolbar class="">
          <q-toolbar-title class="">
            {{
              $tt(
                configs.store,
                "title",
                configs.label || configs.context || configs.store
              )
            }}
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
      <q-card-section class="row q-pa-md" :style="{ 'padding-top': '80px' }">
        <component
          :context="configs.context || configs.store"
          :configs="configs.componentConfigs || configs"
          :data="row"
          :index="configs.index"
          :is="configs.component"
          @saved="saved"
          @save="save"
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
    save(data) {
      this.openModal = false;
      this.$emit("save", data, this.configs.index);
    },
    loadData() {
      this.$emit("loadData");
    },
  },
};
</script>
