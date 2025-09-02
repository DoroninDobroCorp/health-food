import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import type { Recipe } from '../../api/types';
import { LoaderCircle, PlusCircle } from 'lucide-react';
import Button from '../UI/Button';
import { deleteRecipe } from '../../store/slices/appSlice';
import RecipeListItem from './RecipeListItem';

type RecipeListProps = {
    onSelectRecipe: (recipe: Recipe) => void;
    onEditRecipe: (recipe: Recipe) => void;
    onCreateNew: () => void;
};

const RecipeList = ({ onSelectRecipe, onEditRecipe, onCreateNew }: RecipeListProps) => {
    const dispatch = useAppDispatch();
    const { items: recipes, isLoading } = useAppSelector(state => state.app.recipes);
    const currentUser = useAppSelector(state => state.app.currentUser);
    const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');

    const filteredRecipes = useMemo(() => {
        if (activeTab === 'my') {
            return recipes.filter(r => r.user_id === currentUser?.id);
        }
        return recipes.filter(r => r.user_id === null);
    }, [recipes, activeTab, currentUser]);

    const handleDelete = (recipeId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить этот рецепт?')) {
            dispatch(deleteRecipe(recipeId));
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><LoaderCircle className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    return (
        <div>
            <div className="flex justify-evenly items-center mb-4">
                <div className="bg-gray-100 p-1 rounded-lg flex space-x-1 w-1/2">
                    <button onClick={() => setActiveTab('my')} className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none ${ activeTab === 'my' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:bg-gray-200' }`}>
                        Мои рецепты
                    </button>
                    <button onClick={() => setActiveTab('public')} className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none ${ activeTab === 'public' ? 'bg-white text-indigo-700 shadow' : 'text-gray-500 hover:bg-gray-200' }`}>
                        Общие
                    </button>
                </div>
                <Button onClick={onCreateNew} variant="secondary">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Создать рецепт
                </Button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: "none" }}>
                <div className="flex flex-col space-y-3"
                style={{
                    padding: '1em',
                    gap: '0.5em',
                    marginTop: '1em',
                    marginBottom: '1em',
                }}>
                    {filteredRecipes.length === 0 ? (
                        <p className="text-gray-500 text-center py-10">
                            {activeTab === 'my' ? 'У вас еще нет сохраненных рецептов.' : 'Общих рецептов пока нет.'}
                        </p>
                    ) : (
                        filteredRecipes.map(recipe => (
                            <RecipeListItem 
                                key={recipe.id}
                                recipe={recipe}
                                isOwner={recipe.user_id === currentUser?.id}
                                onSelect={onSelectRecipe}
                                onEdit={onEditRecipe}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecipeList;
