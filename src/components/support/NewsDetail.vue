<template>
  <q-table flat grid hide-header :rows="items" @request="onRequest" row-key="id">
    <template v-slot:item="props">
      <q-card class="my-card row items-start q-pa-md">
        <q-parallax :height="300" :speed="0.5">
          <template v-slot:media>
            <img :src="props.row.featured_image" />
          </template>
        </q-parallax>
        <q-card-section>
          <div class="text-h6 title">
            {{ props.row.title.rendered }}
          </div>
          <div class="text-main-text2 main-text">
            {{ props.row.content.rendered }}
          </div>
        </q-card-section>
      </q-card>
    </template>
  </q-table>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
export default {
  data() {
    return {
      items: [],
      params: {
        include: [],
        status: "publish",
      },
    };
  },
  created() {
    if (this.$route.params.id)
      this.params.include = decodeURIComponent(this.$route.params.id);
    this.onRequest();
  },
  computed: {
    ...mapGetters({
      isLoading: "profile/isLoading",
    }),
  },
  methods: {
    ...mapActions({
      getNews: "support/getNews",
    }),
    onRequest() {
      this.items = [];
      let params = this.params;
      this.getNews(params).then((items) => {
        if (items.count) {
          for (let index in items.data) {
            this.items.push({
              id: items.data[index]["id"],
              title: items.data[index]["title"],
              author: items.data[index]["author"],
              categories: items.data[index]["categories"],
              content: items.data[index]["content"],
              date_gmt: items.data[index]["date_gmt"],
              date: items.data[index]["date"],
              excerpt: items.data[index]["excerpt"],
              guid: items.data[index]["guid"],
              link: items.data[index]["link"],
              modified: items.data[index]["modified"],
              modified_gmt: items.data[index]["modified_gmt"],
              slug: items.data[index]["slug"],
              status: items.data[index]["status"],
              tags: items.data[index]["tags"],
              type: items.data[index]["type"],
              featured_image: items.data[index]["featured_image"],
              href: "/support/news/" + items.data[index]["id"],
              _bussy: false,
            });
          }
        }
      });
    },
  },
};
</script>
<style>
.my-card {
  width: 100%;
}
.title,
.title a,
.t-link {
  width: 100%;
  color: #000;
  text-decoration: none;
}
.main-text img:nth-child(1) {
  display: none;
}
.title {
  font-weight: 900;
}
.main-text h2 {
  font-size: 20px;
}
</style>
