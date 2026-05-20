import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useToast } from './ui/Toast';

function ProfileMenu({ userName }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(() => {
    const username = localStorage.getItem('username');
    if (!username) return null;
    return localStorage.getItem(`profilePicture:${username}`);
  });
  const [loading, setLoading] = useState(() => {
    const username = localStorage.getItem('username');
    if (!username) return false;
    return !localStorage.getItem(`profilePicture:${username}`);
  });
  const menuRef = useRef(null);
  const lastUsernameRef = useRef(null);

  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        const username = localStorage.getItem('username');
        if (!username) { setLoading(false); return; }

        if (lastUsernameRef.current !== username) {
          lastUsernameRef.current = username;
          setProfilePicture(null);
          setLoading(true);
        }

        const cacheKey = `profilePicture:${username}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) { setProfilePicture(cached); setLoading(false); return; }

        const response = await axiosClient.get(`/auth/profile-picture/${username}`, {
          responseType: 'arraybuffer', timeout: 8000, silent: true,
        });
        if (response.data?.byteLength > 0) {
          const base64 = btoa(
            new Uint8Array(response.data).reduce((d, b) => d + String.fromCharCode(b), '')
          );
          const imageUrl = `data:image/jpeg;base64,${base64}`;
          localStorage.setItem(cacheKey, imageUrl);
          setProfilePicture(imageUrl);
        }
      } catch {
        // Sin foto — usar placeholder
      } finally {
        setLoading(false);
      }
    };
    loadProfilePicture();
  }, [userName]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.info('Sesión cerrada.');
    navigate('/login');
  };

  const handlePasswordChange = async () => {
    setIsOpen(false);
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }

    const newPassword = prompt('Introduce tu nueva contraseña:');
    if (!newPassword) return;

    try {
      const response = await axiosClient.post('/auth/change-password', { newPassword });
      toast.success(response.data.message || 'Contraseña actualizada.');
    } catch {
      toast.error('Error al cambiar la contraseña.');
    }
  };

  const handleProfilePictureUpdate = async (event) => {
    setIsOpen(false);
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axiosClient.post('/auth/update-profile-picture', formData);
      toast.success(response.data.message || 'Foto actualizada.');
      const username = localStorage.getItem('username');
      if (username) {
        const cacheKey = `profilePicture:${username}`;
        const picResponse = await axiosClient.get(`/auth/profile-picture/${username}`, {
          responseType: 'arraybuffer', timeout: 8000, silent: true,
        });
        if (picResponse.data?.byteLength > 0) {
          const base64 = btoa(
            new Uint8Array(picResponse.data).reduce((d, b) => d + String.fromCharCode(b), '')
          );
          const imageUrl = `data:image/jpeg;base64,${base64}`;
          localStorage.setItem(cacheKey, imageUrl);
          setProfilePicture(imageUrl);
        }
      }
    } catch {
      toast.error('Error al actualizar la foto de perfil.');
    }
  };

  // Avatar placeholder como data URL (SVG)
  const defaultProfilePicture = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 3v3h16v-3s-2-3-8-3z"/></svg>';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div>
        <button
          type="button"
          className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 transition-transform duration-200 transform hover:scale-105"
          onClick={() => setIsOpen(!isOpen)}
        >
          <img
            src={loading ? defaultProfilePicture : (profilePicture || defaultProfilePicture)}
            alt="Profile"
            className="h-full w-full object-cover rounded-full"
          />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-50 animate-fade-in-down" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
          {/* Nuevo div para el texto de bienvenida */}
          <div className="p-4 text-sm font-medium text-gray-900 border-b border-gray-200" role="none">
            Bienvenido, {userName || 'Administrador'}
          </div>
          <div className="py-1" role="none">
            <button
              onClick={handlePasswordChange}
              className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              role="menuitem"
            >
              Cambiar Contraseña
            </button>
            <label
              className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              role="menuitem"
            >
              Actualizar Foto de Perfil
              <input
                type="file"
                onChange={handleProfilePictureUpdate}
                className="hidden"
              />
            </label>
          </div>
          <div className="py-1" role="none">
            <button
              onClick={handleLogout}
              className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              role="menuitem"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;