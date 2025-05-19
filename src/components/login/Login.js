import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DotLoader from 'react-spinners/DotLoader';
import Loader from "components/tools/Loader";
import { login } from '../../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(credentials.username, credentials.password);
      
      if (result.success) {
        navigate('/calendar');
      } else {
        setError(result.error || 'Credenciales inválidas');
      }
    } catch (error) {
      setError('Error al conectar con el servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-8 py-16 lg:px-10 text-white">
      {/* Contenedor del logo y título */}
      <div className="flex items-center justify-center">
        <Loader />
      </div>

      {/* Formulario */}
      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Usuario */}
          <div>
            <label
              htmlFor="username"
              className="block text-2xl font-medium"
            >
              Usuario
            </label>
            <div className="mt-3">
              <input
                type="text"
                name="username"
                id="username"
                value={credentials.username}
                onChange={handleChange}
                required
                className="
                  block w-full rounded-lg bg-white bg-opacity-10
                  px-4 py-3 text-xl text-white placeholder-white/50
                  outline-1 outline-offset-1 outline-gray-300
                  focus:outline-none
                  focus:ring-2 focus:ring-offset-2 focus:ring-white
                "
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-2xl font-medium"
              >
                Contraseña
              </label>
            </div>
            <div className="mt-3">
              <input
                type="password"
                name="password"
                id="password"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="
                  block w-full rounded-lg bg-white bg-opacity-10
                  px-4 py-3 text-xl text-white placeholder-white/50
                  outline-1 outline-offset-1 outline-gray-300
                  focus:outline-none
                  focus:ring-2 focus:ring-offset-2 focus:ring-white
                "
              />
            </div>
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <div className="text-red-500 text-center">{error}</div>
          )}

          {/* Botón */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex justify-center items-center
                rounded-lg bg-color-button px-8 py-3 text-2xl font-medium
                text-white shadow-sm
                hover:bg-white hover:text-black
                transition duration-300 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-color-button focus:ring-offset-2
              "
            >
              Iniciar Sesión
              {loading && (
                <DotLoader
                  loading={loading}
                  size={24}
                  color="#131313"
                  className="ml-4"
                />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
