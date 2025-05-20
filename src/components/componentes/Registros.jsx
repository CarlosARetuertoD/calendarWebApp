import React from 'react';
import { Link } from 'react-router-dom';

function Registros() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Registros
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/registro-pedidos"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Registro de Pedidos
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona los pedidos de productos y servicios
          </p>
        </Link>

        <Link
          to="/registro-distribuciones"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Registro de Distribuciones
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Administra las distribuciones de productos
          </p>
        </Link>

        <Link
          to="/registro-letras"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Registro de Letras
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona las letras de cambio y pagos
          </p>
        </Link>

        <Link
          to="/registro-documentos"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Registro de Documentos
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Administra los documentos relacionados
          </p>
        </Link>

        <Link
          to="/registro-entidades"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Registro de Entidades
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gestiona proveedores, clientes y otras entidades
          </p>
        </Link>
      </div>
    </div>
  );
}

export default Registros; 