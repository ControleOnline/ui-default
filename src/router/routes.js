<<<<<<< HEAD
export const routes = [{
    path: '/translates/',
=======
export const routes = [
  {
    path     : '/support/',
>>>>>>> b44ed49b07419a866987ea5af2bc99485d28e483
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
<<<<<<< HEAD
  }];
  
  export default routes
  
=======
  },
];
>>>>>>> b44ed49b07419a866987ea5af2bc99485d28e483
