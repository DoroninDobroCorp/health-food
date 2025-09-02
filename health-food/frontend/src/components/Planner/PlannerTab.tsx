
import BiomarkersGrid from '../Biomarkers/BiomarkersGrid';
import MealPlanner from './MealPlanner';
import VitaminsCard from '../Sidebar/VitaminsCard';
import ShoppingList from '../Sidebar/ShoppingList';
import RecipeGenerator from '../Generator/RecipeGenerator';

const PlannerTab = () => {
    return (
        <div className="content-wrapper">
            <div className="planner-layout">
                <main className="planner-main">
                    <BiomarkersGrid />
                    <MealPlanner />
                    <RecipeGenerator />
                </main>
                <aside className="planner-sidebar">
                    <VitaminsCard />
                    <ShoppingList />
                </aside>
            </div>
        </div>
    )
}

export default PlannerTab; 