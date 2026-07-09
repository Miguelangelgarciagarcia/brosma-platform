import Link from 'next/link'
import Aurora from '@/components/reactbits/Aurora'
import BlurText from '@/components/reactbits/BlurText'
import StarBorder from '@/components/reactbits/StarBorder'

// Home "gateway": solo dos opciones, sin landing de marketing (esa vive en
// Wix). Hero oscuro con capa de color sobre el fondo — ahora con Aurora (de
// React Bits) como fondo animado en vez del glow estático, y BlurText para
// que el encabezado entre con más impacto. Todo queda en capas separadas
// (fondo animado / patrón / contenido), pensado para poder cambiar el fondo
// por una foto o video real del taller más adelante sin tocar el resto.
export default function Home() {
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
                <Aurora colorStops={['#02273a', '#f47b30', '#02273a']} amplitude={1.1} blend={0.6} speed={0.7} />
            </div>

            {/* Patrón tipo plano industrial, muy sutil, para textura por encima del Aurora */}
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

            <header
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '24px 32px',
                    animation: 'brandFadeUp 0.7s ease-out both',
                }}
            >
                <div
                    style={{
                        width: '12px',
                        height: '12px',
                        background: 'var(--brand-orange)',
                        transform: 'rotate(45deg)',
                        flexShrink: 0,
                    }}
                />
                <div
                    style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '18px',
                        letterSpacing: '0.14em',
                        color: '#ffffff',
                    }}
                >
                    GRUPO BROSMA
                </div>
            </header>

            <div
                style={{
                    position: 'relative',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '40px',
                    padding: '48px 24px',
                    textAlign: 'center',
                }}
            >
                <div style={{ maxWidth: '640px' }}>
                    <div
                        style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.24em',
                            textTransform: 'uppercase',
                            color: 'var(--brand-orange)',
                            marginBottom: '18px',
                            animation: 'brandFadeUp 0.7s ease-out 0.1s both',
                        }}
                    >
                        Plataforma interna
                    </div>
                    <BlurText
                        text="GESTIÓN Y SEGUIMIENTO DE PROYECTOS"
                        animateBy="words"
                        direction="top"
                        delay={80}
                        className="brand-hero-heading"
                    />
                    <p
                        style={{
                            fontFamily: 'var(--font-body)',
                            color: 'var(--brand-white-65)',
                            fontSize: '16px',
                            marginTop: '18px',
                            lineHeight: 1.6,
                            animation: 'brandFadeUp 0.7s ease-out 0.3s both',
                        }}
                    >
                        Control interno de taller y seguimiento de pedidos para Grupo Brosma.
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '18px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        animation: 'brandFadeUp 0.7s ease-out 0.4s both',
                    }}
                >
                    <Link href="/seguimiento" style={{ textDecoration: 'none' }}>
                        <StarBorder as="span" color="#ffffff" speed="4s">
                            Rastrear proyecto
                        </StarBorder>
                    </Link>
                    <Link
                        href="/login"
                        className="brand-btn-outline"
                        style={{
                            fontFamily: 'var(--font-body)',
                            background: 'transparent',
                            border: '2px solid var(--brand-white-12)',
                            color: '#ffffff',
                            padding: '14px 36px',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: '14px',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        Iniciar sesión
                    </Link>
                </div>
            </div>

            <div
                style={{
                    position: 'relative',
                    padding: '18px 24px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                    color: 'var(--brand-white-65)',
                    borderTop: '1px solid var(--brand-white-12)',
                }}
            >
                GRUPO BROSMA
            </div>
        </main>
    )
}
