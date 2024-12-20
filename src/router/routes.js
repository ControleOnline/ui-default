export const routes = [{
  path: '/docs/',
  component: () =>  import ('@controleonline/ui-layout/src/layouts/AdminLayout.vue'),
  children: [
    {
      name: 'DocsIndex',
      path: '',
      component: () =>  import ('../pages/Docs/Index.vue'),
    },
    {
      name: 'DocsCreate',
      path: 'create',
      component: () =>  import ('../pages/Docs/Edit.vue'),
    },
    {
      name: 'DocsDetails',
      path: 'id/:id',
      component: () =>  import ('../pages/Docs/Edit.vue'),
    }
  ]
}];

export default routes
