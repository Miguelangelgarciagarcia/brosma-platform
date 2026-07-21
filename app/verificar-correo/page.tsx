import Link from 'next/link'
import Aurora from '@/components/reactbits/Aurora'
import BlurText from '@/components/reactbits/BlurText'
import StarBorder from '@/components/reactbits/StarBorder'
import { verificarToken } from '@/lib/verification'

// Página pública (sin sesión) a la que llega el link del correo de
// verificación. Misma línea gráfica que /login (hero oscuro + Aurora),
// para que se sienta la misma aplicación aunque el usuario todavía no haya
// iniciado sesión.
export default async function VerificarCorreoPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>
}) {
    const { token } = await searchParams

    const resultado = token ? await verificarToken(token) : { ok: false as const, error: 'invalido_o_expirado' as const }

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
                    position: 'relative',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '28px 20px',
                }}
            >
                <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
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

                    <div style={{ marginTop: '22px' }}>
                        <BlurText
                            text={resultado.ok ? 'CORREO CONFIRMADO' : 'LINK NO VÁLIDO'}
                            animateBy="words"
                            direction="top"
                            delay={80}
                            className="brand-seguimiento-heading"
                        />
                    </div>

                    <div
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.16)',
                            backdropFilter: 'blur(14px)',
                            borderRadius: '12px',
                            padding: '26px',
                            marginTop: '24px',
                            animation: 'brandFadeUp 0.6s ease-out 0.2s both',
                        }}
                    >
                        {resultado.ok ? (
                            <>
                                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--brand-white-65)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    Tu correo quedó confirmado. Ya puedes iniciar sesión con tu cuenta.
                                </p>
                                <div style={{ marginTop: '20px' }}>
                                    <StarBorder as="a" href="/login" color="#ffffff" speed="4s" style={{ width: '100%', display: 'inline-block' }}>
                                        Ir a iniciar sesión
                                    </StarBorder>
                                </div>
                            </>
                        ) : (
                            <>
                                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--brand-white-65)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                                    Este link ya no es válido: puede que haya vencido (dura 48 horas) o que ya se haya usado antes. Pide a tu Administrador que te reenvíe la verificación desde Configuración.
                                </p>
                                <div style={{ marginTop: '20px' }}>
                                    <Link
                                        href="/login"
                                        style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--brand-white-65)', textDecoration: 'none' }}
                                    >
                                        ← Volver a iniciar sesión
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
