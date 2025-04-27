import React, { useState } from 'react';
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

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);
dayjs.locale('es');
const localizer = dayjsLocalizer(dayjs);

// Feriados Perú 2025
const feriados = [
  '2025-01-01', '2025-04-17', '2025-04-18', '2025-05-01',
  '2025-06-29', '2025-07-28', '2025-07-29', '2025-08-30',
  '2025-10-08', '2025-11-01', '2025-12-08', '2025-12-25'
];

const esDiaNoValido = (date) => {
  const dia = date.getDay(); // 0 domingo, 6 sábado
  const fechaStr = dayjs(date).format('YYYY-MM-DD');
  return dia === 0 || dia === 6 || feriados.includes(fechaStr);
};

const RegistroLetras = ({ eventos: eventosExternos = [] }) => {
  const [eventos, setEventos] = useState(eventosExternos);
  const [eventosDelDia, setEventosDelDia] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [limiteDiario, setLimiteDiario] = useState(5000);
  const [formulario, setFormulario] = useState({ monto: '', beneficiario: '', numero: '' });
  const [fechasSeleccionadas, setFechasSeleccionadas] = useState([]);
  const [configuracionLetra, setConfiguracionLetra] = useState(null);
  const [nuevoLimite, setNuevoLimite] = useState(limiteDiario);
  const [modoMultiple, setModoMultiple] = useState(false);
  const [beneficiarioSeleccionado, setBeneficiarioSeleccionado] = useState('');

  const calcularFechasAutomaticas = (inicio = new Date(), total) => {
    const frecuencia = configuracionLetra?.frecuenciaDias || 1;
    const fechas = [];
    let fecha = new Date(inicio);

    while (fechas.length < total) {
      if (!esDiaNoValido(fecha)) fechas.push(new Date(fecha));
      fecha.setDate(fecha.getDate() + frecuencia);
    }

    return fechas;
  };

  const registrarLetrasMultiples = () => {
    const {
      montoTotal,
      modoDivision,
      numeroLetras,
      montoPorLetra,
    } = configuracionLetra;

    let letras = [];

    if (modoDivision === 'porNumero') {
      const base = parseFloat((montoTotal / numeroLetras).toFixed(2));
      const ultima = parseFloat((montoTotal - base * (numeroLetras - 1)).toFixed(2));
      letras = Array.from({ length: numeroLetras }, (_, i) => (i === numeroLetras - 1 ? ultima : base));
    } else {
      const cantidad = Math.floor(montoTotal / montoPorLetra);
      const restante = parseFloat((montoTotal - montoPorLetra * cantidad).toFixed(2));
      letras = Array.from({ length: cantidad }, () => montoPorLetra);
      if (restante > 0) letras.push(restante);
    }

    const fechas = calcularFechasAutomaticas(new Date(), letras.length);
    const nuevas = letras.map((monto, i) => ({
      title: `${beneficiarioSeleccionado} - S/${monto}`,
      start: fechas[i],
      end: fechas[i],
      allDay: true,
      resource: {
        numero: `AUTO-${i + 1}`,
        monto,
        beneficiario: beneficiarioSeleccionado,
        tipo: 'Letra'
      }
    }));

    setEventos(prev => [...prev, ...nuevas]);
    reiniciarFormulario();
  };

  const agregarLetra = () => {
    if (modoMultiple && configuracionLetra) {
      registrarLetrasMultiples();
      return;
    }

    if (!formulario.numero || !formulario.monto || !formulario.beneficiario || fechasSeleccionadas.length === 0) return;

    const nuevas = fechasSeleccionadas.map((fecha, index) => ({
      title: `${formulario.beneficiario} - S/${formulario.monto}`,
      start: fecha,
      end: fecha,
      allDay: true,
      resource: {
        numero: `${formulario.numero}-${index + 1}`,
        monto: Number(formulario.monto),
        beneficiario: formulario.beneficiario,
        tipo: 'Letra'
      }
    }));

    setEventos(prev => [...prev, ...nuevas]);
    reiniciarFormulario();
  };

  const reiniciarFormulario = () => {
    setFormulario({ monto: '', beneficiario: '', numero: '' });
    setFechasSeleccionadas([]);
    setMostrarFormulario(false);
    setConfiguracionLetra(null);
  };

  const handleSelectSlot = (slotInfo) => {
    const fecha = slotInfo.start;
    if (esDiaNoValido(fecha)) {
      alert("No se puede registrar letras en sábados, domingos o feriados.");
      return;
    }

    if (!modoMultiple) {
      setFechasSeleccionadas([fecha]);
      setMostrarFormulario(true);
    } else {
      const existe = fechasSeleccionadas.find(f => f.toDateString() === fecha.toDateString());
      setFechasSeleccionadas(existe
        ? fechasSeleccionadas.filter(f => f.toDateString() !== fecha.toDateString())
        : [...fechasSeleccionadas, fecha]
      );
    }
  };

  const handleSelectEvent = (evento) => {
    const fecha = new Date(evento.start).toDateString();
    const filtrados = eventos.filter(e => new Date(e.start).toDateString() === fecha);
    setEventosDelDia(filtrados);
    setFechaSeleccionada(new Date(evento.start));
  };

  const eventPropGetter = (event) => {
    const color = {
      'Pionier': '#1976d2',
      'Wrangler': '#ff9800',
      'Norton': '#43a047',
      'Vowh': '#8e24aa',
      'Metal': '#fdd835',
      'Préstamo': '#d81b60',
      'Deuda Programada': '#6366f1'
    }[event.resource?.beneficiario] || '#555';

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
    const dia = date.getDay();

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
          modoMultiple={modoMultiple}
          setModoMultiple={setModoMultiple}
          setConfiguracionLetra={setConfiguracionLetra}
          setMostrarFormulario={setMostrarFormulario}
          fechasSeleccionadas={fechasSeleccionadas}
          beneficiarioSeleccionado={beneficiarioSeleccionado}
          setBeneficiarioSeleccionado={setBeneficiarioSeleccionado}
          registrarDeuda={agregarLetra}
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
          onSave={agregarLetra}
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
