import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Profile } from '@shared/types/api.types'
import { toast } from '@/components/ui/Toast'

export function useAuth() {
  const { session, profile, loading, setSession, setProfile, setLoading, clear } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
      } else {
        clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (error) throw error
      setProfile(data as Profile)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  return { session, profile, loading }
}

export function useLogin() {
  const navigate = useNavigate()

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast('error', error.message)
      throw error
    }
    navigate('/')
  }

  return { login }
}

export function useRegister() {
  const navigate = useNavigate()

  async function register(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) {
      toast('error', error.message)
      throw error
    }
    toast('success', 'Conta criada! Verifique seu email.')
    navigate('/')
  }

  return { register }
}
