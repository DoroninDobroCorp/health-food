import { useAppSelector } from "../../store/hooks";
import { useMemo } from "react";

// Helper functions from the old ui.js, can be moved to a utils file
function parseAmount(amountStr: string | undefined) {
    if (!amountStr || typeof amountStr !== 'string') {
        return { value: 1, unit: '' };
    }
    amountStr = amountStr.trim();

    let match = amountStr.match(/^(\d+)\/(\d+)\s*(.*)$/);
    if (match) {
        const value = parseInt(match[1], 10) / parseInt(match[2], 10);
        return { value: value, unit: match[3].trim() };
    }
    match = amountStr.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
        return { value: parseFloat(match[1]), unit: match[2].trim() };
    }
    return { value: 1, unit: amountStr };
}

function getPluralizedUnit(value: number, unit: string) {
    if (typeof Intl.PluralRules === 'undefined') {
        return unit; // Fallback for older browsers
    }
    const rules = new Intl.PluralRules('ru-RU');
    const category = rules.select(value);

    const pluralForms: { [key: string]: { [key: string]: string } } = {
        'щепотка': { one: 'щепотка', few: 'щепотки', many: 'щепоток' },
        // Add other units if needed
    };

    if (pluralForms[unit]) {
        return pluralForms[unit][category] || pluralForms[unit].many;
    }

    return unit;
}


const ShoppingList = () => {
    const plan = useAppSelector(state => state.app.plan);
    const ingredientsTotals = new Map<string, { [unit: string]: number }>();

    useMemo(() => {
        Object.values(plan).forEach(item => {
            if (item && item.mode === 'diy' && Array.isArray(item.ingredients)) {
                item.ingredients.forEach((ingredient: { name: string, amount?: string }) => {
                    if (!ingredientsTotals.has(ingredient.name)) {
                        ingredientsTotals.set(ingredient.name, {});
                    }
                    const totals = ingredientsTotals.get(ingredient.name)!;
                    const { value, unit } = parseAmount(ingredient.amount);

                    if (totals[unit]) {
                        totals[unit] += value;
                    } else {
                        totals[unit] = value;
                    }
                });
            }
        });
    }, [plan]);
    
    const sortedIngredients = [...ingredientsTotals.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="step-card">
            <div className="basket-header">
                <h3>🛒 Список покупок</h3>
                <p className="basket-subtitle">На основе выбранных рецептов</p>
            </div>
            <div id="shopping-list" className="basket-content">
                {sortedIngredients.length > 0 ? (
                     <ul className="shopping-list">
                        {sortedIngredients.map(([name, totals]) => {
                             const amountsStr = Object.entries(totals)
                             .map(([unit, value]) => `${value.toLocaleString('ru-RU')} ${getPluralizedUnit(value, unit)}`)
                             .join(', ');
                            return (
                                <li key={name}>
                                    <span>{name}</span> <span className="amount">{amountsStr}</span>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <div className="empty-basket">
                        <p>Добавьте рецепты в план, чтобы увидеть здесь список ингредиентов.</p>
                    </div>
                )}
            </div>
            {/* Clear plan button can be added here later */}
        </div>
    );
};

export default ShoppingList; 