import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="p-8 bg-white rounded-lg w-full flex flex-col items-center gap-4">
            <div className="mb-6 text-center max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-gray-800">{isLogin ? 'С возвращением!' : 'Создать аккаунт'}</h1>
                <p className="text-gray-500 text-sm mt-1">
                    {isLogin ? 'Войдите, чтобы продолжить' : 'Заполните поля для регистрации'}
                </p>
            </div>
            {isLogin ? <LoginForm /> : <RegisterForm />}
            <div className="mt-6 text-center">
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
                    style={{ textDecoration: 'none',
                        color: 'var(--color-primary)',
                        cursor: 'pointer',
                     }}
                >
                    {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
            </div>
        </div>
    );
};

export default AuthPage;
