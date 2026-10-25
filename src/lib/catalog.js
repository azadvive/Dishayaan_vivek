import React, { createContext, useContext, useEffect, useState } from "react"
import { C } from "../content"
import { isSupabaseConfigured } from "./config"
import { supabase } from "./supabase"
import { mapMentor, mapPlan, mapProgram } from "./mappers"

const CatalogCtx = createContext({
  loading: false,
  source: "content-fallback",
  error: null,
  programmes: C.programmes,
  mentors: C.mentor_seats,
  plans: C.plans,
})

export function CatalogProvider({ children }) {
  const [state, setState] = useState({
    loading: isSupabaseConfigured,
    source: isSupabaseConfigured ? "loading" : "content-fallback",
    error: null,
    programmes: isSupabaseConfigured ? [] : C.programmes,
    mentors: isSupabaseConfigured ? [] : C.mentor_seats,
    plans: isSupabaseConfigured ? [] : C.plans,
  })

  const load = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setState({ loading: false, source: "content-fallback", error: null, programmes: C.programmes, mentors: C.mentor_seats, plans: C.plans })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    const [p, m, pl] = await Promise.all([
      supabase.from("programs").select("*").eq("published", true).order("title"),
      supabase.from("mentors").select("*").eq("published", true).order("role_title"),
      supabase.from("plans").select("*").eq("published", true).order("price_inr"),
    ])
    if (p.error || m.error || pl.error) {
      setState({
        loading: false,
        source: "error",
        error: (p.error || m.error || pl.error).message,
        programmes: [],
        mentors: [],
        plans: [],
      })
      return
    }
    const programmes = (p.data || []).map(mapProgram)
    const mentors = (m.data || []).map(mapMentor)
    const plans = (pl.data || []).map(mapPlan)
    if (!programmes.length && !mentors.length && !plans.length) {
      setState({
        loading: false,
        source: "content-fallback",
        error: null,
        programmes: C.programmes,
        mentors: C.mentor_seats,
        plans: C.plans,
      })
      return
    }
    setState({ loading: false, source: "database", error: null, programmes, mentors, plans })
  }

  useEffect(() => {
    load()
  }, [])

  return <CatalogCtx.Provider value={{ ...state, reload: load }}>{children}</CatalogCtx.Provider>
}

export const useCatalog = () => useContext(CatalogCtx)

export function useProgram(slug) {
  const cat = useCatalog()
  const local = cat.programmes.find((p) => p.slug === slug) || null
  return { ...cat, programme: local }
}

export function useMentor(slug) {
  const cat = useCatalog()
  const local = cat.mentors.find((m) => m.slug === slug) || null
  return { ...cat, mentor: local }
}
