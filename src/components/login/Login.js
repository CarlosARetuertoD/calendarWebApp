import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DotLoader from 'react-spinners/DotLoader';
import Loader from "components/tools/Loader" 
export default function Login() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex min-h-full flex-col justify-center px-8 py-16 lg:px-10 text-white">
      {/* Contenedor del logo y título */}
      <div className="flex items-center justify-center">
        <Loader />
      </div>

      {/* Formulario */}
      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md">
      <form className="space-y-8" onSubmit={e => e.preventDefault()}>
        {/* Usuario */}
        <div>
          <label
            htmlFor="email"
            className="block text-2xl font-medium"
          >
            Usuario
          </label>
          <div className="mt-3">
            <input
              type="email"
              name="email"
              id="email"
              autoComplete="email"
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
              autoComplete="current-password"
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

          {/* Botón */}
          <div>
          <Link
            to="/calendar"
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
            <DotLoader
              loading={loading}
              size={24}
              color="#131313"
              className="ml-4"
            />
          </Link>

          </div>
        </form>
      </div>
    </div>
  );
}
