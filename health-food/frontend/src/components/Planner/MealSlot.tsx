import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearPlanItem } from "../../store/slices/appSlice";
import PlanCard from "../UI/PlanCard";

type MealType = 'breakfast' | 'lunch' | 'dinner';

interface MealSlotProps {
    mealType: MealType;
    onAddClick: () => void;
}

const mealDetails: { [key in MealType]: { name: string, icon: string } } = {
    breakfast: { name: 'Завтрак', icon: '🍳' },
    lunch: { name: 'Обед', icon: '☀️' },
    dinner: { name: 'Ужин', icon: '🌙' },
};

const MealSlot = ({ mealType, onAddClick }: MealSlotProps) => {
    const dispatch = useAppDispatch();
    const planItem = useAppSelector((state) => state.app.plan[mealType]);

    const handleRemove = () => {
        dispatch(clearPlanItem(mealType));
    }

    return (
        <div className="meal-slot" data-meal={mealType}>
            <div className="meal-slot-header">
                <h3><span className="meal-icon">{mealDetails[mealType].icon}</span> {mealDetails[mealType].name}</h3>
                {/* <button className="add-meal-btn" onClick={onAddClick}>+ Добавить</button> */}
            </div>
            <div className="meal-slot-content">
                {planItem ? (
                   <PlanCard item={planItem} onRemove={handleRemove} />
                ) : (
                    <div className="empty-meal-slot" onClick={onAddClick}>Нажмите чтобы подобрать блюдо</div>
                )}
            </div>
        </div>
    );
};

export default MealSlot; 