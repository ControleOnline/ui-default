<template>
  <q-btn
    class="q-pa-xs btn-primary"
    dense
    icon="image"
    @click="openModal = true"
  >
    <q-tooltip>
      {{ $tt("category", "btn", "images") }}
    </q-tooltip>
  </q-btn>
  <q-dialog v-model="openModal">
    <q-card class="full-width">
      <q-card-section class="row col-12 q-pa-sm">
        <q-toolbar class="">
          <q-toolbar-title class="">{{
            $tt("category", "title", "images")
          }}</q-toolbar-title>
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
        <DefaultCarousel
          :files="row[column.key || column.name]"
          :configs="carouselConfigs"
          :object="{
            category: row['@id'],
          }"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  data() {
    return {
      openModal: false,
    };
  },
  computed: {
    carouselConfigs() {
      return {
        store: "category_file",
        isAdmin: true,
        context: this.column.key || this.column.name,
      };
    },
  },
  props: {
    row: {
      required: true,
    },
    configs: {
      type: Object,
      required: true,
    },
    column: {
      type: Object,
      required: true,
    },
  },
  created() {},
  methods: {
    ...mapActions({}),
  },
};
</script>
