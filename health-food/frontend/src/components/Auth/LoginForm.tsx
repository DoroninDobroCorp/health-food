import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import Button from '../UI/Button';
import { fetchProfile, setToken } from '../../store/slices/appSlice';
import Input from '../UI/Input';
import { loginUser } from '../../api';
import { saveToken } from '../../store/localStorage';

const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const dispatch = useAppDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await loginUser(formData);

            if (!response.ok) {
                setError('Неверное имя пользователя или пароль.');
                return;
            }

            const data = await response.json();
            const token = data.access_token;

            if (token) {
                saveToken(token); // Save to localStorage
                dispatch(setToken(token)); // Save to redux state
                dispatch(fetchProfile()); // Fetch user profile
                // Here you would typically redirect the user, e.g., using react-router
            } else {
                setError('Не удалось получить токен. Попробуйте снова.');
            }
        } catch (err) {
            setError('Произошла ошибка сети. Пожалуйста, проверьте ваше подключение.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center gap-4 w-full max-w-sm">
             {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="login-username">
                    Имя пользователя
                </label>
                <Input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="login-password">
                    Пароль
                </label>
                <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div className="pt-2 w-full flex justify-center">
                <Button type="submit" className="w-5/8">
                    Войти
                </Button>
            </div>
        </form>
    );
};

export default LoginForm;
