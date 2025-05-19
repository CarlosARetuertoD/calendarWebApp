import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventCardModal from '../tools/EventCardModal';
import NuevaLetraModal from '../tools/NuevaLetraModal';
import RegistroToolbar from '../tools/RegistroToolbar';
import RegistroSidebar from '../tools/RegistroSidebar';
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
    const color = event.resource?.color || '#555';
    return {
      style: {
        backgroundColor: color,
        color: 'white',
        borderRadius: '4px',
        padding: '6px 4px'
      }
    };
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

    const base = '#3b4656', verde = '#34d399', amarillo = '#d4c750', rojo = '#f87171', sel = '#7c3aed', feriado = '#80858B';
    let style = { backgroundColor: base };

    if (isFeriado) style.backgroundColor = feriado;
    else if (total > limiteDiario) style.backgroundColor = rojo;
    else if (total >= limiteDiario * 0.7) style.backgroundColor = amarillo;
    else if (total > 0) style.backgroundColor = verde;

    if (fechasSeleccionadas.some(f => f.toDateString() === date.toDateString())) {
      style.backgroundColor = sel;
      style.border = '2px solid white';
    }

    return { style };
  };

  return (
    <div className="flex flex-col-reverse md:flex-row w-full min-h-screen">
      <div className="w-full h-[calc(100vh-5rem)] md:w-3/12" style={{ backgroundColor: '#232227' }}>
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

      <div className="w-full md:w-9/12">
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