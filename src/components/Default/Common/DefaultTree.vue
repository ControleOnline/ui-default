<template>
  <DefaultButtonDialog
    v-if="configs.editable != false"
    :configs="{
      icon: 'add',
      store: configs.store,
      label: 'add',
      component: this.$components.DefaultForm,
      componentConfigs: configs,
    }"
    @saved="saved"
    @error="error"
  />

  <q-tree
    v-if="categoryTree.length > 0"
    :nodes="categoryTree"
    node-key="value"
    tick-strategy="leaf"
    default-expand-all
    v-model:ticked="selectedCategories"
  />
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  data() {
    return {
      building: true,
      linkedData: [],
      selectedCategories: [],
      categoryTree: [],
    };
  },
  props: {
    context: {
      required: true,
    },
    company: {
      required: true,
    },
    linkConfigs: {
      required: true,
    },
    linkObj: {
      required: true,
    },
  },
  computed: {
    configs() {
      return {
        filters: true,
        store: "categories",
        selection: false,
        search: {},
        components: {},
        columns: {
          parent: {
            filters: {
              context: this.context,
              company: this.company.id,
            },
          },
        },
      };
    },
  },

  created() {
    this.buildCategoryTree();
    let filters = { context: this.context, company: this.company.id };
    this.$store.commit(this.configs.store + "/SET_FILTERS", filters);
  },
  methods: {
    ...mapActions({
      getCategories: "categories/getItems",
    }),
    saved() {
      this.buildCategoryTree();
    },
    removeLinkedCategory(categoryIds) {
      categoryIds.forEach((categoryId, i) => {
        let obj =
          this.linkedData.find((data) => {
            return data.category.replace(/\D/g, "") == categoryId;
          }) || {};

        if (obj && obj["@id"])
          this.$store
            .dispatch(
              this.linkConfigs.store + "/remove",
              obj["@id"].replace(/\D/g, "")
            )
            .finally(() => {
              this.buildCategoryTree();
            });
      });
    },
    addLinkedCategory(categoryIds) {
      let obj = this.linkObj;
      categoryIds.forEach((categoryId, i) => {
        this.$store
          .dispatch(this.linkConfigs.store + "/save", {
            category: "/categories/" + categoryId,
            ...obj,
          })
          .finally(() => {
            this.buildCategoryTree();
          });
      });
    },
    async buildSelected() {
      let filters = this.$copyObject(this.linkConfigs.filters);
      filters["category.context"] = this.context;
      filters["category.company"] = this.company.id;

      return await this.$store.dispatch(
        this.linkConfigs.store + "/getItems",

        filters
      );
    },
    buildCategoryTree() {
      const map = {};
      const roots = [];
      this.building = true;
      let selected = [];
      this.buildSelected().then((selectedCategories) => {
        this.linkedData = selectedCategories;

        this.getCategories({
          context: this.context,
          company: this.company.id,
        })
          .then((result) => {
            result.forEach((category) => {
              map[category.id] = {
                value: category.id,
                label: category.name,
                icon: category.icon,
                children: [],
              };

              if (category.parent) {
                if (!map[category.parent.id]) {
                  map[category.parent.id] = { children: [] };
                }
                map[category.parent.id].children.push(map[category.id]);
              } else {
                roots.push(map[category.id]);
              }

              selectedCategories.some((item) => {
                if (item.category["@id"] === category["@id"])
                  selected.push(category.id);
              });
            });
            this.categoryTree = roots;
          })
          .finally(() => {
            this.selectedCategories = selected;
            setTimeout(() => {
              this.building = false;
            }, 100);
          });
      });
    },
  },
  watch: {
    selectedCategories: {
      handler: function (selectedCategories, oldSelectedCategories) {
        if (this.building == true) return;

        if (selectedCategories.length > oldSelectedCategories.length) {
          const categoryIds = selectedCategories.filter(
            (id) => !oldSelectedCategories.includes(id)
          );
          this.addLinkedCategory(categoryIds);
        } else if (selectedCategories.length < oldSelectedCategories.length) {
          const categoryIds = oldSelectedCategories.filter(
            (id) => !selectedCategories.includes(id)
          );
          this.removeLinkedCategory(categoryIds);
        }
      },
      deep: true,
    },
  },
};
</script>
