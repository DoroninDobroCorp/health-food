
import { Sparkles } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setAIPhotoModalOpen, startGenerationWithLastProducts } from "../../store/slices/appSlice";

export const AICard = () => {
    const dispatch = useAppDispatch();
    const lastProducts = useAppSelector(state => state.app.lastDetectedProducts);
    
    const handleOpenModal = () => {
        dispatch(setAIPhotoModalOpen(true));
    };

    const handleFromLastProducts = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (lastProducts.length > 0) {
            dispatch(startGenerationWithLastProducts());
        }
    }

    return (
        <div className="result-card ai-card" onClick={handleOpenModal}>
            <div className="ai-card-inner">
                <div className="ai-card-content">
                    <div className="ai-card-header">
                        <span className="ai-icon">
                            <Sparkles className="h-6 w-6 text-indigo-500" />
                        </span>
                        <h4>Сгенерировать с AI</h4>
                    </div>
                    <p>Создайте уникальный рецепт на основе ваших анализов, предпочтений и имеющихся продуктов.</p>
                </div>
                <div className="ai-card-footer">
                    <button className="btn-primary">Начать с фото</button>
                    {lastProducts.length > 0 && (
                        <button className="btn-secondary mt-2" onClick={handleFromLastProducts}>
                            Из последних продуктов ({lastProducts.length})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
