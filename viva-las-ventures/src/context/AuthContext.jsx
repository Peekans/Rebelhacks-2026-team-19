import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  auth,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logout as firebaseLogout,
} from '../lib/firebase'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email, password) {
    return loginWithEmail(email, password)
  }

  async function createAccount(email, password) {
    return registerWithEmail(email, password)
  }

  async function signInWithGoogle() {
    return loginWithGoogle()
  }

  async function logout() {
    return firebaseLogout()
  }

  const value = {
    currentUser,
    loading,
    login,
    logout,
    signInWithGoogle,
    createAccount,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
