import { useAppDispatch } from "../../store/hooks";
import { setCurrentMeal } from "../../store/slices/appSlice";
import MealSlot from "./MealSlot";

const MealPlanner = () => {
    const dispatch = useAppDispatch();

    const handleAddClick = (meal: 'breakfast' | 'lunch' | 'dinner') => {
        dispatch(setCurrentMeal(meal));
        // Later, this will also open the generator
        console.log(`Setting current meal to: ${meal}`);
    };

    return (
        <div className="step-card">
            <div className="step-header">
                <div className="step-number">2</div>
                <div className="step-info">
                    <h2>План питания на сегодня</h2>
                    <p>Добавьте блюда в свой рацион, чтобы сгенерировать список покупок или посмотреть КБЖУ.</p>
                </div>
            </div>
            <div className="day-planner">
                <MealSlot mealType="breakfast" onAddClick={() => handleAddClick('breakfast')} />
                <MealSlot mealType="lunch" onAddClick={() => handleAddClick('lunch')} />
                <MealSlot mealType="dinner" onAddClick={() => handleAddClick('dinner')} />
            </div>
        </div>
    );
};

export default MealPlanner; 