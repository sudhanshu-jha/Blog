import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Login from '../pages/Login'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

function renderLogin() {
  return render(<Login navigate={mockNavigate} />)
}

describe('Login', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockNavigate.mockReset()
  })

  it('renders username and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows loading state while submitting', async () => {
    const user = userEvent.setup()
    let resolve
    mockLogin.mockReturnValue(new Promise(r => { resolve = r }))
    renderLogin()
    await user.type(screen.getByLabelText(/username/i), 'admin')
    await user.type(screen.getByLabelText(/password/i), 'pass')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled()
    resolve({ username: 'admin', is_authenticated: true })
  })

  it('calls login with username and password', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ username: 'admin', is_authenticated: true })
    renderLogin()
    await user.type(screen.getByLabelText(/username/i), 'admin')
    await user.type(screen.getByLabelText(/password/i), 'secret')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    expect(mockLogin).toHaveBeenCalledWith('admin', 'secret')
  })

  it('navigates to list on success', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ username: 'admin', is_authenticated: true })
    renderLogin()
    await user.type(screen.getByLabelText(/username/i), 'admin')
    await user.type(screen.getByLabelText(/password/i), 'secret')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('list'))
  })

  it('shows error message on failed login', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    renderLogin()
    await user.type(screen.getByLabelText(/username/i), 'admin')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() =>
      expect(screen.getByText(/username or password didn't match/i)).toBeInTheDocument()
    )
  })

  it('does not navigate on failed login', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Invalid'))
    renderLogin()
    await user.type(screen.getByLabelText(/username/i), 'x')
    await user.type(screen.getByLabelText(/password/i), 'y')
    await user.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => expect(screen.getByText(/didn't match/i)).toBeInTheDocument())
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
