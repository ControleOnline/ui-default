export const routes = [{
    path: '/ead/contents/',
    component: () =>  import ('@controleonline/ui-layout/src/layouts/AdminLayout.vue'),
    children: [
      {
        name: 'ContentIndex',
        path: '',
        component: () =>  import ('@controleonline/ui-ead/src/pages/contents'),
      },    
      {
        name: "contentDetails",
        path: "id/:id",
        component: () => import("@controleonline/ui-ead/src/pages/contents/Details.vue"),
      }      
    ]
  }];
  
  export default routes
  