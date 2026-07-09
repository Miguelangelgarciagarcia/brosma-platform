'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'
import Aurora from '@/components/reactbits/Aurora'
import BlurText from '@/components/reactbits/BlurText'
import StarBorder from '@/components/reactbits/StarBorder'

const glassInputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: '4px',
    padding: '14px 16px',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s ease, background 0.15s ease',
}

// Acceso interno (Admin / Trabajador). Misma línea gráfica que el inicio y
// seguimiento: hero oscuro con Aurora de fondo, BlurText en el encabezado y
// los mismos inputs "glass"/botón StarBorder, para que se sienta la misma
// aplicación en todas las pantallas públicas.
export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        })

        if (res?.error) {
            setError('Correo o contraseña incorrectos.')
            setLoading(false)
            return
        }

        // Redirige según el rol de la sesión recién creada
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        const role = session?.user?.role

        router.push(role === 'admin' ? '/admin' : '/trabajo')
        router.refresh()
    }

    return (
        <main
            style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'var(--brand-navy-deep)',
            }}
        >
            <div style={{ position: 'absolute', inset: 0 }}>
                <Aurora colorStops={['#02273a', '#f47b30', '#02273a']} amplitude={0.9} blend={0.55} speed={0.6} />
            </div>

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                        repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 56px),
                        repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 56px)
                    `,
                    pointerEvents: 'none',
                }}
            />

            <div
                style={{
                    position: 'relative',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '28px 20px',
                }}
            >
                <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
                    <Link
                        href="/"
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            letterSpacing: '0.1em',
                            color: 'var(--brand-white-65)',
                            textDecoration: 'none',
                        }}
                    >
                        ← GRUPO BROSMA
                    </Link>

                    <div
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.24em',
                            textTransform: 'uppercase',
                            color: 'var(--brand-orange)',
                            marginTop: '22px',
                            animation: 'brandFadeUp 0.6s ease-out 0.05s both',
                        }}
                    >
                        Acceso interno
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <BlurText
                            text="INICIAR SESIÓN"
                            animateBy="words"
                            direction="top"
                            delay={80}
                            className="brand-seguimiento-heading"
                        />
                    </div>
                    <p
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: 'var(--brand-white-65)',
                            fontSize: '14px',
                            marginTop: '10px',
                            lineHeight: 1.5,
                            animation: 'brandFadeUp 0.6s ease-out 0.15s both',
                        }}
                    >
                        Ingresa tus datos para entrar al panel de Admin o Trabajador.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.16)',
                            backdropFilter: 'blur(14px)',
                            borderRadius: '12px',
                            padding: '22px',
                            marginTop: '28px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            textAlign: 'left',
                            animation: 'brandFadeUp 0.6s ease-out 0.2s both',
                        }}
                    >
                        <div>
                            <label style={{ fontSize: '11px', color: 'var(--brand-white-65)', display: 'block', marginBottom: '6px', letterSpacing: '0.03em' }}>
                                CORREO
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="brand-glass-input"
                                style={glassInputStyle}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '11px', color: 'var(--brand-white-65)', display: 'block', marginBottom: '6px', letterSpacing: '0.03em' }}>
                                CONTRASEÑA
                            </label>
                            <PasswordInput
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="brand-glass-input"
                                style={{ ...glassInputStyle, padding: '14px 40px 14px 16px' }}
                            />
                        </div>

                        {error && <p style={{ color: '#ffb4a3', fontSize: '13px', margin: 0 }}>{error}</p>}

                        <StarBorder
                            as="button"
                            type="submit"
                            disabled={loading}
                            color="#ffffff"
                            speed="4s"
                            style={{ width: '100%', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </StarBorder>

                        <Link
                            href="/seguimiento"
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px',
                                color: 'var(--brand-white-65)',
                                textDecoration: 'none',
                                textAlign: 'center',
                            }}
                        >
                            ¿Eres cliente? Rastrea tu proyecto →
                        </Link>
                    </form>
                </div>
            </div>
        </main>
    )
}
