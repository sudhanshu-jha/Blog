import { useState } from 'react'
import { AuthProvider } from './AuthContext'
import Navbar from './components/Navbar'
import PostList from './pages/PostList'
import PostDetail from './pages/PostDetail'
import PostForm from './pages/PostForm'
import CommentForm from './pages/CommentForm'
import DeleteConfirm from './pages/DeleteConfirm'
import DraftList from './pages/DraftList'
import Login from './pages/Login'
import About from './pages/About'

function Router() {
  const [route, setRoute] = useState({ page: 'list', id: null })

  const navigate = (pg, id = null) => setRoute({ page: pg, id })

  const page = (() => {
    switch (route.page) {
      case 'list':    return <PostList navigate={navigate} />
      case 'detail':  return <PostDetail postId={route.id} navigate={navigate} key={route.id} />
      case 'new':     return <PostForm navigate={navigate} />
      case 'edit':    return <PostForm postId={route.id} navigate={navigate} />
      case 'delete':  return <DeleteConfirm postId={route.id} navigate={navigate} />
      case 'comment': return <CommentForm postId={route.id} navigate={navigate} />
      case 'drafts':  return <DraftList navigate={navigate} />
      case 'login':   return <Login navigate={navigate} />
      case 'about':   return <About />
      default:        return <PostList navigate={navigate} />
    }
  })()

  return (
    <>
      <Navbar navigate={navigate} />
      {page}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}
