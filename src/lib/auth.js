import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "./supabase"
import { isSupabaseConfigured, siteUrl } from "./config"

const AuthCtx = createContext({
  configured: false,
  loading: true,
  session: null,
  user: null,
  profile: null,
  error: null,
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(isSupabaseConfigured))
  const [error, setError] = useState(null)

  const loadProfile = async (user) => {
    if (!supabase || !user) {
      setProfile(null)
      return
    }
    const { data, error: err } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    if (err) setError(err.message)
    setProfile(data || null)
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session || null)
      return loadProfile(data.session && data.session.user).finally(() => alive && setLoading(false))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => {
      setSession(next)
      loadProfile(next && next.user)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const api = useMemo(() => {
    const user = session && session.user
    return {
      configured: isSupabaseConfigured,
      loading,
      session,
      user,
      profile,
      error,
      isAdmin: profile && profile.role === "admin" && profile.account_status === "active",
      isMentor: profile && (profile.role === "mentor" || profile.role === "admin"),
      async refresh() {
        if (user) await loadProfile(user)
      },
      async register({ email, password, fullName }) {
        if (!supabase) return { ok: false, error: "Authentication is not configured." }
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: siteUrl + "/account" },
        })
        if (err) return { ok: false, error: err.message }
        return { ok: true, needsEmail: !data.session }
      },
      async login({ email, password }) {
        if (!supabase) return { ok: false, error: "Authentication is not configured." }
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) return { ok: false, error: err.message }
        return { ok: true }
      },
      async logout() {
        if (supabase) await supabase.auth.signOut()
      },
      async requestReset(email) {
        if (!supabase) return { ok: false, error: "Authentication is not configured." }
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: siteUrl + "/account" })
        if (err) return { ok: false, error: err.message }
        return { ok: true }
      },
      async updatePassword(password) {
        if (!supabase) return { ok: false, error: "Authentication is not configured." }
        const { error: err } = await supabase.auth.updateUser({ password })
        if (err) return { ok: false, error: err.message }
        return { ok: true }
      },
      async updateProfile(patch) {
        if (!supabase || !user) return { ok: false, error: "Sign in required." }
        const safe = {
          full_name: patch.full_name,
          phone: patch.phone,
          bio: patch.bio,
          education: patch.education,
          interests: patch.interests,
          preferred_domains: patch.preferred_domains,
          avatar_url: patch.avatar_url,
        }
        const { error: err } = await supabase.from("profiles").update(safe).eq("id", user.id)
        if (err) return { ok: false, error: err.message }
        await loadProfile(user)
        return { ok: true }
      },
      async uploadAvatar(file) {
        if (!supabase || !user) return { ok: false, error: "Sign in required." }
        if (!file || file.size > 2 * 1024 * 1024) return { ok: false, error: "Image must be under 2 MB." }
        if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) return { ok: false, error: "Use a PNG, JPG or WebP image." }
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "")}`
        const { error: err } = await supabase.storage.from("avatars").upload(path, file, { upsert: false })
        if (err) return { ok: false, error: err.message }
        const { data } = supabase.storage.from("avatars").getPublicUrl(path)
        await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id)
        await loadProfile(user)
        return { ok: true, url: data.publicUrl }
      },
    }
  }, [session, profile, loading, error])

  return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
