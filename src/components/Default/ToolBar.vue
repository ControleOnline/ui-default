<template>
  <template v-if="configs.status">
    <template v-for="status in configs.status">
      <DefaultButtonDialog
        :configs="{
          icon: 'settings',
          store: 'status',
          context: status,
          component: component.Status,
        }"
      />
    </template>
  </template>
  <q-space v-if="configs.status && configs.controls != false" />
  <template v-if="configs.categories">
    <template v-for="category in configs.categories">
      <DefaultButtonDialog
        :configs="{
          icon: 'person',
          store: 'category',
          context: category,
          component: component.Categories,
        }"
      />
    </template>
  </template>
  <q-space v-if="configs.categories && configs.controls != false" />
  <DefaultButtonDialog
    v-if="configs.extraFields"
    :configs="{
      ...configs.extraFields,
      ...{
        icon: 'settings',
        store: 'extraFields',
        component: component.ExtraFields,
      },
    }"
    @loadData="loadData"
  />

  <q-space v-if="configs.extraFields && configs.controls != false" />

  <DefaultButtonDialog
    v-if="configs.import"
    :configs="{
      ...configs.import,
      ...{
        icon: 'attachment',
        store: 'imports',
        component: component.Imports,
      },
    }"
    @loadData="loadData"
  />

  <q-space v-if="configs.import && configs.controls != false" />
</template>

<script>
import DefaultButtonDialog from "@controleonline/ui-default/src/components/Default/DefaultButtonDialog";
import Categories from "@controleonline/ui-default/src/components/Default/Categories";
import Status from "@controleonline/ui-default/src/components/Default/Status";
import ExtraFields from "@controleonline/ui-default/src/components/Default/Common/ExtraFields";
import Imports from "@controleonline/ui-default/src/components/Default/Import";

export default {
  components: {
    DefaultButtonDialog,
  },
  props: {
    row: Object,
    configs: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      component: {
        Categories,
        Status,
        ExtraFields,
        Imports,
      },
    };
  },
  created() {},
  methods: {},
};
</script>
