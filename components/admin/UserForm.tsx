'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '10px',
    padding: '10px 12px',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
}

const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--admin-text-secondary)',
    display: 'block',
    marginBottom: '4px',
}

export default function UserForm() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<'admin' | 'trabajador'>('trabajador')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [ok, setOk] = useState('')

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setOk('')
        setLoading(true)
        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al crear el usuario')
            setOk(`Cuenta creada: ${json.email}. Comparte la contraseña temporal con la persona y pídele que la cambie en "Mi cuenta".`)
            setName('')
            setEmail('')
            setPassword('')
            setRole('trabajador')
            setShowPassword(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form
            onSubmit={onSubmit}
            className="admin-subpanel"
            style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}
        >
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--admin-text-primary)' }}>
                Nueva cuenta
            </h3>

            <div>
                <label style={labelStyle}>Nombre</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="admin-input" style={inputStyle} />
            </div>

            <div>
                <label style={labelStyle}>Correo</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="admin-input"
                    style={inputStyle}
                />
            </div>

            <div>
                <label style={labelStyle}>Contraseña temporal (mínimo 8 caracteres)</label>
                <div style={{ position: 'relative' }}>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="admin-input"
                        style={{ ...inputStyle, fontFamily: 'monospace', paddingRight: '38px' }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="admin-password-toggle"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                        {showPassword ? (
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div>
                <label style={labelStyle}>Rol</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'trabajador')}
                    className="admin-input"
                    style={inputStyle}
                >
                    <option value="trabajador">Trabajador</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {error && (
                <p
                    style={{
                        fontFamily: 'var(--font-body)',
                        color: 'var(--admin-icon-red-fg)',
                        background: 'var(--admin-icon-red-bg)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '12.5px',
                        margin: 0,
                    }}
                >
                    {error}
                </p>
            )}
            {ok && (
                <p
                    style={{
                        fontFamily: 'var(--font-body)',
                        color: 'var(--admin-success-fg)',
                        background: 'var(--admin-success-bg)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '12.5px',
                        margin: 0,
                    }}
                >
                    {ok}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                style={{
                    background: 'var(--brand-orange)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    opacity: loading ? 0.6 : 1,
                }}
            >
                {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
        </form>
    )
}
