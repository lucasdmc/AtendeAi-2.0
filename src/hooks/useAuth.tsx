import { useState, useEffect, createContext, useContext } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Modo de desenvolvimento - simula usuário logado
  const isDevelopment = import.meta.env.DEV
  const mockUser = {
    id: 'dev-user-123',
    email: 'dev@example.com',
    user_metadata: {}
  } as User

  useEffect(() => {
    // Modo de desenvolvimento - sempre simula usuário logado
    console.log('🔧 Setting up mock user for development')
    setTimeout(() => {
      console.log('🔧 Mock user set:', mockUser)
      setUser(mockUser)
      setSession({
        user: mockUser,
        access_token: 'dev-token',
        refresh_token: 'dev-refresh',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      } as any)
      setLoading(false)
      console.log('🔧 Auth loading set to false')
    }, 100)
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}