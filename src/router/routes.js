<<<<<<< HEAD
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
=======
export const routes = [{
    path: '/translates/',
    component: () =>  import ('@controleonline/ui-layout/src/layouts/AdminLayout.vue'),
    children: [
      {
        name: 'TranslateIndex',
        path: '',
        component: () =>  import ('@controleonline/ui-translate/src/pages/Menu.vue'),
      },    
      {
        name: "translateDetails",
        path: "id/:id",
        component: () => import("@controleonline/ui-translate/src/pages/Details.vue"),
      }      
    ]
  }];
  
  export default routes
  
>>>>>>> 8dee2441582991932e51ed2f3bc190a3c15b39b6
