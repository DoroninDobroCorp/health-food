import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getVitaminRecommendations } from '../../store/slices/appSlice';

const VitaminsCard = () => {
    const dispatch = useAppDispatch();
    const [isChatVisible, setChatVisible] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const { history, isLoading } = useAppSelector(state => state.app.vitaminChat);
    const biomarkers = useAppSelector(state => state.app.biomarkers);
    // const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (history.length === 0) {
            const initialMessage = "Привет! Можешь дать мне рекомендации по добавкам на основе моих анализов?";
            dispatch(getVitaminRecommendations(initialMessage));
        }
    }, [history.length, dispatch]);

    const handleGetRecommendations = () => {
        if (Object.keys(biomarkers).length === 0) {
            alert('Пожалуйста, заполните хотя бы одно поле в разделе "Ваши анализы", чтобы получить рекомендации.');
            return;
        }
        setChatVisible(true);
        if (history.length === 0) {
            const initialMessage = "Привет! Можешь дать мне рекомендации по добавкам на основе моих анализов?";
            dispatch(getVitaminRecommendations(initialMessage));
        }
    };

    const handleSendMessage = () => {
        if (!chatInput.trim()) return;
        dispatch(getVitaminRecommendations(chatInput));
        setChatInput('');
    };

    return (
        <div className="step-card">
            <div className="vitamins-card" id="vitaminBox">
                {!isChatVisible ? (
                    <div id="vitaminList">
                        <div className="ai-rec-starter">
                            <div className="ai-rec-icon">✨</div>
                            <h3>Рекомендации по добавкам от AI</h3>
                            <p>Получите персональные советы по витаминам и минералам на основе ваших анализов.</p>
                            <button id="get-ai-recommendations-btn" className="btn-primary" onClick={handleGetRecommendations}>
                                Получить рекомендации
                            </button>
                        </div>
                    </div>
                ) : (
                    <div id="ai-recommendations-chat">
                        <div className="vitamins-header">
                            <h3>Диалог с AI-диетологом</h3>
                        </div>
                        <div id="ai-recommendations-messages" className="chat-messages">
                            {history.map((msg, index) => (
                                <div key={index} className={`chat-message ${msg.role}`}>
                                    <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>') }}></div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="chat-message assistant">
                                    <div className="chat-bubble">
                                        <div className="loader"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="chat-footer" id="rec-chat-footer">
                            <div className="chat-input-container">
                                <textarea
                                    id="rec-chat-input"
                                    placeholder="Уточните что-нибудь..."
                                    rows={1}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                ></textarea>
                                <button id="rec-chat-send-btn" className="btn-primary" onClick={handleSendMessage}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <span className="disclaimer">Не является мед. рекомендацией</span>
        </div>
    );
};

export default VitaminsCard; 