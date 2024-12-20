<template>
  <q-page>
    <Search @emit-search="emitSearch" :logo="true"></Search>
    <CardListHome
      v-for="category in list"
      :key="category.name_category"
      :title_category="$t(category.name_category)"
      :id_category="category.id"
      :list_items="filteredList(category.items, $t(category.name_category))"
    >
    </CardListHome>
    <ToolsFooter></ToolsFooter>
  </q-page>
</template>

<script>
import CardListHome from '@controleonline/ui-legacy/ui-common/src/components/Card/CardListHome';
import ToolsFooter from '@controleonline/ui-legacy/ui-common/src/components/Footer/ToolsFooter';
import Search from '@controleonline/ui-legacy/ui-common/src/components/Header/Search';

export default {
  name: 'CategoriesList',

  components: {
    Search,
    ToolsFooter,
    CardListHome,
  },

  data() {
    return {
      value: '',
    };
  },

  computed: {
    list: {
      get() { return this.$store.getters['categories/getCategoryList']; },
      set(value) { this.$store.commit('categories/setCategoryList', { list: value }); },
    },
  },

  methods: {
    emitSearch(value) {
      this.value = value;
    },
    filteredList(items, category) {
      const listItems = ((items));

      if (!this.value) return listItems;

      return listItems.filter((item) => [this.$t(item.name_item), category].join(' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .includes(this.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
    },
  },
};
</script>
