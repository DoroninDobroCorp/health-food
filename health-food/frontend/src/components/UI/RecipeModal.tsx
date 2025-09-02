import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { closeRecipeModal } from "../../store/slices/appSlice";
import Modal from "./Modal";

const RecipeModal = () => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(state => state.app.isRecipeModalOpen);
    const recipe = useAppSelector(state => state.app.selectedRecipe);

    const handleClose = () => {
        dispatch(closeRecipeModal());
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} zIndex={60}>
            {recipe && (
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold mb-4">{recipe.name}</h2>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <p className="text-gray-600 mb-6">{recipe.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Ингредиенты</h3>
                            <ul className="space-y-2">
                                {recipe.ingredients?.map((ing: { name: string, amount: string }, index: number) => 
                                    <li key={index} className="flex justify-between border-b pb-2">
                                        <span>{ing.name}</span>
                                        <span className="text-gray-500 font-medium">{ing.amount}</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-3">Инструкции</h3>
                            <ol className="list-decimal list-inside space-y-3">
                                {recipe.instructions?.map((step: string, index: number) => <li key={index}>{step}</li>)}
                            </ol>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default RecipeModal;
