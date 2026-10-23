import { useEffect, useState } from 'react'

export type Device = 'mobile' | 'desktop'

const QUERY = '(max-width: 767px)'

/** Pemilih variant desktop / mobile (keputusan K1). */
export function useDevice(): Device {
  const [device, setDevice] = useState<Device>(() =>
    typeof window !== 'undefined' && window.matchMedia(QUERY).matches ? 'mobile' : 'desktop',
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => setDevice(mq.matches ? 'mobile' : 'desktop')
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return device
}

export function useIsMobile(): boolean {
  return useDevice() === 'mobile'
}
