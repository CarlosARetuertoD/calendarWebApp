// src/components/pedidos/RegistroPedido.js
import React, { useState, useMemo } from 'react';

const RegistroPedido = () => {
  const beneficiarios = ['Pionier', 'Wrangler', 'Norton', 'Vowh', 'Metal', 'Préstamo'];

  // —— Estados generales —————————————————————————
  const [pedidos, setPedidos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);

  // Formularios visibles
  const [showPedidoForm, setShowPedidoForm] = useState(false);
  const [showGuiaForm, setShowGuiaForm] = useState(false);

  // —— Pedido —————————————————————————————————————
  const [nuevoPedido, setNuevoPedido] = useState({
    beneficiario: '',
    montoTotal: '',
    fecha: '',
  });
  const [errorsPedido, setErrorsPedido] = useState({});

  const validarPedido = () => {
    const errs = {};
    if (!nuevoPedido.beneficiario) errs.beneficiario = 'Requerido';
    if (!nuevoPedido.montoTotal || isNaN(nuevoPedido.montoTotal) || nuevoPedido.montoTotal <= 0)
      errs.montoTotal = 'Debe ser un número positivo';
    if (!nuevoPedido.fecha) errs.fecha = 'Requerido';
    setErrorsPedido(errs);
    return Object.keys(errs).length === 0;
  };

  const agregarPedido = () => {
    if (!validarPedido()) return;
    const id = Date.now();
    setPedidos(ps => [
      ...ps,
      {
        id,
        ...nuevoPedido,
        montoTotal: parseFloat(nuevoPedido.montoTotal),
        estado: 'Pendiente',
        guias: []
      }
    ]);
    setSelectedPedidoId(id);
    setNuevoPedido({ beneficiario: '', montoTotal: '', fecha: '' });
    setErrorsPedido({});
    setShowPedidoForm(false);
  };

  const editarPedido = p => {
    setShowPedidoForm(true);
    setNuevoPedido({ beneficiario: p.beneficiario, montoTotal: p.montoTotal, fecha: p.fecha });
    setSelectedPedidoId(p.id);
  };

  const eliminarPedido = id => {
    if (!window.confirm('¿Eliminar este pedido?')) return;
    setPedidos(ps => ps.filter(p => p.id !== id));
    if (selectedPedidoId === id) setSelectedPedidoId(null);
  };

  // —— Guías y facturas —————————————————————————————————
  const [facturasTemp, setFacturasTemp] = useState([]);
  const [facturaTemp, setFacturaTemp] = useState({ numero: '', monto: '' });
  const [editingFacturaIndex, setEditingFacturaIndex] = useState(null);
  const [errorsFacturaTemp, setErrorsFacturaTemp] = useState({});

  const validarFacturaTemp = () => {
    const errs = {};
    if (!facturaTemp.numero) errs.numero = 'Requerido';
    if (!facturaTemp.monto || isNaN(facturaTemp.monto) || facturaTemp.monto <= 0)
      errs.monto = 'Número positivo';
    setErrorsFacturaTemp(errs);
    return Object.keys(errs).length === 0;
  };

  const agregarOEditarFactura = () => {
    if (!validarFacturaTemp()) return;
    if (editingFacturaIndex !== null) {
      setFacturasTemp(ft =>
        ft.map((f, i) => i === editingFacturaIndex ? { ...facturaTemp, monto: parseFloat(facturaTemp.monto) } : f)
      );
    } else {
      setFacturasTemp(ft => [
        ...ft,
        { ...facturaTemp, monto: parseFloat(facturaTemp.monto) }
      ]);
    }
    setEditingFacturaIndex(null);
    setFacturaTemp({ numero: '', monto: '' });
    setErrorsFacturaTemp({});
  };

  const startEditFactura = idx => {
    setEditingFacturaIndex(idx);
    setFacturaTemp(facturasTemp[idx]);
  };

  const deleteFacturaTemp = idx => {
    setFacturasTemp(ft => ft.filter((_, i) => i !== idx));
    if (editingFacturaIndex === idx) {
      setEditingFacturaIndex(null);
      setFacturaTemp({ numero: '', monto: '' });
      setErrorsFacturaTemp({});
    }
  };

  const [nuevaGuia, setNuevaGuia] = useState({ guia: '', fecha: '' });
  const [errorsGuia, setErrorsGuia] = useState({});

  const validarGuia = () => {
    const errs = {};
    if (!nuevaGuia.guia) errs.guia = 'Requerido';
    if (!nuevaGuia.fecha) errs.fecha = 'Requerido';
    if (facturasTemp.length === 0) errs.facturas = 'Agrega al menos una factura';
    setErrorsGuia(errs);
    return Object.keys(errs).length === 0;
  };

  const agregarGuia = () => {
    if (!validarGuia() || !selectedPedidoId) return;
    const totalGuia = facturasTemp.reduce((sum, f) => sum + f.monto, 0);
    const nueva = {
      id: Date.now(),
      guia: nuevaGuia.guia,
      fecha: nuevaGuia.fecha,
      facturas: facturasTemp,
      monto: totalGuia,
    };
    setPedidos(ps =>
      ps.map(p =>
        p.id === selectedPedidoId
          ? { ...p, guias: [...p.guias, nueva] }
          : p
      )
    );
    setNuevaGuia({ guia: '', fecha: '' });
    setFacturasTemp([]);
    setEditingFacturaIndex(null);
    setFacturaTemp({ numero: '', monto: '' });
    setErrorsGuia({});
    setErrorsFacturaTemp({});
    setShowGuiaForm(false);
  };

  const eliminarGuia = id => {
    if (!window.confirm('¿Eliminar esta guía?')) return;
    setPedidos(ps =>
      ps.map(p =>
        p.id === selectedPedidoId
          ? { ...p, guias: p.guias.filter(g => g.id !== id) }
          : p
      )
    );
  };

  const cerrarRegistro = () => {
    if (!window.confirm('¿Marcar este pedido como completado?')) return;
    setPedidos(ps =>
      ps.map(p =>
        p.id === selectedPedidoId
          ? { ...p, estado: 'Completado' }
          : p
      )
    );
  };

  // —— Filtrado y selección ————————————————————————  
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => {
      if (estadoFilter !== 'todos' && p.estado !== estadoFilter) return false;
      return p.beneficiario.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [pedidos, searchTerm, estadoFilter]);

  const pedidoSeleccionado = pedidos.find(p => p.id === selectedPedidoId) || null;
  const totalGuias = pedidoSeleccionado?.guias.length || 0;
  const sumaGuias = pedidoSeleccionado?.guias?.reduce((s, g) => s + g.monto, 0) || 0;
  const balance = pedidoSeleccionado? pedidoSeleccionado.montoTotal - sumaGuias : 0;
  const progreso = pedidoSeleccionado? Math.min(100, Math.round((sumaGuias / pedidoSeleccionado.montoTotal) * 100)) : 0;

  return (
    <div className="space-y-4 bg-[#232227] text-white p-6 min-h-screen">
      {/* Botones de acción Agregar Pedido*/}
      <div className="flex gap-2">
        <button
          className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded"
          onClick={() => setShowPedidoForm(v => !v)}
        >
          + Agregar Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IZQUIERDA: formulario de pedido y listado */}
        <div className="space-y-4">
          {showPedidoForm && (
            <div className="p-4 bg-[#232227] rounded space-y-2">
              <h2 className="font-semibold">➕ Nuevo Pedido</h2>
              <label className="block text-sm">Beneficiario</label>
              <select
                className="w-full px-2 py-1 rounded bg-gray-700"
                value={nuevoPedido.beneficiario}
                onChange={e =>
                  setNuevoPedido({ ...nuevoPedido, beneficiario: e.target.value })
                }
              >
                <option value="" disabled>-- Seleccionar --</option>
                {beneficiarios.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errorsPedido.beneficiario && (
                <p className="text-red-400 text-xs">{errorsPedido.beneficiario}</p>
              )}

              <label className="block text-sm">Monto total</label>
              <input
                type="number"
                className="w-full px-2 py-1 rounded bg-gray-700"
                value={nuevoPedido.montoTotal}
                onChange={e =>
                  setNuevoPedido({ ...nuevoPedido, montoTotal: e.target.value })
                }
              />
              {errorsPedido.montoTotal && (
                <p className="text-red-400 text-xs">{errorsPedido.montoTotal}</p>
              )}

              <label className="block text-sm">Fecha pedido</label>
              <input
                type="date"
                className="w-full px-2 py-1 rounded bg-gray-700"
                value={nuevoPedido.fecha}
                onChange={e =>
                  setNuevoPedido({ ...nuevoPedido, fecha: e.target.value })
                }
              />
              {errorsPedido.fecha && (
                <p className="text-red-400 text-xs">{errorsPedido.fecha}</p>
              )}

              <button
                className="w-full bg-blue-600 hover:bg-blue-500 py-1 rounded"
                onClick={agregarPedido}
              >
                Crear y seleccionar
              </button>
            </div>
          )}

          {/* Buscador + filtro */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="🔍 Buscar…"
              className="flex-1 px-2 py-1 rounded bg-gray-800"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select
              className="px-2 py-1 rounded bg-gray-700"
              value={estadoFilter}
              onChange={e => setEstadoFilter(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Completado">Completado</option>
            </select>
          </div>

          {/* Lista de pedidos */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {pedidosFiltrados.map(p => (
              <div
                key={p.id}
                className={`p-3 rounded border flex justify-between items-center cursor-pointer ${
                  selectedPedidoId === p.id ? 'bg-blue-800' : 'bg-gray-800'
                }`}
                onClick={() => setSelectedPedidoId(p.id)}
              >
                <div>
                  <p className="font-semibold">{p.beneficiario}</p>
                  <p className="text-sm">S/ {p.montoTotal.toLocaleString()}</p>
                </div>
                <span
                  className={`w-3 h-3 rounded-full ${
                    p.estado === 'Pendiente'
                      ? 'bg-yellow-400'
                      : p.estado === 'En proceso'
                      ? 'bg-blue-400'
                      : 'bg-green-400'
                  }`}
                />
                <div className="flex space-x-1 ml-4">
                  <button
                    className="text-yellow-400 hover:underline text-xs"
                    onClick={() => editarPedido(p)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-600 hover:underline text-xs"
                    onClick={() => eliminarPedido(p.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DERECHA: resumen y formulario de guías */}
        {pedidoSeleccionado ? (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="p-4 bg-[#232282] rounded space-y-2">
              <h2 className="font-semibold">
                📋 Pedido {pedidoSeleccionado.fecha} – {pedidoSeleccionado.beneficiario}
              </h2>
              <p>Total guías: <strong>{totalGuias}</strong></p>
              <p>Suma facturas: <strong>S/ {sumaGuias.toLocaleString()}</strong></p>
              <p>Balance restante: <strong>S/ {balance.toLocaleString()}</strong></p>
              <div className="w-full bg-gray-700 h-2 rounded">
                <div
                  className="bg-green-500 h-2 rounded"
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{progreso}% completado</p>
              {/* Botones de acción Agregar Guias y Cerrar Guias*/}
              {pedidoSeleccionado && pedidoSeleccionado.estado !== 'Completado' && (
                <>
                    <button
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded"
                    onClick={() => setShowGuiaForm(v => !v)}
                    >
                    + Registrar Guía
                    </button>
                    <button
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                    onClick={cerrarRegistro}
                    >
                    Cerrar Registro
                    </button>
                </>
                )}
            </div>

            {/* Formulario de Guía */}
            {showGuiaForm && (
              <div className="p-4 bg-gray-800 rounded space-y-2">
                <h2 className="font-semibold">➕ Agregar Guía</h2>

                <label className="block text-sm">N° Guía</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 rounded bg-gray-700"
                  value={nuevaGuia.guia}
                  onChange={e => setNuevaGuia({ ...nuevaGuia, guia: e.target.value })}
                />
                {errorsGuia.guia && <p className="text-red-400 text-xs">{errorsGuia.guia}</p>}

                <label className="block text-sm">Fecha guía</label>
                <input
                  type="date"
                  className="w-full px-2 py-1 rounded bg-gray-700"
                  value={nuevaGuia.fecha}
                  onChange={e => setNuevaGuia({ ...nuevaGuia, fecha: e.target.value })}
                />
                {errorsGuia.fecha && <p className="text-red-400 text-xs">{errorsGuia.fecha}</p>}

                {/* Facturas temporales */}
                <div className="space-y-2">
                  <h3 className="font-medium">Facturas</h3>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {facturasTemp.map((f, i) => (
                      <li key={i} className="flex justify-between items-center bg-gray-700 px-2 py-1 rounded">
                        <span>{f.numero} — S/ {f.monto.toFixed(2)}</span>
                        <div className="space-x-1">
                          <button
                            className="text-yellow-400 hover:underline text-xs"
                            onClick={() => startEditFactura(i)}
                          >
                            Editar
                          </button>
                          <button
                            className="text-red-400 hover:underline text-xs"
                            onClick={() => deleteFacturaTemp(i)}
                          >
                            🗑️
                          </button>
                        </div>
                      </li>
                    ))}
                    {facturasTemp.length === 0 && (
                      <li className="text-gray-400 text-sm italic">No hay facturas.</li>
                    )}
                  </ul>
                </div>

                {/* Añadir/Editar factura */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="N° Factura"
                    className="flex-1 px-2 py-1 rounded bg-gray-700"
                    value={facturaTemp.numero}
                    onChange={e => setFacturaTemp({ ...facturaTemp, numero: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Monto"
                    className="w-32 px-2 py-1 rounded bg-gray-700"
                    value={facturaTemp.monto}
                    onChange={e => setFacturaTemp({ ...facturaTemp, monto: e.target.value })}
                  />
                  <button
                    className="px-2 bg-indigo-600 hover:bg-indigo-500 rounded"
                    onClick={agregarOEditarFactura}
                  >
                    {editingFacturaIndex != null ? 'Guardar' : '➕'}
                  </button>
                </div>
                {Object.values(errorsFacturaTemp).map((msg, idx) => (
                  <p key={idx} className="text-red-400 text-xs">{msg}</p>
                ))}

                <button
                  className="w-full bg-blue-600 hover:bg-blue-500 py-1 rounded"
                  onClick={agregarGuia}
                >
                  Registrar Guía
                </button>
              </div>
            )}

            {/* Tabla de Guías */}
            <div className="overflow-x-auto bg-gray-800 rounded shadow">
              <table className="min-w-full text-left text-gray-100">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-2">Guía</th>
                    <th className="px-4 py-2">Facturas</th>
                    <th className="px-4 py-2">Monto total</th>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidoSeleccionado.guias.map(g => (
                    <tr key={g.id} className="border-t border-gray-700">
                      <td className="px-4 py-2">{g.guia}</td>
                      <td className="px-4 py-2">
                        {g.facturas.map((f,i) => (
                          <div key={i}>{f.numero} (S/{f.monto.toFixed(2)})</div>
                        ))}
                      </td>
                      <td className="px-4 py-2">S/ {g.monto.toLocaleString()}</td>
                      <td className="px-4 py-2">{g.fecha}</td>
                      <td className="px-4 py-2">
                        <button
                          className="text-red-400 hover:underline text-xs"
                          onClick={() => eliminarGuia(g.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pedidoSeleccionado.guias.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-gray-400">
                        No hay guías registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 italic">Selecciona un pedido para añadir guías…</p>
        )}
      </div>
    </div>
  );
};

export default RegistroPedido;
