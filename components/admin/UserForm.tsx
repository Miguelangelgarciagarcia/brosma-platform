'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 12px',
    color: 'var(--fg1)',
    fontSize: '14px',
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
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}
        >
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Nueva cuenta</h2>

            <div>
                <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                    Nombre
                </label>
                <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            </div>

            <div>
                <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                    Correo
                </label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>

            <div>
                <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                    Contraseña temporal (mínimo 8 caracteres)
                </label>
                <input
                    type="text"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
            </div>

            <div>
                <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                    Rol
                </label>
                <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'trabajador')} style={inputStyle}>
                    <option value="trabajador">Trabajador</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}
            {ok && <p style={{ color: 'var(--accent-hover)', fontSize: '13px', margin: 0 }}>{ok}</p>}

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
                {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
        </form>
    )
}
