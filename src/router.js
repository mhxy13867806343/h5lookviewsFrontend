import { createRouter, createWebHistory } from 'vue-router'
import Layout from './Layout.vue'
import Home from './pages/Home.vue'
import Category from './pages/Category.vue'
import Cart from './pages/Cart.vue'
import Publish from './pages/Publish.vue'
import Profile from './pages/Profile.vue'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Note from './pages/Note.vue'
import Search from './pages/Search.vue'
import NoteSquare from './pages/NoteSquare.vue'
import CheckIn from './pages/CheckIn.vue'
import UserDetail from './pages/UserDetail.vue'
import ChatList from './pages/ChatList.vue'
import AllNotes from './pages/AllNotes.vue'
import RecentNotes from './pages/RecentNotes.vue'
import Favorites from './pages/Favorites.vue'
import Blacklist from './pages/Blacklist.vue'
import EditProfile from './pages/EditProfile.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
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
        component: Home
      },
      {
        path: '/category',
        name: 'Category',
        component: Category
      },
      {
        path: '/cart',
        name: 'Cart',
        component: Cart
      },
      {
        path: '/publish',
        name: 'Publish',
        component: Publish
      },
      {
        path: '/profile',
        name: 'Profile',
        component: Profile
      },
      {
        path: '/note',
        name: 'Note',
        component: Note
      },
      {
        path: '/search',
        name: 'Search',
        component: Search
      },
      {
        path: '/note-square',
        name: 'NoteSquare',
        component: NoteSquare
      },
      {
        path: '/checkin',
        name: 'CheckIn',
        component: CheckIn
      },
      {
        path: '/user/:id',
        name: 'UserDetail',
        component: UserDetail
      },
      {
        path: '/chats',
        name: 'ChatList',
        component: ChatList
      },
      {
        path: '/chat/:userId',
        name: 'Chat',
        component: () => import('./pages/Chat.vue')
      },
      // 分类功能页面
      {
        path: '/all-notes',
        name: 'AllNotes',
        component: AllNotes
      },
      {
        path: '/recent-notes',
        name: 'RecentNotes',
        component: RecentNotes
      },
      {
        path: '/favorites',
        name: 'Favorites',
        component: Favorites
      },
      {
        path: '/blacklist',
        name: 'Blacklist',
        component: Blacklist
      },
      {
        path: '/edit-profile',
        name: 'EditProfile',
        component: EditProfile
      }
    ]
  },
  // 详情页面路由（不在Layout中）
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: () => import('./pages/PostDetail.vue')
  },
  {
    path: '/note/:id',
    name: 'NoteDetail',
    component: () => import('./pages/NoteDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router