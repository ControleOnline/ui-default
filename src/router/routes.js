
export const routes = [

    {
        path: '/Menu',
        component: () =>  import ('@controleonline/ui-layout/src/layouts/MainLayout.vue'),
        children: [
            {
                path: '/profile',
                name: 'profile',
                component: () =>  import ('../pages/Menu/ProfileMenu.vue'),
            },

            {
                path: '/your-guides',
                name: 'your-guides',
                component: () =>  import ('../pages/Menu/YourGuides.vue'),
            },

            {
                path: '/reviews',
                name: 'reviews',
                component: () =>  import ('../pages/Menu/ReviewsMenu.vue'),
            },
        ],
    },
    {
        path: '/Categories',
        component: () =>  import ('@controleonline/ui-layout/src/layouts/MainLayout.vue'),
        children: [
            {
                path: '/categories',
                name: 'categories',
                component: () =>  import ('../pages/Categories/CategoriesList.vue'),
            },
        ],
    },
    {
        path: '/Guides',
        component: () =>  import ('@controleonline/ui-layout/src/layouts/MainLayout.vue'),
        children: [
            {
                name: 'guides',
                path: ':id_category/:id',
                component: () =>  import ('../pages/Guides/GuidesList.vue'),
            },

            {
                path: '/guide/:id',
                name: 'guide',
                component: () =>  import ('../pages/Guides/GuideDetails.vue'),
            },

            {
                path: '/event-details',
                name: 'event-details',
                component: () =>  import ('../pages/Guides/EventDetails.vue'),
            },

            {
                path: '/view-edit-guide',
                name: 'view-edit-guide',
                component: () =>  import ('../pages/Guides/ViewAndEditGuide.vue'),
            },

            {
                path: '/reserve-management',
                name: 'reserve-management',
                component: () =>  import ('../pages/Guides/ReserveManagement.vue'),
            },

            {
                path: '/add-guide',
                name: 'add-guide',
                component: () =>  import ('../pages/Guides/AddGuide.vue'),
            },

            {
                path: '/cliente-reserve',
                name: 'cliente-reserve',
                component: () =>  import ('../pages/Guides/ClienteReserve.vue'),
            },

            {
                path: '/next-guides',
                name: 'next-guides',
                component: () =>  import ('../pages/Guides/NextGuides.vue'),
            },

            {
                path: '/concluded-guides',
                name: 'concluded-guides',
                component: () =>  import ('../pages/Guides/ConcludedGuides.vue'),
            },

            {
                path: '/cliente-guide-details',
                name: 'cliente-guide-details',
                component: () =>  import ('../pages/Guides/ClienteGuideDetails.vue'),
            },
        ],
    }
];