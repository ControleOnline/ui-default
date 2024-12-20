<template>
  <q-page padding>
    <div class="row">
      <div class="col-12">
        <NewsDetail />
      </div>
    </div>
  </q-page>
</template>

<script>
 import NewsDetail from '../../components/support/NewsDetail';

export default {
  name      : 'SupportNewsDetail',

  components: {
    NewsDetail,
  },

  data () {
    return {

    }
  }
}
</script>