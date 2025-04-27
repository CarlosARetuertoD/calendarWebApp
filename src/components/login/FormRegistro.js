import React, { useState } from 'react';

const RegistroLetra = ({ onAddLetra }) => {
  const [form, setForm] = useState({
    beneficiario: '',
    numero: '',
    monto: '',
    fecha: '',
    tipo: 'Letra',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.beneficiario || !form.numero || !form.monto || !form.fecha) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Construye el objeto de evento
    const nuevaLetra = {
      title: `${form.numero} - S/ ${form.monto}`,
      start: form.fecha,
      end: form.fecha,
      allDay: true,
      resource: {
        beneficiario: form.beneficiario,
        tipo: form.tipo,
      },
    };

    onAddLetra(nuevaLetra);

    setForm({
      beneficiario: '',
      numero: '',
      monto: '',
      fecha: '',
      tipo: 'Letra',
    });
  };

  return (
    <form onSubmit={handleSubmit}
      className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4"
    >
      <h2 className="text-xl font-bold text-gray-800 text-center">Registro de nueva letra</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Beneficiario</label>
        <select
          name="beneficiario"
          value={form.beneficiario}
          onChange={handleChange}
          required
          className="mt-1 w-full rounded border-gray-300 p-2"
        >
          <option value="">Selecciona</option>
          <option value="Pionier">Pionier</option>
          <option value="Wrangler">Wrangler</option>
          <option value="Norton">Norton</option>
          <option value="Vowh">Vowh</option>
          <option value="Metal">Metal</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Número único</label>
        <input
          type="number"
          name="numero"
          value={form.numero}
          onChange={handleChange}
          className="mt-1 w-full rounded border-gray-300 p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Monto</label>
        <input
          type="number"
          name="monto"
          value={form.monto}
          onChange={handleChange}
          className="mt-1 w-full rounded border-gray-300 p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Fecha de pago</label>
        <input
          type="date"
          name="fecha"
          value={form.fecha}
          onChange={handleChange}
          className="mt-1 w-full rounded border-gray-300 p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tipo</label>
        <select
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          className="mt-1 w-full rounded border-gray-300 p-2"
        >
          <option value="Letra">Letra</option>
          <option value="Préstamo">Préstamo</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-gray-900 hover:bg-gray-500 text-white py-2 rounded"
      >
        Registrar letra
      </button>
    </form>
  );
};

export default RegistroLetra;
