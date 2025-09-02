import type { Recipe } from '../../api/types';
import { Clock, Tag } from 'lucide-react';
import Button from '../UI/Button';

type RecipeDetailProps = {
    recipe: Recipe;
    onAddToPlan?: (recipe: Recipe) => void;
    canAddToPlan?: boolean;
};

const RecipeDetail = ({ recipe, onAddToPlan, canAddToPlan }: RecipeDetailProps) => {
    return (
        <div className="p-1">
            <h3 className="text-2xl font-bold mb-3">{recipe.name}</h3>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                {recipe.time_min && (
                    <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> {recipe.time_min} мин.</span>
                )}
                {/* We can add servings later if needed */}
                {/* <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> 4 порции</span> */}
            </div>

            {recipe.description && <p className="text-gray-700 mb-4">{recipe.description}</p>}

            <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2">Ингредиенты</h4>
                <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md">
                    {recipe.ingredients.map((ing, index) => (
                        <li key={index} className="text-gray-800">{ing.amount} {ing.name}</li>
                    ))}
                </ul>
            </div>

            <div className="mb-4">
                <h4 className="font-semibold text-lg mb-2">Инструкции</h4>
                <ol className="list-decimal list-inside space-y-2">
                    {recipe.instructions.map((step, index) => (
                        <li key={index} className="text-gray-800">{step}</li>
                    ))}
                </ol>
            </div>

            {recipe.tags && recipe.tags.length > 0 && (
                 <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.map(tag => (
                        <span key={tag} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Tag className="h-3 w-3 mr-1" /> {tag}
                        </span>
                    ))}
                </div>
            )}

            {canAddToPlan && onAddToPlan && (
                <div className="mt-6 pt-4 border-t border-gray-200"
                style={{
                    marginTop: 'var(--spacing-md)',
                }}>
                    <Button onClick={() => onAddToPlan(recipe)} className="w-full">
                        Добавить в план питания
                    </Button>
                </div>
            )}
        </div>
    );
};

export default RecipeDetail;
