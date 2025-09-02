import { useState, useEffect } from 'react';
import type { Recipe, Ingredient } from '../../api/types';
import Button from '../UI/Button';
import { PlusCircle, Trash2 } from 'lucide-react';
import TagsInput from '../UI/TagsInput';

type RecipeFormProps = {
    onSubmit: (recipeData: Omit<Recipe, 'id' | 'user_id'>) => void;
    onCancel: () => void;
    initialData?: Recipe;
};

const RecipeForm = ({ onSubmit, onCancel, initialData }: RecipeFormProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [timeMin, setTimeMin] = useState<number | ''>('');
    const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '' }]);
    const [instructions, setInstructions] = useState<string[]>(['']);
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setDescription(initialData.description || '');
            setTimeMin(initialData.time_min || '');
            setIngredients(initialData.ingredients.length > 0 ? initialData.ingredients : [{ name: '', amount: '' }]);
            setInstructions(initialData.instructions.length > 0 ? initialData.instructions : ['']);
            setTags(initialData.tags || []);
        }
    }, [initialData]);

    const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };

    const addIngredient = () => setIngredients([...ingredients, { name: '', amount: '' }]);
    const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));

    const handleInstructionChange = (index: number, value: string) => {
        const newInstructions = [...instructions];
        newInstructions[index] = value;
        setInstructions(newInstructions);
    };

    const addInstruction = () => setInstructions([...instructions, '']);
    const removeInstruction = (index: number) => setInstructions(instructions.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const recipeData = {
            name,
            description,
            time_min: Number(timeMin) || undefined,
            ingredients: ingredients.filter(i => i.name && i.amount),
            instructions: instructions.filter(i => i),
            tags,
        };
        onSubmit(recipeData);
    };
    
    return (
        <div className="max-h-[500px] overflow-y-auto pr-2" style={{ scrollbarWidth: "none" }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Basic Info Section */}
                <div className="form-group">
                    <label>Название рецепта</label>
                    <input 
                        className="form-control"
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Введите название рецепта..."
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label>Описание</label>
                    <textarea 
                        className="form-control"
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Краткое описание рецепта..."
                        rows={3}
                        style={{ resize: 'none' }}
                    />
                </div>
                
                <div className="form-group">
                    <label>Время приготовления (мин)</label>
                    <input 
                        className="form-control"
                        type="number" 
                        value={timeMin} 
                        onChange={(e) => setTimeMin(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        placeholder="30"
                        min="1"
                        style={{ maxWidth: '200px' }}
                    />
                </div>

                {/* Ingredients Section */}
                <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ margin: 0 }}>Ингредиенты</label>
                        <button
                            type="button"
                            onClick={addIngredient}
                            className="btn-small"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--spacing-xs)',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none'
                            }}
                        >
                            <PlusCircle style={{ width: '16px', height: '16px' }} />
                            Добавить
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {ingredients.map((ing, index) => (
                            <div key={index} className="input-with-btn" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <input 
                                    className="form-control"
                                    type="text" 
                                    placeholder="200г" 
                                    value={ing.amount} 
                                    onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                                    style={{ flex: '0 0 120px', marginRight: 'var(--spacing-sm)' }}
                                />
                                <input 
                                    className="form-control"
                                    type="text" 
                                    placeholder="Название ингредиента" 
                                    value={ing.name} 
                                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                    style={{ flex: '1' }}
                                />
                                {ingredients.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeIngredient(index)} 
                                        style={{
                                            padding: 'var(--spacing-sm)',
                                            marginLeft: 'var(--spacing-sm)',
                                            background: 'var(--gray-100)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--error)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = 'var(--gray-200)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = 'var(--gray-100)';
                                        }}
                                    >
                                        <Trash2 style={{ width: '16px', height: '16px' }} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions Section */}
                <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ margin: 0 }}>Инструкции</label>
                        <button
                            type="button"
                            onClick={addInstruction}
                            className="btn-small"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--spacing-xs)',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none'
                            }}
                        >
                            <PlusCircle style={{ width: '16px', height: '16px' }} />
                            Добавить шаг
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {instructions.map((step, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    flexShrink: 0,
                                    width: '32px',
                                    height: '32px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    marginTop: 'var(--spacing-xs)'
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{ flex: '1' }}>
                                    <textarea 
                                        className="form-control"
                                        value={step} 
                                        onChange={(e) => handleInstructionChange(index, e.target.value)}
                                        placeholder="Опишите этот шаг приготовления..."
                                        rows={2}
                                        style={{ resize: 'none' }}
                                    />
                                </div>
                                {instructions.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeInstruction(index)} 
                                        style={{
                                            padding: 'var(--spacing-sm)',
                                            marginTop: 'var(--spacing-xs)',
                                            background: 'var(--gray-100)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--error)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = 'var(--gray-200)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = 'var(--gray-100)';
                                        }}
                                    >
                                        <Trash2 style={{ width: '16px', height: '16px' }} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tags Section */}
                <div className="form-group">
                    <label>Теги</label>
                    <TagsInput tags={tags} setTags={setTags} />
                </div>

                {/* Form Actions */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 'var(--spacing-md)', 
                    paddingTop: 'var(--spacing-sm)',
                    borderTop: '1px solid var(--gray-200)'
                }}>
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Отмена
                    </Button>
                    <Button type="submit">
                        {initialData ? 'Сохранить изменения' : 'Создать рецепт'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default RecipeForm;