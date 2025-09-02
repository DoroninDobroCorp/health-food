import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProfile, saveProfile } from '../../store/slices/appSlice';
import { logout } from '../../store/slices/appSlice';
import { LogOut } from 'lucide-react';


const ProfileTab = () => {
    const dispatch = useAppDispatch();
    const { username, email, goals, isLoading, error } = useAppSelector(state => state.app.profile);

    const [localUsername, setLocalUsername] = useState(username);
    const [localEmail, setLocalEmail] = useState(email);
    const [localGoals, setLocalGoals] = useState(goals);

    useEffect(() => {
        dispatch(fetchProfile());
    }, [dispatch]);

    useEffect(() => {
        setLocalUsername(username);
        setLocalEmail(email);
        setLocalGoals(goals);
    }, [username, email, goals]);

    const handleLogout = () => {
        dispatch(logout());
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(saveProfile({ name: localUsername, email: localEmail, goals: localGoals }))
            .then(() => {
                alert('Профиль сохранен!');
            })
            .catch((err) => {
                alert(`Ошибка при сохранении профиля: ${err.message}`);
            });
    };

    return (
        <div className="content-wrapper">
            <div className="step-card">
                <div className="step-header">
                    <div className="step-number">👤</div>
                    <div className="step-info">
                        <h2>Ваш профиль</h2>
                        <p>Эта информация поможет нам лучше персонализировать рекомендации в будущем.</p>
                    </div>
                </div>
                {isLoading && !username && <div className="loader"></div>}
                {error && <p className="error">Ошибка загрузки профиля: {error}</p>}
                <form id="profileForm" className="profile-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="prof_name">Имя</label>
                        <input name="name" id="prof_name" placeholder="Как к вам обращаться?" value={localUsername} onChange={(e) => setLocalUsername(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="prof_email">Email</label>
                        <input name="email" id="prof_email" type="email" placeholder="user@example.com" value={localEmail} onChange={(e) => setLocalEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="prof_goals">Цели</label>
                        <textarea name="goals" id="prof_goals" placeholder="Например: повысить энергию, улучшить состояние кожи..." rows={3} value={localGoals} onChange={(e) => setLocalGoals(e.target.value)}></textarea>
                    </div>
                    <div className="flex justify-between">
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Сохранение...' : 'Сохранить профиль'}
                        </button>
                        <div
                            className="logout-button flex items-center justify-center gap-2 mt-4 p-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors duration-300 cursor-pointer shadow-md hover:shadow-lg"
                            onClick={handleLogout}
                            style={{ marginTop: '1rem',
                                     padding: '1rem',
                             }}
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Выйти из аккаунта</span>
                        </div>
                    </div>
                </form>

            </div>
        </div>
    )
}

export default ProfileTab; 