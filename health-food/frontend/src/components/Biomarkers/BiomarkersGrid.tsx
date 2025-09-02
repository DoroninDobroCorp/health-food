import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setBiomarker, removeBiomarker, setDiet, setAllergies } from '../../store/slices/appSlice';
import { BIOMARKERS } from '../../constants/biomarkers';
import BiomarkerItem from './BiomarkerItem';
import TagsInput from '../UI/TagsInput';

const BiomarkersGrid = () => {
  const dispatch = useAppDispatch();
  const biomarkers = useAppSelector((state) => state.app.biomarkers);
  const { diet, allergies } = useAppSelector((state) => state.app.preferences);

  const handleBiomarkerChange = (key: string, value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || value === '') {
      dispatch(removeBiomarker(key));
    } else {
      dispatch(setBiomarker({ key, value: numericValue }));
    }
  };

  const handleDietChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setDiet(e.target.value));
  }

  const handleAllergiesChange = (newAllergies: string[]) => {
    dispatch(setAllergies(newAllergies));
  }

  return (
    <div className="step-card">
      <div className="step-header">
        <div className="step-number">1</div>
        <div className="step-info">
          <h2>Ваши анализы</h2>
          <p>Введите актуальные значения биомаркеров из вашего последнего отчета.</p>
        </div>
      </div>
      <div className="biomarkers-grid">
        {Object.entries(BIOMARKERS).map(([key, biomarker]) => (
          <BiomarkerItem 
            key={key}
            id={key}
            biomarker={biomarker}
            value={biomarkers[key]}
            onChange={handleBiomarkerChange}
          />
        ))}
      </div>

      <div className="preferences-section">
        <label className="section-label">
          Предпочтения <span className="optional">опционально</span>
        </label>
        <div className="preferences-grid">
          <div className="form-group">
            <label htmlFor="diet-select">Диета</label>
            <select id="diet-select" name="diet" className="form-control" value={diet} onChange={handleDietChange}>
              <option value="">Без особенностей</option>
              <option value="vegetarian">Вегетарианская</option>
              <option value="vegan">Веганская</option>
              <option value="gluten-free">Без глютена</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="allergies-input">Аллергии или исключения</label>
            <TagsInput tags={allergies || []} setTags={handleAllergiesChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiomarkersGrid; 