'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'

// Versión mínima para probar el flujo de auth de la Fase 0/1.
// Se rediseñará junto con el resto del panel en fases posteriores.
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
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    width: '100%',
                    maxWidth: '360px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                }}
            >
                <div>
                    <Link href="/" style={{ fontSize: '12px', color: 'var(--fg2)', textDecoration: 'none' }}>
                        ← Volver al inicio
                    </Link>
                </div>

                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
                    Iniciar sesión
                </h1>

                <div>
                    <label style={{ fontSize: '12px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                        Correo
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 12px',
                            color: 'var(--fg1)',
                        }}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '12px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                        Contraseña
                    </label>
                    <PasswordInput
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: loading ? 0.6 : 1,
                    }}
                >
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>

                <Link
                    href="/seguimiento"
                    style={{
                        fontSize: '13px',
                        color: 'var(--fg2)',
                        textDecoration: 'none',
                        textAlign: 'center',
                    }}
                >
                    ¿Eres cliente? Rastrea tu proyecto →
                </Link>
            </form>
        </main>
    )
}
