'use client'

import { useState } from 'react'
import PasswordInput from '@/components/PasswordInput'

const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--admin-text-secondary)',
    display: 'block',
    marginBottom: '4px',
}

const passwordInputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: '#ffffff',
    border: '1px solid var(--admin-card-border)',
    borderRadius: '10px',
    padding: '10px 40px 10px 12px',
    color: 'var(--admin-text-primary)',
    fontFamily: 'var(--font-body)',
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
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
                <label style={labelStyle}>Contraseña actual</label>
                <PasswordInput
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="admin-input"
                    style={passwordInputStyle}
                />
            </div>

            <div>
                <label style={labelStyle}>Nueva contraseña (mínimo 8 caracteres)</label>
                <PasswordInput
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="admin-input"
                    style={passwordInputStyle}
                />
            </div>

            <div>
                <label style={labelStyle}>Confirmar nueva contraseña</label>
                <PasswordInput
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="admin-input"
                    style={passwordInputStyle}
                />
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
                    Contraseña actualizada correctamente.
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
                {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
        </form>
    )
}
