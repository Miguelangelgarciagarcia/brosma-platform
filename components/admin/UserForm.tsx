'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--brand-panel-input)',
    border: '1px solid var(--brand-panel-border)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: 'var(--brand-panel-fg)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
}

const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    color: 'var(--brand-panel-fg2)',
    display: 'block',
    marginBottom: '4px',
}

export default function UserForm() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<'admin' | 'trabajador'>('trabajador')
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
            style={{
                background: 'var(--brand-panel-card)',
                border: '1px solid var(--brand-panel-border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}
        >
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg)' }}>
                Nueva cuenta
            </h2>

            <div>
                <label style={labelStyle}>Nombre</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="brand-panel-input" style={inputStyle} />
            </div>

            <div>
                <label style={labelStyle}>Correo</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="brand-panel-input"
                    style={inputStyle}
                />
            </div>

            <div>
                <label style={labelStyle}>Contraseña temporal (mínimo 8 caracteres)</label>
                <input
                    type="text"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="brand-panel-input"
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
            </div>

            <div>
                <label style={labelStyle}>Rol</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'trabajador')}
                    className="brand-panel-input"
                    style={inputStyle}
                >
                    <option value="trabajador">Trabajador</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {error && <p style={{ fontFamily: 'var(--font-body)', color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}
            {ok && <p style={{ fontFamily: 'var(--font-body)', color: 'var(--brand-orange)', fontSize: '13px', margin: 0 }}>{ok}</p>}

            <button
                type="submit"
                disabled={loading}
                style={{
                    background: 'var(--brand-orange)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: loading ? 0.6 : 1,
                }}
            >
                {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
        </form>
    )
}
