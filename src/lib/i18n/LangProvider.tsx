'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { T, Lang } from './translations'

interface LangContextValue {
  lang: Lang
  t: typeof T.en
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  t: T.en,
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('karaoku_lang') : null) as Lang | null
    if (saved === 'en' || saved === 'bm') setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    if (typeof window !== 'undefined') localStorage.setItem('karaoku_lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, t: T[lang], setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
