import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchReminders, saveLabs } from '../../store/slices/appSlice';

const RemindersTab = () => {
    const dispatch = useAppDispatch();
    const { items: reminders, isLoading, error } = useAppSelector(state => state.app.reminders);
    const biomarkers = useAppSelector(state => state.app.biomarkers);
    const [weeks, setWeeks] = useState(10);

    useEffect(() => {
        dispatch(fetchReminders());
    }, [dispatch]);

    const handleSaveAndRemind = () => {
        if (Object.keys(biomarkers).length === 0) {
            alert('Пожалуйста, введите данные анализов.');
            return;
        }
        dispatch(saveLabs({ weeks, labsJson: JSON.stringify(biomarkers) }))
            .then(() => {
                alert('Анализы сохранены и напоминание установлено!');
                dispatch(fetchReminders()); // Refetch reminders after saving
            })
            .catch((err) => {
                alert(`Не удалось сохранить анализы: ${err.message}`);
            });
    };

    return (
        <div className="content-wrapper">
            <div className="step-card">
                <div className="step-header">
                    <div className="step-number">🔔</div>
                    <div className="step-info">
                        <h2>Напоминания</h2>
                        <p>Сохраняйте анализы и устанавливайте напоминания, чтобы не забыть о повторном обследовании.</p>
                    </div>
                </div>
                <div className="reminder-setup">
                    <div className="input-group">
                        <label htmlFor="weeks">Напомнить через (недель):</label>
                        <div className="input-with-btn">
                            <input
                                type="number"
                                id="weeks"
                                value={weeks}
                                onChange={(e) => setWeeks(parseInt(e.target.value, 10))}
                                min="2"
                                max="24"
                            />
                            <button id="saveLabsBtn" type="button" className="btn-primary" onClick={handleSaveAndRemind}>
                                Сохранить и напомнить
                            </button>
                        </div>
                    </div>
                </div>
                <div className="reminders-list" id="reminders">
                    {isLoading && <div className="loader"></div>}
                    {error && <p className="error">Ошибка: {error}</p>}
                    {!isLoading && !error && (
                        reminders.length > 0 ? (
                             <ul>
                                {reminders.map((rem, index) => (
                                    <li key={index} className="reminder-item">
                                        <span>Напоминание о сдаче анализов</span>
                                        <strong>{new Date(rem.due_at).toLocaleDateString('ru-RU')}</strong>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Активных напоминаний нет.</p>
                        )
                    )}
                </div>
                <div className="text-center">
                    <button
                        id="refreshRemBtn"
                        type="button"
                        className="btn-secondary"
                        onClick={() => dispatch(fetchReminders())}
                    >
                        Обновить список
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RemindersTab; 