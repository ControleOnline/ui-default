<template>
  <q-card :class="cardClass">
    <q-card-section :class="sectionClass">
      <DefaultForm
        :configs="configs"
        @saved="saved"
        @error="error"
        :data="data"
        :index="index"
        v-if="data"
      />
    </q-card-section>
  </q-card>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  props: {
    configs: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: false,
    },
    sectionClass: {
      required: false,
      default() {
        return "row items-center";
      },
    },
    cardClass: {
      required: false,
      default() {
        return "q-pa-md";
      },
    },
    id: {
      required: true,
    },
  },
  components: {},
  data() {
    return {
      data: null,
    };
  },
  created() {
    this.init();
  },
  mounted() {},

  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
  },
  watch: {},
  methods: {
    saved(data) {
      this.$emit("saved", data);
    },
    error(error) {
      this.$emit("error", error);
    },
    init() {
      this.$store
        .dispatch(this.configs.store + "/get", this.id)
        .then((data) => {
          this.data = data;
        });
    },
  },
};
</script>
