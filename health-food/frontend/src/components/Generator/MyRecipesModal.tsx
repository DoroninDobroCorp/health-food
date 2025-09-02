import { useState, useEffect } from 'react';
import Modal from '../UI/Modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRecipes, createRecipe, updateRecipe, setPlanItem, setCurrentMeal } from '../../store/slices/appSlice';
import RecipeList from '../Recipes/RecipeList';
import RecipeDetail from '../Recipes/RecipeDetail';
import RecipeForm from '../Recipes/RecipeForm';
import type { Recipe } from '../../api/types';
import { ArrowLeft } from 'lucide-react';
import Button from '../UI/Button';

type View = 'list' | 'detail' | 'create' | 'edit';

type MyRecipesModalProps = {
    isOpen: boolean;
    onClose: () => void;
}

const MyRecipesModal = ({ isOpen, onClose }: MyRecipesModalProps) => {
    const dispatch = useAppDispatch();
    const currentMeal = useAppSelector(state => state.app.currentMeal);
    const [view, setView] = useState<View>('list');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchRecipes());
        }
    }, [isOpen, dispatch]);

    const handleClose = () => {
        onClose();
        // Reset state after modal closes
        setTimeout(() => {
            setView('list');
            setSelectedRecipe(null);
        }, 300); // Animation duration
    };

    const handleSelectRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setView('detail');
    };

    const handleEditRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setView('edit');
    };
    
    const handleCreateNew = () => {
        setSelectedRecipe(null);
        setView('create');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedRecipe(null);
    };

    const handleFormSubmit = (recipeData: Omit<Recipe, 'id' | 'user_id'>) => {
        if (view === 'edit' && selectedRecipe) {
            dispatch(updateRecipe({ recipeId: selectedRecipe.id, recipeData }));
        } else {
            dispatch(createRecipe(recipeData));
        }
        setView('list');
    };

    const handleAddToPlan = (recipe: Recipe) => {
        if (currentMeal) {
            // Преобразуем Recipe в PlanItem формат
            const planItem = {
                ...recipe,
                mode: 'diy' as const
            };
            dispatch(setPlanItem({ meal: currentMeal, item: planItem, mode: 'diy' }));
            dispatch(setCurrentMeal(null)); // Закрываем генератор
            handleClose(); // Закрываем модальное окно
        }
    };
    
    const renderContent = () => {
        switch (view) {
            case 'list':
                return <RecipeList onSelectRecipe={handleSelectRecipe} onEditRecipe={handleEditRecipe} onCreateNew={handleCreateNew} />;
            case 'detail':
                return selectedRecipe ? (
                    <RecipeDetail 
                        recipe={selectedRecipe} 
                        onAddToPlan={handleAddToPlan}
                        canAddToPlan={!!currentMeal}
                    />
                ) : null;
            case 'create':
                return <RecipeForm onSubmit={handleFormSubmit} onCancel={handleBackToList} />;
            case 'edit':
                return selectedRecipe ? <RecipeForm onSubmit={handleFormSubmit} onCancel={handleBackToList} initialData={selectedRecipe} /> : null;
            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (view) {
            case 'list': return 'Книга рецептов';
            case 'detail': return selectedRecipe?.name || 'Детали рецепта';
            case 'create': return 'Новый рецепт';
            case 'edit': return 'Редактирование';
            default: return 'Мои рецепты';
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <div className="p-6 w-full max-w-2xl">
                <div className="flex items-center mb-4">
                    {view !== 'list' && (
                        <Button variant="secondary" onClick={handleBackToList} className="mr-2">
                           <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <h2 className="text-2xl font-bold" style={{ margin: 'auto' }}>{getTitle()}</h2>
                </div>

                <div className="min-h-[400px]">
                    {renderContent()}
                </div>
                
                 {view === 'detail' && !currentMeal && (
                    <div className="mt-6 text-right space-x-3">
                         <Button onClick={handleClose} variant="secondary">Закрыть</Button>
                         <Button onClick={() => handleEditRecipe(selectedRecipe!)}>Редактировать</Button>
                    </div>
                 )}
            </div>
        </Modal>
    );
};

export default MyRecipesModal;
