<template>
  <template v-for="comp in headerActionsComponent()">
    <DefaultComponent
      :componentConfig="comp"
      :row="row"
      :componentProps="comp.props"
      :configs="comp.configs"
      @saved="$emit('saved')"
      @loadData="$emit('loadData')"
    />

    <q-space></q-space>
  </template>

  <template v-for="column in columns">
    <template v-if="configs.columns">
      <template v-if="configs.columns[column.name]?.store">
        <DefaultButtonDialog
          @saved="$emit('saved')"
          @loadData="$emit('loadData')"
          :configs="configs.columns[column.name]"
        />
      </template>
    </template>
  </template>

  <template v-if="configs.status">
    <template v-for="status in configs.status">
      <DefaultButtonDialog
        @saved="$emit('saved')"
        @loadData="$emit('loadData')"
        :componentProps="comp.props"
        :configs="{
          icon: 'manage_accounts',
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
        @saved="$emit('saved')"
        @loadData="$emit('loadData')"
        :componentProps="comp.props"
        :configs="{
          icon: 'card_travel', // spoke, card_travel and stacks
          store: 'categories',
          context: category,
          component: component.Categories,
          columns: {
            parent: {
              filters: {
                context: category,
                company: '/people/' + this.myCompany.id,
              },
            },
          },
        }"
      />
    </template>
  </template>
  <q-space v-if="configs.categories && configs.controls != false" />
  <DefaultButtonDialog
    @saved="$emit('saved')"
    @loadData="$emit('loadData')"
    v-if="configs.extraFields"
    :configs="{
      ...configs.extraFields,
      ...{
        icon: 'settings',
        store: 'extraFields',
        component: component.ExtraFields,
      },
    }"
  />

  <q-space v-if="configs.extraFields && configs.controls != false" />

  <DefaultButtonDialog
    @saved="$emit('saved')"
    @loadData="$emit('loadData')"
    v-if="configs.import"
    :configs="{
      ...configs.import,
      ...{
        icon: 'attachment',
        store: 'imports',
        component: component.Imports,
      },
    }"
  />

  <q-space v-if="configs.import && configs.controls != false" />
  <DefaultSearch
    :configs="configs"
    @loadData="$emit('loadData')"
  ></DefaultSearch>

  <DefaultFilters
    v-if="configs.filters"
    :configs="configs"
    @loadData="$emit('loadData')"
  >
  </DefaultFilters>
  <q-space v-if="configs.filters && configs.controls != false"></q-space>
</template>

<script>
import Categories from "@controleonline/ui-default/src/components/Default/Categories";
import Status from "@controleonline/ui-default/src/components/Default/Status";
import ExtraFields from "@controleonline/ui-default/src/components/Default/Common/ExtraFields";
import Imports from "@controleonline/ui-default/src/components/Default/Import";
import { mapActions, mapGetters } from "vuex";
import DefaultFilters from "@controleonline/ui-default/src/components/Default/Filters/DefaultFilters";
import DefaultSearch from "@controleonline/ui-default/src/components/Default/Filters/DefaultSearch";

export default {
  components: {
    DefaultFilters,
    DefaultSearch,
  },
  props: {
    row: Object,
    configs: {
      type: Object,
      required: true,
    },
    columns: {
      type: Object,
      default: [],
    },
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
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
  methods: {
    headerActionsComponent() {
      return this.configs.components?.headerActions;
    },
  },
};
</script>
