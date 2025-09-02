import type { Recipe } from '../../api/types';
import { TAG_NAMES } from "../../constants/biomarkers";
import { Edit, Trash2 } from 'lucide-react';

interface RecipeListItemProps {
    recipe: Recipe;
    isOwner: boolean;
    onSelect: (recipe: Recipe) => void;
    onEdit: (recipe: Recipe) => void;
    onDelete: (recipeId: string) => void;
}

const RecipeListItem = ({ recipe, isOwner, onSelect, onEdit, onDelete }: RecipeListItemProps) => {

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(recipe);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(recipe.id);
    };

    return (
        <div className="result-card" onClick={() => onSelect(recipe)} style={{ cursor: 'pointer' }}>
            <div className="result-card-content">
                <div className="result-card-header">
                    <h4>{recipe.name}</h4>
                </div>
                <p className="result-card-description"><i>~{recipe.time_min || '?'} мин.</i></p>
                {recipe.tags && Array.isArray(recipe.tags) && (
                     <div className="result-card-tags">
                        {recipe.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="result-card-tag" data-tag={tag}>{TAG_NAMES[tag] || tag}</span>
                        ))}
                    </div>
                )}
            </div>
            <div className="result-card-right-col">
                 <img
                    className="result-card-image"
                    src={`https://placehold.co/110x88?text=${encodeURIComponent(recipe.name)}`}
                    alt={recipe.name}
                />
                <div className="result-card-actions">
                   {isOwner && (
                       <div className="flex items-center gap-2">
                           <button onClick={handleEditClick} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-100" title="Редактировать">
                               <Edit className="h-4 w-4" />
                           </button>
                           <button onClick={handleDeleteClick} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100" title="Удалить">
                               <Trash2 className="h-4 w-4" />
                           </button>
                       </div>
                   )}
                </div>
            </div>
        </div>
    );
};

export default RecipeListItem;
