import React, { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
}

// Simple page container that applies a mount animation (fade + translate)
export default function PageContainer({ children }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 30)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className={`${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'} transition-all duration-300 ease-out`}> 
      {children}
    </div>
  )
}
