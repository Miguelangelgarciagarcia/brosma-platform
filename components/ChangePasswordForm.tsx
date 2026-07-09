'use client'

import { useState } from 'react'
import PasswordInput from '@/components/PasswordInput'

const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    color: 'var(--brand-panel-fg2)',
    display: 'block',
    marginBottom: '4px',
}

const passwordInputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'var(--brand-panel-input)',
    border: '1px solid var(--brand-panel-border)',
    borderRadius: '6px',
    padding: '10px 40px 10px 12px',
    color: 'var(--brand-panel-fg)',
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
                maxWidth: '360px',
            }}
        >
            <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--brand-panel-fg)' }}>
                Cambiar contraseña
            </h2>

            <div>
                <label style={labelStyle}>Contraseña actual</label>
                <PasswordInput
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="brand-panel-input"
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
                    className="brand-panel-input"
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
                    className="brand-panel-input"
                    style={passwordInputStyle}
                />
            </div>

            {error && <p style={{ fontFamily: 'var(--font-body)', color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}
            {ok && (
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--brand-orange)', fontSize: '13px', margin: 0 }}>
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
                    borderRadius: '6px',
                    padding: '12px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: loading ? 0.6 : 1,
                }}
            >
                {loading ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
        </form>
    )
}
