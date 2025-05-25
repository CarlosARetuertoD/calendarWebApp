import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventCardModal from '../modales/EventCardModal';
import NuevaLetraModal from '../modales/NuevaLetraModal';
import RegistroToolbar from '../navigation/RegistroToolbar';
import RegistroSidebar from '../navigation/RegistroSidebar';
import 'dayjs/locale/es';
import { dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import axios from 'axios';

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);
dayjs.locale('es');
const localizer = dayjsLocalizer(dayjs);

const feriados = [
  '2025-01-01', '2025-04-17', '2025-04-18', '2025-05-01',
  '2025-06-29', '2025-07-28', '2025-07-29', '2025-08-30',
  '2025-10-08', '2025-11-01', '2025-12-08', '2025-12-25'
];

const esDiaNoValido = (date) => {
  const fechaStr = dayjs(date).format('YYYY-MM-DD');
  return date.getDay() === 0 || date.getDay() === 6 || feriados.includes(fechaStr);
};

const RegistroLetras = () => {
  const [eventos, setEventos] = useState([]);
  const [distribuciones, setDistribuciones] = useState([]);
  const [distribucionSeleccionada, setDistribucionSeleccionada] = useState(null);
  const [eventosDelDia, setEventosDelDia] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [limiteDiario, setLimiteDiario] = useState(5000);
  const [formulario, setFormulario] = useState({ monto: '' });
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState([]);
  const [nuevoLimite, setNuevoLimite] = useState(limiteDiario);

  useEffect(() => {
    axios.get("/api/letras/")
      .then((res) => {
        const letrasFormateadas = res.data.map((letra, index) => {
          const proveedor = letra.pedido?.split(' ')[0] || 'SinProveedor';
          const fecha = new Date(`${letra.fecha_pago}T12:00:00`);

          return {
            title: `${proveedor} - S/${letra.monto} (${letra.empresa} - ${letra.distribucion})`,
            start: fecha,
            end: fecha,
            allDay: true,
            resource: {
              numero: `${index + 1}`,
              monto: parseFloat(letra.monto),
              proveedor: proveedor,
              tipo: "Letra",
              estado: letra.estado,
              color: letra.color || '#555'
            }
          };
        });

        setEventos(letrasFormateadas);
      })
      .catch((err) => {
        console.error("Error al cargar letras:", err);
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });

    axios.get("/api/distribuciones/no-asignadas/")
      .then((res) => {
        setDistribuciones(res.data);
      })
      .catch((err) => {
        console.error("Error al cargar distribuciones:", err);
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });
  }, []);

  const registrarLetrasMultiples = () => {
    if (!distribucionSeleccionada || !formulario.monto || fechasSeleccionadas.length === 0) return;

    const payload = fechasSeleccionadas.map((fecha) => ({
      monto: parseFloat(formulario.monto),
      fecha_pago: dayjs(fecha).format('YYYY-MM-DD'),
      distribucion: distribucionSeleccionada.id,
      empresa: distribucionSeleccionada.empresa,
    }));

    axios.post("/api/letras/bulk_create/", payload)
      .then(() => window.location.reload())
      .catch((err) => {
        console.error("Error al registrar letras:", err);
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      });
  };

  const reiniciarFormulario = () => {
    setFormulario({ monto: '' });
    setFechasSeleccionadas([]);
    setMostrarFormulario(false);
  };

  const handleSelectSlot = (slotInfo) => {
    const fecha = slotInfo.start;
    if (esDiaNoValido(fecha)) {
      alert("No se puede registrar letras en sábados, domingos o feriados.");
      return;
    }

    const existe = fechasSeleccionadas.find(f => f.toDateString() === fecha.toDateString());
    setFechasSeleccionadas(existe
      ? fechasSeleccionadas.filter(f => f.toDateString() !== fecha.toDateString())
      : [...fechasSeleccionadas, fecha]
    );
  };

  const handleSelectEvent = (evento) => {
    const fecha = new Date(evento.start).toDateString();
    const filtrados = eventos.filter(e => new Date(e.start).toDateString() === fecha);
    setEventosDelDia(filtrados);
    setFechaSeleccionada(new Date(evento.start));
  };

  const eventPropGetter = (event) => {
    const beneficiario = event.resource?.beneficiario;
    let className = 'bg-blue-600 text-white rounded px-1 py-1.5 border-none';

    if (beneficiario === 'Pionier') className = 'bg-blue-600 text-white rounded px-1 py-1.5 border-none';
    else if (beneficiario === 'Wrangler') className = 'bg-orange-500 text-white rounded px-1 py-1.5 border-none';
    else if (beneficiario === 'Norton') className = 'bg-green-600 text-white rounded px-1 py-1.5 border-none';
    else if (beneficiario === 'Vowh') className = 'bg-purple-600 text-white rounded px-1 py-1.5 border-none';
    else if (beneficiario === 'Metal') className = 'bg-yellow-500 text-white rounded px-1 py-1.5 border-none';
    else if (beneficiario === 'Préstamo') className = 'bg-red-600 text-white rounded px-1 py-1.5 border-none';

    return { className };
  };

  const obtenerMontosPorDia = () => {
    const totales = {};
    eventos.forEach(ev => {
      const dia = new Date(ev.start).toDateString();
      totales[dia] = (totales[dia] || 0) + (ev.resource?.monto || 0);
    });
    return totales;
  };

  const dayPropGetter = (date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const isFeriado = feriados.includes(dateStr);
    const montos = obtenerMontosPorDia();
    const total = montos[date.toDateString()] || 0;

    let className = 'bg-gray-700';

    if (isFeriado) {
      className = 'bg-gray-500';
    } else if (total > limiteDiario) {
      className = 'bg-red-400';
    } else if (total >= limiteDiario * 0.7) {
      className = 'bg-yellow-400';
    } else if (total > 0) {
      className = 'bg-green-400';
    }

    if (fechasSeleccionadas.some(f => f.toDateString() === date.toDateString())) {
      className = 'bg-purple-600 border-2 border-white';
    }

    return { className };
  };

  return (
    <div className="flex flex-col-reverse md:flex-row w-full min-h-screen">
      <div className="w-full h-[calc(100vh-5rem)] md:w-3/12 bg-gray-800">
        <RegistroSidebar
          nuevoLimite={nuevoLimite}
          setNuevoLimite={setNuevoLimite}
          actualizarLimite={() => {
            const valor = parseInt(nuevoLimite);
            if (!isNaN(valor) && valor > 0) setLimiteDiario(valor);
          }}
          distribuciones={distribuciones}
          distribucionSeleccionada={distribucionSeleccionada}
          setDistribucionSeleccionada={setDistribucionSeleccionada}
          fechasSeleccionadas={fechasSeleccionadas}
          setMostrarFormulario={setMostrarFormulario}
        />
      </div>

      <div className="w-full md:w-9/12 bg-gray-100 dark:bg-gray-900">
        <div className="h-[calc(100vh-5rem)]">
          <Calendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            selectable
            popup
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onDrillDown={() => null}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            components={{ toolbar: RegistroToolbar }}
            className="[&_.rbc-calendar]:bg-calendar-month-bg-light dark:[&_.rbc-calendar]:bg-calendar-month-bg-dark
                      [&_.rbc-toolbar]:bg-calendar-toolbar-bg-light dark:[&_.rbc-toolbar]:bg-calendar-toolbar-bg-dark
                      [&_.rbc-toolbar]:text-calendar-toolbar-text-light dark:[&_.rbc-toolbar]:text-calendar-toolbar-text-dark
                      [&_.rbc-toolbar]:border-calendar-toolbar-border-light dark:[&_.rbc-toolbar]:border-calendar-toolbar-border-dark
                      
                      [&_.rbc-header]:bg-calendar-header-bg-light dark:[&_.rbc-header]:bg-calendar-header-bg-dark
                      [&_.rbc-header]:text-calendar-header-text-light dark:[&_.rbc-header]:text-calendar-header-text-dark
                      [&_.rbc-header]:border-calendar-header-border-light dark:[&_.rbc-header]:border-calendar-header-border-dark
                      
                      [&_.rbc-month-view]:border-calendar-month-border-light dark:[&_.rbc-month-view]:border-calendar-month-border-dark
                      
                      [&_.rbc-day-bg]:bg-calendar-day-bg-light dark:[&_.rbc-day-bg]:bg-calendar-day-bg-dark
                      [&_.rbc-day-bg]:text-calendar-day-text-light dark:[&_.rbc-day-bg]:text-calendar-day-text-dark
                      [&_.rbc-day-bg]:border-calendar-day-border-light dark:[&_.rbc-day-bg]:border-calendar-day-border-dark
                      
                      [&_.rbc-today]:bg-calendar-today-bg-light dark:[&_.rbc-today]:bg-calendar-today-bg-dark
                      [&_.rbc-today]:text-calendar-today-text-light dark:[&_.rbc-today]:text-calendar-today-text-dark
                      
                      [&_.rbc-off-range-bg]:bg-calendar-offrange-bg-light dark:[&_.rbc-off-range-bg]:bg-calendar-offrange-bg-dark
                      [&_.rbc-off-range-bg]:text-calendar-offrange-text-light dark:[&_.rbc-off-range-bg]:text-calendar-offrange-text-dark
                      
                      [&_.rbc-event]:bg-calendar-event-bg-light dark:[&_.rbc-event]:bg-calendar-event-bg-dark
                      [&_.rbc-event]:text-calendar-event-text-light dark:[&_.rbc-event]:text-calendar-event-text-dark
                      
                      [&_.rbc-overlay]:bg-calendar-overlay-bg-light dark:[&_.rbc-overlay]:bg-calendar-overlay-bg-dark
                      [&_.rbc-overlay]:text-calendar-overlay-text-light dark:[&_.rbc-overlay]:text-calendar-overlay-text-dark
                      [&_.rbc-overlay]:border-calendar-overlay-border-light dark:[&_.rbc-overlay]:border-calendar-overlay-border-dark
                      
                      [&_.rbc-current-time-indicator]:bg-calendar-time-indicator-light dark:[&_.rbc-current-time-indicator]:bg-calendar-time-indicator-dark
                      
                      [&_.rbc-selected]:bg-calendar-selection-bg-light dark:[&_.rbc-selected]:bg-calendar-selection-bg-dark
                      [&_.rbc-selected]:text-calendar-selection-text-light dark:[&_.rbc-selected]:text-calendar-selection-text-dark"
          />
        </div>
      </div>

      {mostrarFormulario && (
        <NuevaLetraModal
          fechas={fechasSeleccionadas}
          form={formulario}
          onChange={(e) => setFormulario({ ...formulario, [e.target.name]: e.target.value })}
          onSave={registrarLetrasMultiples}
          onClose={reiniciarFormulario}
        />
      )}

      <EventCardModal
        eventos={eventosDelDia}
        fecha={fechaSeleccionada}
        onClose={() => {
          setEventosDelDia([]);
          setFechaSeleccionada(null);
        }}
      />
    </div>
  );
};

export default RegistroLetras;