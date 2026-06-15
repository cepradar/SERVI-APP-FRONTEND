import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { usePermissions } from '../../context/PermissionsContext';
import { useSedes } from '../../context/SedesContext';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loginStatus, setLoginStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { reload: reloadPermissions } = usePermissions();
  const { reload: reloadSedes }       = useSedes();
  const { companyInfo, logoUrl: companyLogo2Url } = useCompanyInfo('logo2');

  const companyName = companyInfo?.razonSocial || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setLoginStatus(null);

    if (!username || !password) {
      setMessage('Por favor, completa todos los campos.');
      setLoginStatus('error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosClient.post('/auth/login', { username, password });
      const {
        token,
        role,
        username: serverUsername,
        displayName,
        fullName,
        firstName,
        lastName,
        name,
      } = response.data;
      const resolvedName = fullName || [firstName, lastName].filter(Boolean).join(' ').trim();
      localStorage.setItem('authToken', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('username', serverUsername || username.toUpperCase());
      localStorage.setItem('displayName', resolvedName || displayName || name || '');
      localStorage.setItem('fullName', fullName || resolvedName || '');
      localStorage.setItem('firstName', firstName || '');
      localStorage.setItem('lastName', lastName || '');
      await reloadPermissions();
      await reloadSedes();
      setMessage(`Bienvenido, ${resolvedName || displayName || name || 'Usuario'}`);
      setLoginStatus('success');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Credenciales incorrectas';
      setMessage(errorMessage);
      setLoginStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Section (Image/Branding) */}
        <div 
          className="hidden lg:block w-1/2 bg-white bg-no-repeat bg-center" 
          style={{ 
            backgroundImage: companyLogo2Url ? `url('${companyLogo2Url}')` : "url('/vite.svg')",
            backgroundSize: 'contain',
            backgroundPosition: 'center'
          }}
        >
        </div>

        {/* Right Section (Login Form) */}
        <div className="w-full lg:w-1/2 bg-white p-12 flex items-center justify-center">
          <form onSubmit={handleLogin} className="w-full max-w-sm">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800 tracking-tight">Bienvenido</h1>

            {message && (
              <p className={`mb-6 text-center font-semibold text-sm ${loginStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="username">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                placeholder="Ingresa tu nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
            <div className="mt-8 text-center text-gray-500 text-sm">
              <p>&copy; 2022 {companyName || 'Tu Empresa'}. Todos los derechos reservados.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;