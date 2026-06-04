'use client'

import { signOut } from 'next-auth/react'

export default function BotaoSair({ className = '', children = 'Sair' }) {
  async function handleSair() {
    await signOut({
      callbackUrl: '/',
    })
  }

  return (
    <button
      type="button"
      onClick={handleSair}
      className={className}
    >
      {children}
    </button>
  )
}