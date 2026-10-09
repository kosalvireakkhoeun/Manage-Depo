import { defineStore } from 'pinia'
import type { Session, Subscription, User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/inventory'
import { supabase } from '@/utils/supabase'

interface AuthState {
  initialized: boolean
  loading: boolean
  authError: string | null
  session: Session | null
  user: User | null
  profile: Profile | null
  listener: Subscription | null
}

function normalizeRole(value: string | null | undefined): UserRole {
  return value === 'admin' ? 'admin' : 'staff'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    initialized: false,
    loading: false,
    authError: null,
    session: null,
    user: null,
    profile: null,
    listener: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.user !== null,
    role: (state): UserRole | null => state.profile?.role ?? null,
    isAdmin(): boolean {
      return this.role === 'admin'
    },
  },

  actions: {
    createFallbackProfile(user: User): Profile {
      return {
        id: user.id,
        email: user.email ?? null,
        role: 'staff',
        created_at: new Date().toISOString(),
      }
    },

    async fetchProfile() {
      if (!this.user) {
        this.profile = null
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        this.authError = error.message
      }

      if (data) {
        this.profile = {
          id: data.id,
          email: data.email,
          role: normalizeRole(data.role),
          created_at: data.created_at,
        }
        return
      }

      const fallbackProfile = this.createFallbackProfile(this.user)
      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: fallbackProfile.id,
          email: fallbackProfile.email,
          role: fallbackProfile.role,
        })
        .select('*')
        .single()

      if (upsertError) {
        this.profile = fallbackProfile
        return
      }

      this.profile = {
        id: upsertedProfile.id,
        email: upsertedProfile.email,
        role: normalizeRole(upsertedProfile.role),
        created_at: upsertedProfile.created_at,
      }
    },

    async initialize() {
      if (this.initialized) {
        return
      }

      this.loading = true
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        this.authError = error.message
      }

      this.session = data.session
      this.user = data.session?.user ?? null
      await this.fetchProfile()

      if (!this.listener) {
        const { data: listenerData } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          this.session = nextSession
          this.user = nextSession?.user ?? null
          void this.fetchProfile()
        })

        this.listener = listenerData.subscription
      }

      this.initialized = true
      this.loading = false
    },

    async signIn(email: string, password: string) {
      this.loading = true
      this.authError = null

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      this.loading = false

      if (error) {
        this.authError = error.message
        return error.message
      }

      return null
    },

    async signOut() {
      this.loading = true
      const { error } = await supabase.auth.signOut()
      this.loading = false

      if (error) {
        this.authError = error.message
        return error.message
      }

      this.session = null
      this.user = null
      this.profile = null
      return null
    },

    applyProfileRole(profileId: string, role: UserRole) {
      if (!this.profile || this.profile.id !== profileId) {
        return
      }

      this.profile.role = role
    },
  },
})
