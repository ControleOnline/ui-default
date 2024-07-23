<template>
  <q-btn :dense="btnDense" :class="componentProps.btnColor ? componentProps.btnColor : 'btn-primary'"
    :label="componentProps.btnTitle" :icon="componentProps.btnIcon" :flat="componentProps.btnFlat">
    <q-menu>
      <q-list>
        <template v-for="(itm, idx) in componentProps.items" :key="idx">
          <q-item clickable v-close-popup @click="handleItemClick(itm)" v-if="getPermission(itm)">
            <q-item-section v-if="itm.icon" side>
              <q-icon size="sm" :name="itm.icon"></q-icon>
            </q-item-section>
            <q-item-section>
              {{ $translate(itm.store || configs.store, itm.title, 'menu') }}
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-menu>
  </q-btn>

  <component :is="selectedComponent" :componentProps="componentProps" :row="row" @loadData="loadData"
    @closeComponent="closeComponent" v-if="selectedComponent" />
</template>

<script>
export default {
  emits: ['loadData'],
  props: {
    componentProps: Object,
    row: Object,
    configs: {
      type: Object,
      required: false
    }
  },

  data() {
    return {
      selectedComponent: null,
    }
  },
  created() {
  },
  methods: {
    getPermission(itm) {
      if (typeof itm.permission == 'function')
        return itm.permission(this.row);

      return itm.permission != false;
    },
    handleItemClick(itm) {
      this.selectedComponent = itm.component;
    },
    loadData() {
      this.$emit('loadData')
    },
    closeComponent() {
      this.selectedComponent = null;
    }
  }
}
</script>