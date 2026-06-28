import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PostList from '../pages/PostList'

const mockNavigate = vi.fn()

vi.mock('../api', () => ({
  api: { get: vi.fn() },
}))

vi.mock('../AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { api } from '../api'
import { useAuth } from '../AuthContext'

const POSTS = [
  { id: 1, title: 'First Post', published_date: '2024-01-01T00:00:00Z', comment_count: 2 },
  { id: 2, title: 'Second Post', published_date: '2024-02-01T00:00:00Z', comment_count: 0 },
]

describe('PostList', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    useAuth.mockReturnValue({ user: null })
  })

  it('shows loading initially', () => {
    api.get.mockReturnValue(new Promise(() => {}))
    render(<PostList navigate={mockNavigate} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders post titles after loading', async () => {
    api.get.mockResolvedValue(POSTS)
    render(<PostList navigate={mockNavigate} />)
    await waitFor(() => expect(screen.getByText('First Post')).toBeInTheDocument())
    expect(screen.getByText('Second Post')).toBeInTheDocument()
  })

  it('shows correct comment count', async () => {
    api.get.mockResolvedValue(POSTS)
    render(<PostList navigate={mockNavigate} />)
    await waitFor(() => expect(screen.getByText('First Post')).toBeInTheDocument())
    expect(screen.getByText(/2 comments/i)).toBeInTheDocument()
    expect(screen.getByText(/0 comments/i)).toBeInTheDocument()
  })

  it('shows singular "comment" for count of 1', async () => {
    api.get.mockResolvedValue([
      { id: 3, title: 'Solo', published_date: '2024-01-01T00:00:00Z', comment_count: 1 },
    ])
    render(<PostList navigate={mockNavigate} />)
    await waitFor(() => expect(screen.getByText(/1 comment$/i)).toBeInTheDocument())
  })

  it('navigates to detail on title click', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue(POSTS)
    render(<PostList navigate={mockNavigate} />)
    await waitFor(() => screen.getByText('First Post'))
    await user.click(screen.getByText('First Post'))
    expect(mockNavigate).toHaveBeenCalledWith('detail', 1)
  })

  it('shows empty state with no posts for guest', async () => {
    api.get.mockResolvedValue([])
    render(<PostList navigate={mockNavigate} />)
    await waitFor(() => expect(screen.getByText(/no posts yet/i)).toBeInTheDocument())
    expect(screen.getByText(/check back soon/i)).toBeInTheDocument()
  })

  it('shows new post button for authenticated user when empty', async () => {
    useAuth.mockReturnValue({ user: { username: 'admin' } })
    api.get.mockResolvedValue([])
    render(<PostList navigate={mockNavigate} />)
    await waitFor(() => expect(screen.getByText(/new post/i)).toBeInTheDocument())
  })

  it('does not show new post button for guest when empty', async () => {
    useAuth.mockReturnValue({ user: null })
    api.get.mockResolvedValue([])
    render(<PostList navigate={mockNavigate} />)
    await waitFor(() => expect(screen.getByText(/no posts yet/i)).toBeInTheDocument())
    expect(screen.queryByText(/new post/i)).not.toBeInTheDocument()
  })
})
