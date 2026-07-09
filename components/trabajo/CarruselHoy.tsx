'use client'

import { useEffect, useRef } from 'react'
import FaseCard from '@/components/trabajo/FaseCard'

type FaseConFlags = {
    id: string
    title: string
    description: string | null
    status: string
    startDate: Date | string | null
    endDate: Date | string | null
    project: { folio: string; title: string; clientName: string }
    parent: { title: string } | null
    trabajando: boolean
    retrasado: boolean
}

// Carrusel que se mueve solo, muy suave, tipo "ida y vuelta": avanza hasta
// el final, se regresa al inicio, y así. Se detiene mientras el mouse/dedo
// está encima para poder darle clic a los botones de las cards sin pelear
// con el scroll.
export default function CarruselHoy({ fases }: { fases: FaseConFlags[] }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const pausadoRef = useRef(false)
    const direccionRef = useRef(1)

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        if (el.scrollWidth <= el.clientWidth) return // no alcanza para animar

        let frame: number
        const VELOCIDAD = 0.4 // px por frame (~24px/seg a 60fps): bien suave

        function tick() {
            if (!el) return
            if (!pausadoRef.current) {
                const maxScroll = el.scrollWidth - el.clientWidth
                let next = el.scrollLeft + VELOCIDAD * direccionRef.current

                if (next >= maxScroll) {
                    next = maxScroll
                    direccionRef.current = -1
                } else if (next <= 0) {
                    next = 0
                    direccionRef.current = 1
                }
                el.scrollLeft = next
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [fases.length])

    function pausar() {
        pausadoRef.current = true
    }
    function reanudar() {
        pausadoRef.current = false
    }

    return (
        <div
            ref={scrollRef}
            onMouseEnter={pausar}
            onMouseLeave={reanudar}
            onTouchStart={pausar}
            onTouchEnd={reanudar}
            style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollBehavior: 'auto',
            }}
        >
            {fases.map((fase) => (
                <div key={fase.id} style={{ flex: '0 0 260px' }}>
                    <FaseCard fase={fase} destacado trabajando={fase.trabajando} retrasado={fase.retrasado} />
                </div>
            ))}
        </div>
    )
}
