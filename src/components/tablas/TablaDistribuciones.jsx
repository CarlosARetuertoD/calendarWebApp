import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatCurrency, formatPercentage } from 'utils/formatters';
import BotonAcciones from 'components/botones/BotonAcciones';
import ModalConfirmacion from 'components/modales/ModalConfirmacion';
import ModalFormDistribucion from 'components/modales/ModalFormDistribucion';

const TablaDistribuciones = ({ distribuciones, fetchDistribuciones, showActions = true }) => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([{ id: 'fecha_distribucion', desc: true }]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDistribucion, setSelectedDistribucion] = useState(null);
  
  const handleEditClick = (distribucion) => {
    setSelectedDistribucion(distribucion);
    setShowEditModal(true);
  };
  
  const handleDeleteClick = (distribucion) => {
    setSelectedDistribucion(distribucion);
    setShowDeleteModal(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/distribuciones/${selectedDistribucion.id}/`);
      toast.success('Distribución eliminada correctamente');
      fetchDistribuciones();
    } catch (error) {
      console.error('Error al eliminar distribución:', error);
      toast.error('Error al eliminar la distribución');
    } finally {
      setShowDeleteModal(false);
      setSelectedDistribucion(null);
    }
  };
  
  const columnHelper = createColumnHelper();
  
  const columns = [
    // Columna para el proveedor
    columnHelper.accessor('pedido.proveedor_nombre', {
      header: 'Proveedor',
      cell: (info) => {
        const pedido = info.row.original.pedido_info || info.row.original.pedido;
        return (
          <div className="font-medium text-gray-700 dark:text-gray-300">
            {pedido?.proveedor?.nombre || pedido?.proveedor_nombre || 'Sin proveedor'}
          </div>
        );
      },
    }),
    
    // Columna para el tipo de pedido (contado/crédito)
    columnHelper.accessor('pedido.es_contado', {
      header: 'Tipo',
      cell: (info) => {
        const pedido = info.row.original.pedido_info || info.row.original.pedido;
        const esContado = pedido?.es_contado;
        if (esContado === undefined) return '-';
        return (
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
            esContado 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {esContado ? 'Contado' : 'Crédito'}
          </span>
        );
      },
    }),
    
    columnHelper.accessor('empresa.nombre', {
      header: 'Empresa',
      cell: (info) => info.getValue() || 'Sin empresa',
    }),
    
    // Información del pedido relacionado
    columnHelper.accessor('pedido.numero_pedido', {
      header: 'Nº Pedido',
      cell: (info) => {
        const pedido = info.row.original.pedido_info || info.row.original.pedido;
        return pedido?.numero_pedido || '-';
      },
    }),
    
    columnHelper.accessor('monto_final', {
      header: 'Monto de Distribución',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    
    columnHelper.accessor('fecha_distribucion', {
      header: 'Fecha',
      cell: (info) => format(new Date(info.getValue()), 'dd/MM/yyyy'),
    }),
    
    columnHelper.accessor('total_letras', {
      header: 'Asignado en Letras',
      cell: (info) => {
        const monto = info.getValue() || 0;
        const montoTotal = info.row.original.monto_final;
        return (
          <div className="flex flex-col">
            <span>{formatCurrency(monto)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatPercentage(montoTotal > 0 ? (monto / montoTotal) * 100 : 0)}
            </span>
          </div>
        );
      },
    }),
    
    // Esta columna muestra el monto disponible (no asignado en letras)
    columnHelper.accessor('monto_disponible', {
      header: 'Disponible',
      cell: (info) => {
        const valor = info.getValue();
        if (valor === null || valor === undefined) {
          // Calcular manualmente si no está disponible
          const montoTotal = info.row.original.monto_final || 0;
          const totalLetras = info.row.original.total_letras || 0;
          return formatCurrency(montoTotal - totalLetras);
        }
        return formatCurrency(valor);
      },
    }),
  ];
  
  // Sólo agregar columna de acciones si showActions es true
  if (showActions) {
    columns.push(
      columnHelper.accessor('acciones', {
        header: '',
        cell: ({ row }) => {
          const distribucion = row.original;
          
          const options = [
            {
              label: 'Ver detalles',
              onClick: () => navigate(`/distribuciones/${distribucion.id}`),
              icon: 'search',
            },
            {
              label: 'Editar',
              onClick: () => handleEditClick(distribucion),
              icon: 'edit',
              disabled: distribucion.letras?.length > 0,
            },
            {
              label: 'Eliminar',
              onClick: () => handleDeleteClick(distribucion),
              icon: 'delete',
              className: 'text-red-600',
              disabled: distribucion.letras?.length > 0,
            },
          ];
          
          return <BotonAcciones options={options} />;
        },
      })
    );
  }
  
  const table = useReactTable({
    data: distribuciones,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  
  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.column.getCanSort() ? (
                      <div className="flex items-center space-x-1">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        <span>
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted()] || ' '}
                        </span>
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay distribuciones disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      <div className="py-3 flex items-center justify-between">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex gap-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> de <span className="font-medium">{table.getPageCount()}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              {"<<"}
            </button>
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {"<"}
            </button>
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {">"}
            </button>
            <button
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              {">>"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Modales */}
      <ModalConfirmacion
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar distribución"
        message="¿Estás seguro que deseas eliminar esta distribución?"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
      
      <ModalFormDistribucion
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        distribucionActual={selectedDistribucion}
        onSubmitSuccess={fetchDistribuciones}
      />
    </>
  );
};

export default TablaDistribuciones; 