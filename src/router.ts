import { createRouter, createWebHistory } from 'vue-router'
import Layout from './Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./pages/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('./pages/Register.vue')
  },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        redirect: '/home'
      },
      {
        path: '/home',
        name: 'Home',
        component: () => import('./pages/Home.vue')
      },
      {
        path: '/category',
        name: 'Category',
        component: () => import('./pages/Category.vue')
      },
      {
        path: '/cart',
        name: 'Cart',
        component: () => import('./pages/Cart.vue')
      },
      {
        path: '/publish',
        name: 'Publish',
        component: () => import('./pages/Publish.vue')
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('./pages/Profile.vue')
      },
      {
        path: '/contacts',
        name: 'Contacts',
        component: () => import('./pages/Contacts.vue')
      },
      {
        path: '/note',
        name: 'Note',
        component: () => import('./pages/Note.vue')
      },
      {
        path: '/search',
        name: 'Search',
        component: () => import('./pages/Search.vue')
      },
      {
        path: '/note-square',
        name: 'NoteSquare',
        component: () => import('./pages/NoteSquare.vue')
      },
      {
        path: '/checkin',
        name: 'CheckIn',
        component: () => import('./pages/CheckIn.vue')
      },
      // 分类功能页面
      {
        path: '/all-notes',
        name: 'AllNotes',
        component: () => import('./pages/AllNotes.vue')
      },
      {
        path: '/recent-notes',
        name: 'RecentNotes',
        component: () => import('./pages/RecentNotes.vue')
      },
      {
        path: '/favorites',
        name: 'Favorites',
        component: () => import('./pages/Favorites.vue')
      },
      {
        path: '/blacklist',
        name: 'Blacklist',
        component: () => import('./pages/Blacklist.vue')
      },

    ]
  },
  // 详情页面路由（不在Layout中，不显示tabbar）
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: () => import('./pages/PostDetail.vue')
  },
  {
    path: '/note/:id',
    name: 'NoteDetail',
    component: () => import('./pages/NoteDetail.vue')
  },
  {
    path: '/contact/:id',
    name: 'ContactDetail',
    component: () => import('./pages/ContactDetail.vue')
  },
  // 消息相关页面（不显示tabbar）
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('./pages/Messages.vue')
  },
  {
    path: '/chat/:userId',
    name: 'ChatDetail',
    component: () => import('./pages/ChatDetail.vue')
  },
  // 用户相关页面（不显示tabbar）
  {
    path: '/user/:id',
    name: 'UserDetail',
    component: () => import('./pages/UserDetail.vue')
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: () => import('./pages/EditProfile.vue')
  },
  {
    path: '/follow',
    name: 'Follow',
    component: () => import('./pages/Follow.vue')
  },
  // 聊天列表页面（不显示tabbar）
  {
    path: '/chats',
    name: 'ChatList',
    component: () => import('./pages/ChatList.vue')
  },
  // 浏览历史页面（不显示tabbar）
  {
    path: '/view-history',
    name: 'ViewHistory',
    component: () => import('./pages/ViewHistory.vue')
  },
  // 设置页面（不显示tabbar）
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('./pages/Settings.vue')
  },
  // 帮助中心页面（不显示tabbar）
  {
    path: '/help-center',
    name: 'HelpCenter',
    component: () => import('./pages/HelpCenter.vue')
  },
  // 意见反馈页面（不显示tabbar）
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('./pages/Feedback.vue')
  },
  // 404页面 - 必须放在最后
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./pages/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router