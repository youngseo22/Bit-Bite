import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/api/api';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(''); // New state for error message
  const navigate = useNavigate();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setLoginError(''); // Clear error when password changes
  };

  const handleLogin = async () => {
    setLoginError(''); // Clear previous error on new login attempt
    try {
      const response = await adminLogin({ username, password });
      const { access_token } = response;
      if (access_token) {
        localStorage.setItem('accessToken', access_token);
        navigate('/admin');
      }
    } catch (error) {
      console.error("Admin login failed:", error);
      setLoginError('아이디 또는 비밀번호가 틀립니다.'); // Set error message
    }
  };

  return (
    <>
    <div className="h-full flex flex-col items-center justify-center px-4 text-center text-gray-800">
        <div className="bg-white rounded-xlp-4 w-full max-w-sm">
            <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.03)] mb-4"
                placeholder="아이디"
                value={username}
                onChange={handleUsernameChange}
            />
            <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.03)] mb-4"
                placeholder="비밀번호"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {loginError && (
                <p className="text-red-500 text-sm mb-4">{loginError}</p>
            )}
            <button
                className="px-6 py-2 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 transition-colors"
                onClick={handleLogin}
            >
                로그인
            </button>
        </div>
    </div>
    </>
  );
}

