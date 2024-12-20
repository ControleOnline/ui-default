<template>
  <q-page>
    <Search
      @emit-search="emitSearch"
      :logo="false"
      :title="titles.title"
      :subtitle="titles.subtitle"
    >
    </Search>
    <CardListGuides
      v-for="(item, index) in filteredList()"
      :key="item.user_name"
      :id="item.id"
      :index="index"
      :title_guide="item.title_guide"
      :price="item.price"
      :images_slide="item.images_slide"
      :favorite="item.favorite"
      :image_profile="item.image_profile"
      :user_name="item.user_name"
      :assessment="item.assessment"
      :difficulty="item.difficulty"
      :distance="item.distance"
      :distance_option="item.distance_option"
      :duration="item.duration"
      :duration_option="item.duration_option"
      :vacancies="item.vacancies">
    </CardListGuides>
    <ToolsFooter></ToolsFooter>
  </q-page>
</template>

<script>
 import CardListGuides from '@controleonline/ui-legacy/ui-common/src/components/Card/CardListGuides';
import ToolsFooter from '@controleonline/ui-legacy/ui-common/src/components/Footer/ToolsFooter';
import Search from '@controleonline/ui-legacy/ui-common/src/components/Header/Search';

export default {
  name: 'CategoriesList',

  components: {
    Search,
    CardListGuides,
    ToolsFooter,
  },

  data() {
    return {
      value: '',
    };
  },

  computed: {
    list: {
      get() { return this.$store.getters['Guides/getGuidesList']; },
      set(value) { this.$store.commit('Guides/setGuidesList', { list: value }); },
    },
    titles() {
      const { name_category: title, items } = this.category;

      const { name_item: subtitle } = items
        .find((item) => item.id.toString() === this.$route.params.id);

      return { title, subtitle };
    },
    category() {
      const categories = ((this.$store.getters['categories/getCategoryList']));

      return categories
        .find((category) => category.id.toString() === this.$route.params.id_category);
    },
  },

  methods: {
    emitSearch(value) {
      this.value = value;
    },
    filteredList() {
      const listItems = ((this.list));

      if (!this.value) return listItems;

      return listItems.filter((item) => item.title_guide
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .includes(this.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
    },
  },
};
</script>
