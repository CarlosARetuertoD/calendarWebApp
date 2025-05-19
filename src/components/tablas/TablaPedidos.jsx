import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import axios from 'axios';
import { toast } from 'react-toastify';
import BotonAcciones from 'components/botones/BotonAcciones';
import BadgeEstado from 'components/ui/BadgeEstado';
import { formatCurrency, formatPercentage } from 'utils/formatters';
import ModalConfirmacion from 'components/modales/ModalConfirmacion';
import ModalFormPedido from 'components/modales/ModalFormPedido';

const TablaPedidos = ({ pedidos, fetchPedidos }) => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([{ id: 'fecha_pedido', desc: true }]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);

  const handleEditClick = (pedido) => {
    setSelectedPedido(pedido);
    setShowEditModal(true);
  };

  const handleDeleteClick = (pedido) => {
    setSelectedPedido(pedido);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/pedidos/${selectedPedido.id}/`);
      toast.success('Pedido eliminado correctamente');
      fetchPedidos();
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      toast.error('Error al eliminar el pedido');
    } finally {
      setShowDeleteModal(false);
      setSelectedPedido(null);
    }
  };

  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('proveedor_nombre', {
      header: 'Proveedor',
      cell: (info) => {
        const pedido = info.row.original;
        return (
          <div className="font-medium text-gray-700 dark:text-gray-300">
            {pedido.proveedor?.nombre || pedido.proveedor_nombre || 'Sin proveedor'}
          </div>
        );
      },
    }),
    columnHelper.accessor('numero_pedido', {
      header: 'Número',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('monto_total', {
      header: 'Monto Total',
      cell: (info) => formatCurrency(info.getValue()),
    }),
    // Nueva columna para mostrar el monto distribuido
    columnHelper.accessor(row => {
      const totalDistribuido = row.distribuciones_finales?.reduce(
        (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
        0
      ) || 0;
      return totalDistribuido;
    }, {
      id: 'monto_distribuido',
      header: 'Distribuido',
      cell: (info) => {
        const valor = info.getValue();
        const montoTotal = info.row.original.monto_total;
        const porcentaje = montoTotal > 0 ? (valor / parseFloat(montoTotal)) * 100 : 0;
        
        return (
          <div className="flex flex-col">
            <span>{formatCurrency(valor)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatPercentage(porcentaje)}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('fecha_pedido', {
      header: 'Fecha',
      cell: (info) => format(new Date(info.getValue()), 'dd/MM/yyyy'),
    }),
    // Columna estado
    columnHelper.accessor('estado', {
      header: 'Estado',
      cell: ({ row }) => {
        const pedido = row.original;
        const tipoPedido = pedido.tipo_pedido || (pedido.es_contado ? 'Contado' : 'Crédito');
        
        // Obtener clase de color según estado
        let badgeClass = '';
        switch (pedido.estado) {
          case 'pendiente':
            badgeClass = 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100';
            break;
          case 'asignado':
            badgeClass = 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100';
            break;
          case 'completado':
            badgeClass = 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100';
            break;
          case 'cancelado':
            badgeClass = 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100';
            break;
          default:
            badgeClass = 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
        }
        
        // Clase para el tipo de pedido
        const tipoClass = pedido.es_contado 
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        
        return (
          <div className="flex flex-col gap-1">
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
              {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
            </span>
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${tipoClass}`}>
              {tipoPedido}
            </span>
          </div>
        );
      }
    }),
    columnHelper.accessor('porcentaje_pagado', {
      header: 'Pagado',
      cell: (info) => formatPercentage(info.getValue()),
    }),
    columnHelper.accessor('acciones', {
      header: '',
      cell: ({ row }) => {
        const pedido = row.original;
        
        const options = [
          {
            label: 'Ver detalles',
            onClick: () => navigate(`/pedidos/${pedido.id}`),
            icon: 'search',
          },
          {
            label: 'Editar',
            onClick: () => handleEditClick(pedido),
            icon: 'edit',
            disabled: pedido.estado === 'completado',
          },
          {
            label: 'Distribuir',
            onClick: () => navigate('/distribuciones', { 
              state: { 
                pedidoId: pedido.id,
                pedidoInfo: {
                  proveedor: pedido.proveedor?.nombre || pedido.proveedor_nombre || '',
                  fecha: format(new Date(pedido.fecha_pedido), 'dd/MM/yyyy'),
                  montoTotal: parseFloat(pedido.monto_total),
                  montoDisponible: parseFloat(pedido.monto_total) - (pedido.distribuciones_finales?.reduce(
                    (sum, dist) => sum + parseFloat(dist.monto_final || 0), 
                    0
                  ) || 0),
                  esContado: pedido.es_contado
                }
              } 
            }),
            icon: 'distribute',
            disabled: pedido.estado !== 'pendiente',
            show: true
          },
          {
            label: 'Eliminar',
            onClick: () => handleDeleteClick(pedido),
            icon: 'delete',
            className: 'text-red-600',
            disabled: pedido.distribuciones_finales?.length > 0 || pedido.estado === 'completado',
          },
        ];
        
        return <BotonAcciones options={options} />;
      },
    }),
  ];

  const table = useReactTable({
    data: pedidos,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
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
                  No hay pedidos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      <div className="py-3 flex items-center justify-between">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex gap-x-2 items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} a {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} de {table.getFilteredRowModel().rows.length} resultados
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
        title="Eliminar pedido"
        message={`¿Estás seguro que deseas eliminar el pedido de ${selectedPedido?.proveedor_nombre}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <ModalFormPedido
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        pedidoActual={selectedPedido}
        onSubmitSuccess={fetchPedidos}
      />
    </>
  );
};

export default TablaPedidos; 