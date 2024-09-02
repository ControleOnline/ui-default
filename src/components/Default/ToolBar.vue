<template>
  <template v-if="configs.status">
    <template v-for="status in configs.status">
      <Status :componentProps="{ context: status }" />
    </template>
  </template>
  <q-space v-if="configs.status && configs.controls != false" />

  <template v-if="configs.categories">
    <template v-for="category in configs.categories">
      <Categories :componentProps="{ context: category }" />
    </template>
  </template>
  <q-space v-if="configs.categories && configs.controls != false" />

  <ExtraFields
    v-if="configs.extraFields"
    :configs="configs"
    @loadData="loadData"
  />

  <q-space v-if="configs.extraFields && configs.controls != false" />

  <Imports
    v-if="configs.import"
    :config="configs.import"
    @loadData="loadData"
  />

  <q-space v-if="configs.import && configs.controls != false" />
</template>

<script>
import ExtraFields from "@controleonline/ui-default/src/components/Default/Common/ExtraFields";
import Categories from "@controleonline/ui-default/src/components/Default/Categories/Button";
import Status from "@controleonline/ui-default/src/components/Default/Status/Button";
import Imports from "@controleonline/ui-default/src/components/Default/Import/Button";

export default {
  components: {
    ExtraFields,
    Categories,
    Status,
    Imports,
  },
  props: {
    row: Object,
    configs: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {};
  },
  created() {},
  methods: {},
};
</script>
