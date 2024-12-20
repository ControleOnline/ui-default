export const routes = [
  {
    path     : '/support/',
    component: () =>  import ('@controleonline/ui-layout/src/layouts/AdminLayout.vue'),
    children : [
      { name: 'FAQ',  path: 'faq',  component: () =>  import ('../pages/Support/FAQ.vue') },
      { name: 'News', path: 'news', component: () =>  import ('../pages/Support/News.vue') },
      { name: 'NewsDetail', path: 'news/:id', component: () =>  import ('../pages/Support/NewsDetail.vue') },
    ]
  },
];