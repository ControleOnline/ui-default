export const routes = [
  {
    path: '/imports/',
    component: () =>  import ('@controleonline/ui-layout/src/layouts/AdminLayout.vue'),
    children: [
      {
        name: 'ImportIndex',
        path: '',
        component: () =>  import ('../pages/Import/Index.vue')
      },

    ]
  }, {
    path: '/import/',
    component: () =>  import ('@controleonline/ui-layout/src/layouts/MainLayout.vue'),
    children: [
      {
        name: 'ImportDetails',
        path: 'id/:id',
        component: () =>  import ('../pages/Import/Details.vue')
      }
    ]
  },
];
