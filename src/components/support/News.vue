<template>
<q-table dense  grid hide-header        
        :rows   ="items"
        @request="onRequest"
        row-key ="id"
      >  
    <template v-slot:item="props">
      <div class="q-pa-md row items-start q-gutter-md col-lg-4 col-md-6 col-sm-12">
        <q-card class="my-card row items-start q-pa-md">
          <q-img
            :src="props.row.featured_image"
            height="150px"
          />          
          <q-card-section>                                      
              <router-link v-bind:to="props.row.href" tag='a' class='t-link'>
              <div class="text-h6 title">                
                  {{ props.row.title.rendered }}                            
              </div>
              </router-link>
              <router-link v-bind:to="props.row.href" tag='a' class='t-link'>
              <div class="text-main-text2 main-text">                
                  {{ props.row.excerpt.rendered }}                
              </div>                      
              </router-link>
          </q-card-section>
        </q-card>
        </div>
    </template>  
  </q-table> 
</template>

<script>

import { mapActions, mapGetters } from 'vuex';
export default {
  data() {
    return {
      items : []      
    }
  },
  created() {    
      this.onRequest();
  },
  computed: {
    ...mapGetters({
      isLoading: 'profile/isLoading'
    }),
  },
  methods: {
    ...mapActions({
      getNews: 'support/getNews'
    }),
  onRequest() {
      this.items = [];
      let params = {        
        'status': 'publish'
      };            
      this.getNews(params)
        .then(items => {        
          if (items.count) {
            for (let index in items.data) {
              this.items.push({
                id             : items.data[index]['id'],
                title          : items.data[index]['title'],
                author         : items.data[index]['author'],
                categories     : items.data[index]['categories'],
                content        : items.data[index]['content'],
                date_gmt       : items.data[index]['date_gmt'],
                date           : items.data[index]['date'],
                excerpt        : items.data[index]['excerpt'],
                guid           : items.data[index]['guid'],
                link           : items.data[index]['link'],
                modified       : items.data[index]['modified'],
                modified_gmt   : items.data[index]['modified_gmt'],
                slug           : items.data[index]['slug'],
                status         : items.data[index]['status'],
                tags           : items.data[index]['tags'],
                type           : items.data[index]['type'],
                featured_image : items.data[index]['featured_image'],
                href           : '/support/news/'+items.data[index]['id'],
                _bussy  : false,
              });
            }            
          }
        });
    }
    }
}

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
