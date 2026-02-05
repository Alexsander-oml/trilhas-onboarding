import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'

type TabId = 'users' | 'permissions' | 'bulk' | 'assignments' | 'exceptions' | 'audit'

interface Props {
  activeTab: TabId
  setActiveTab: (t: TabId) => void
}

const Icon = ({ name }: { name: string }) => {
  // Minimal inline SVGs for a crisp, modern look (kept small on purpose)
  switch (name) {
    case 'users':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'lock':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    case 'chart':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M18 13l-5-5-4 4-3-3" />
        </svg>
      )
    case 'target':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
    case 'warn':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94A2 2 0 0 0 22.18 18L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      )
    case 'file':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      )
    case 'graph':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 14l3-3 4 4 5-7" />
        </svg>
      )
    case 'cog':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 4.3 16.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.21 4.3A2 2 0 0 1 7.04 1.47l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V1a2 2 0 0 1 4 0v.09c.12.6.6 1.09 1.2 1.2h.09a1.65 1.65 0 0 0 1.51 1 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 19.7 7.1l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c.07.5.34.95.75 1.26z" />
        </svg>
      )
    default:
      return null
  }
}

const AdminTabs: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const { isDark } = useTheme();
  const tabs: { id: TabId; icon: string; label: string; desc: string }[] = [
    { id: 'users', icon: 'users', label: 'Usuários', desc: 'Gestão de usuários' },
    { id: 'permissions', icon: 'lock', label: 'Perfis', desc: 'Papéis e permissões' },
    { id: 'bulk', icon: 'chart', label: 'Matrícula em Massa', desc: 'Importação de usuários' },
    { id: 'assignments', icon: 'target', label: 'Atribuições', desc: 'Regras automáticas' },
    { id: 'exceptions', icon: 'warn', label: 'Exceções', desc: 'Dispensas e exceções' },
    { id: 'audit', icon: 'file', label: 'Auditoria', desc: 'Logs do sistema' },
  ]
  const containerRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const tabsRef = useRef<Record<TabId, HTMLButtonElement | null>>({} as Record<TabId, HTMLButtonElement | null>)
  const indicatorRef = useRef<HTMLDivElement | null>(null)
  const [showArrows, setShowArrows] = useState(false)
  const currentTranslate = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track) return
    const check = () => setShowArrows(track.scrollWidth > container.clientWidth + 4)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(container)
    ro.observe(track)
    window.addEventListener('resize', check)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', check)
    }
  }, [])

  const updateIndicator = useCallback(() => {
    const btn = tabsRef.current[activeTab]
    const container = containerRef.current
    const track = trackRef.current
    const indicator = indicatorRef.current
    if (!btn || !container || !indicator || !track) return

    const containerWidth = container.clientWidth
    const trackWidth = track.scrollWidth
    const btnLeft = btn.offsetLeft
    const btnWidth = btn.offsetWidth

    const maxTranslate = Math.max(0, trackWidth - containerWidth)
    const desiredCenter = btnLeft + btnWidth / 2 - containerWidth / 2
    const translate = Math.min(maxTranslate, Math.max(0, desiredCenter))
    currentTranslate.current = translate

    // move track (carousel) and indicator relative to container
    track.style.transform = `translateX(-${translate}px)`
    indicator.style.width = `${btnWidth}px`
    indicator.style.transform = `translateX(${btnLeft - translate}px)`
  }, [activeTab])

  useEffect(() => {
    updateIndicator()
  }, [activeTab, updateIndicator])

  useEffect(() => {
    const onResize = () => updateIndicator()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [updateIndicator])

  const tabIds = tabs.map(t => t.id)
  const focusNext = (dir: 1 | -1) => {
    const idx = tabIds.indexOf(activeTab)
    const next = Math.min(tabIds.length - 1, Math.max(0, idx + dir))
    setActiveTab(tabIds[next])
    const btn = tabsRef.current[tabIds[next]]
    btn?.focus()
  }

  const shiftTrackBy = (delta: number) => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track) return
    const containerWidth = container.clientWidth
    const trackWidth = track.scrollWidth
    const maxTranslate = Math.max(0, trackWidth - containerWidth)
    let next = currentTranslate.current + delta
    next = Math.min(maxTranslate, Math.max(0, next))
    currentTranslate.current = next
    track.style.transition = 'transform 350ms cubic-bezier(.2,.8,.2,1)'
    track.style.transform = `translateX(-${next}px)`

    // reposition indicator for active tab
    const btn = tabsRef.current[activeTab]
    const indicator = indicatorRef.current
    if (btn && indicator) {
      const btnLeft = btn.offsetLeft
      indicator.style.width = `${btn.offsetWidth}px`
      indicator.style.transform = `translateX(${btnLeft - next}px)`
    }
    // remove transition after animation to keep immediate updates smooth later
    window.setTimeout(() => { if (track) track.style.transition = '' }, 360)
  }

  return (
    <nav aria-label="Admin navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`rounded-lg shadow-sm p-3 my-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="relative flex items-center">
            {showArrows && (
              <button
                aria-label="Anterior"
                onClick={() => shiftTrackBy(-240)}
                className={`mr-2 p-1 rounded ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            <div
              ref={containerRef}
              role="tablist"
              className="relative py-2 w-full overflow-hidden"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') { e.preventDefault(); focusNext(1) }
                if (e.key === 'ArrowLeft') { e.preventDefault(); focusNext(-1) }
              }}
            >
              <div ref={indicatorRef} className="absolute bottom-2 h-1 bg-blue-600 rounded transition-transform duration-300 will-change-transform" style={{ left: 0 }} />

              <div ref={trackRef} className="flex items-center gap-3 will-change-transform transition-transform" style={{ transform: 'translateX(0)' }}>
                {tabs.map((tab) => {
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => { tabsRef.current[tab.id] = el }}
                      onClick={() => setActiveTab(tab.id)}
                      role="tab"
                      aria-selected={active}
                      className={`relative z-10 flex items-center gap-3 px-4 py-2 rounded-lg min-w-max transition-colors focus:outline-none focus-visible:ring-2 ${
                        active 
                          ? 'text-white bg-blue-600 shadow' 
                          : isDark ? 'text-gray-400 hover:bg-gray-700 focus-visible:ring-blue-600' : 'text-gray-600 hover:bg-gray-50 focus-visible:ring-blue-200'
                      }`}
                    >
                      <span className="w-6 h-6 flex items-center justify-center">
                        <Icon name={tab.icon} />
                      </span>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium leading-tight">{tab.label}</span>
                        <span className={`text-xs hidden sm:block ${active ? 'text-white/80' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>{tab.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {showArrows && (
              <button
                aria-label="Próximo"
                onClick={() => shiftTrackBy(240)}
                className={`ml-2 p-1 rounded ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AdminTabs
