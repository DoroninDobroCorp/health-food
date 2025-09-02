import { useState } from 'react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { registerUser } from '../../api';

const RegisterForm = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [successMessage, setSuccessMessage] = useState('');


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage('');

        const response = await registerUser({ username, email, password });

        if (!response.ok) {
            const errorData = response.data.detail;
            if (typeof errorData === 'string') {
                if (errorData.includes('Username')) {
                    setErrors({ username: 'Это имя пользователя уже занято' });
                } else if (errorData.includes('Email')) {
                    setErrors({ email: 'Этот email уже зарегистрирован' });
                } else {
                    setErrors({ form: 'Произошла ошибка при регистрации' });
                }
            }
        } else {
            setSuccessMessage('Вы успешно зарегистрировались! Теперь можете войти.');
            // Reset form
            setUsername('');
            setEmail('');
            setPassword('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center gap-4 w-full max-w-sm">
             {successMessage && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm w-full text-center">
                    {successMessage}
                </div>
            )}
             {errors.form && <div className="text-red-500 text-sm text-center">{errors.form}</div>}
            <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="register-username">
                    Имя пользователя
                </label>
                <Input
                    id="register-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                 {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>
            <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="register-email">
                    Email
                </label>
                <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="register-password">
                    Пароль
                </label>
                <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <div className="pt-2 w-full flex justify-center">
                <Button type="submit" className="w-5/8">
                    Зарегистрироваться
                </Button>
            </div>
        </form>
    );
};

export default RegisterForm;
