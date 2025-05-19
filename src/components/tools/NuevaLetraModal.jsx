import React from 'react';
import dayjs from 'dayjs';

const NuevaLetraModal = ({ fechas = [], form, onChange, onSave, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ×
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-800">
          📝 Registrar nuevas letras
        </h2>

        {/* Mostrar fechas seleccionadas */}
        {fechas.length > 0 && (
          <div className="bg-gray-100 p-3 rounded text-sm text-gray-700 mb-4">
            <p className="font-medium mb-1">📆 Fechas seleccionadas:</p>
            <ul className="list-disc list-inside space-y-1">
              {fechas.map((f, i) => (
                <li key={i}>{dayjs(f).format('DD/MM/YYYY')}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Campo para ingresar el monto que se repetirá */}
        <div className="space-y-3">
          <input
            type="number"
            name="monto"
            placeholder="Monto por letra"
            value={form.monto}
            onChange={onChange}
            className="w-full border p-2 rounded"
          />

          <button
            onClick={onSave}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-500"
          >
            Guardar {fechas.length} letra{fechas.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevaLetraModal;
