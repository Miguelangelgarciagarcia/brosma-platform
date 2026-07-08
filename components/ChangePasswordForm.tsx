'use client'

import { useState } from 'react'

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

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [ok, setOk] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setOk(false)

        if (newPassword !== confirmPassword) {
            setError('La confirmación no coincide con la nueva contraseña')
            return
        }
        if (newPassword.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/usuarios/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error al cambiar la contraseña')
            setOk(true)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
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
                maxWidth: '360px',
            }}
        >
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Cambiar contraseña</h2>

            <div>
                <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                    Contraseña actual
                </label>
                <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={inputStyle}
                />
            </div>

            <div>
                <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                    Nueva contraseña (mínimo 8 caracteres)
                </label>
                <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={inputStyle}
                />
            </div>

            <div>
                <label style={{ fontSize: '11px', color: 'var(--fg2)', display: 'block', marginBottom: '4px' }}>
                    Confirmar nueva contraseña
                </label>
                <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                />
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}
            {ok && <p style={{ color: 'var(--accent-hover)', fontSize: '13px', margin: 0 }}>Contraseña actualizada correctamente.</p>}

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
                {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
        </form>
    )
}
