import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import RatingForm from '../components/chat/RatingForm'
import Logo from '../components/common/Logo'
import './PublicRatingPage.css'

export default function PublicRatingPage() {
    const { conversationId } = useParams<{ conversationId: string }>()
    const [searchParams] = useSearchParams()
    const instanceId = searchParams.get('instance') || 'default'
    const [isSubmitted, setIsSubmitted] = useState(false)

    useEffect(() => {
        // Track page view
        console.log('Rating page viewed:', conversationId)
    }, [conversationId])

    return (
        <div className="public-rating-page">
            <div className="rating-container">
                <div className="brand-header">
                    <div className="brand-logo">
                        <Logo size={48} className="mr-3" animated={false} />
                        <h1>Nyvlo Omnichannel</h1>
                    </div>
                    <p className="brand-tagline">Plataforma Inteligente de Atendimento Omnichannel</p>
                </div>

                {!isSubmitted ? (
                    <RatingForm
                        conversationId={conversationId!}
                        instanceId={instanceId}
                        onSubmitted={() => setIsSubmitted(true)}
                    />
                ) : (
                    <div className="thank-you-message">
                        <div className="success-icon">✅</div>
                        <h2>Avaliação Enviada!</h2>
                        <p>Obrigado por dedicar seu tempo para nos avaliar.</p>
                        <p className="secondary-text">
                            Sua opinião é fundamental para continuarmos melhorando nossos serviços.
                        </p>
                    </div>
                )}

                <footer className="rating-footer">
                    <p>&copy; 2024 Nyvlo Omnichannel. Todos os direitos reservados.</p>
                </footer>
            </div>
        </div>
    )
}
