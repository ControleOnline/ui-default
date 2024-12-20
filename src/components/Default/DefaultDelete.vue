<template>
  <q-btn
    dense
    :size="configs.size"
    :flat="configs.flat"
    :color="configs.color"
    icon="delete"
    :class="'btn-danger'"
    :disable="isSaving || deleteModal"
    @click="openConfirm()"
  >
    <q-tooltip>
      {{ $tt(configs.store, "tooltip", "delete") }}
    </q-tooltip>
  </q-btn>

  <q-dialog v-model="deleteModal">
    <q-card class="q-pa-md full-width">
      <q-card-section class="row items-center">
        <label class="text-h5">{{
          $tt(configs.store, "title", "msg_delete")
        }}</label>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section>
        <div class="flex q-pt-md">
          <q-btn
            class="q-py-sm q-px-md text-capitalize btn-primary"
            :label="$tt(configs.store, 'btn', 'cancel')"
            v-close-popup
          >
          </q-btn>
          <q-space></q-space>
          <q-btn
            class="q-py-sm q-px-md text-capitalize btn-primary"
            :label="$tt(configs.store, 'btn', 'confirm')"
            @click="confirmDelete"
            :loading="isSaving"
          >
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  data() {
    return {
      deleteModal: false,
    };
  },
  props: {
    item: {
      type: Object,
      required: true,
      default: {},
    },
    configs: {
      type: Object,
      required: true,
      default: {},
    },
  },

  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
    isSaving() {
      return this.$store.getters[this.configs.store + "/isSaving"];
    },
  },
  methods: {
    ...mapActions({}),
    openConfirm() {
      this.deleteModal = true;
    },

    confirmDelete() {
      this.$store
        .dispatch(
          this.configs.store + "/remove",
          this.item["@id"].split("/").pop()
        )
        .then((data) => {
          this.$emit("deleted", this.item);
        })
        .finally(() => {
          this.deleteModal = false;
        });
    },
  },
};
</script>
