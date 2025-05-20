import React from 'react';
import dayjs from 'dayjs';
const EventCardModal = ({ eventos = [], fecha, onClose }) => {
  if (!eventos || eventos.length === 0) return null;

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
          📅 Letras/Pagos del {dayjs(fecha).format('DD/MM/YYYY')}
        </h2>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {eventos.map((evento, i) => {
            const { title, resource } = evento;
            const [codigo, montoParte] = title.split(' - ');

            return (
              <div
                key={i}
                className="border rounded-lg p-4 bg-gray-50 shadow-sm"
              >
                <p><strong>ID:</strong> {codigo}</p>
                <p><strong>Monto:</strong> {montoParte}</p>
                <p><strong>Beneficiario:</strong> {resource?.beneficiario}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventCardModal;