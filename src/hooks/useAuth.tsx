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
  // Modo de desenvolvimento - sempre retorna usuário mockado
  const mockUser = {
    id: 'dev-user-123',
    email: 'dev@example.com',
    user_metadata: {}
  } as User

  const mockSession = {
    user: mockUser,
    access_token: 'dev-token',
    refresh_token: 'dev-refresh',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer'
  } as any

  const signOut = async () => {
    // Função vazia para desenvolvimento
  }

  return (
    <AuthContext.Provider value={{ 
      user: mockUser, 
      session: mockSession, 
      loading: false, 
      signOut 
    }}>
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