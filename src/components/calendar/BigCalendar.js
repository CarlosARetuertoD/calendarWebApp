import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventCardModal from '../tools/EventCardModal';
import CustomToolbar from '../tools/CustomToolbar'; 
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

const BigCalendar = ({ eventos = [], altura = 500 }) => {
  const [eventosDelDia, setEventosDelDia] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [actualHeight, setActualHeight] = useState(altura);
  
  // Actualizar la altura cuando cambia la prop
  useEffect(() => {
    setActualHeight(altura);
  }, [altura]);

  const handleSelectEvent = (eventoClickeado) => {
    const fecha = new Date(eventoClickeado.start).toDateString();
    const filtrados = eventos.filter(e =>
      new Date(e.start).toDateString() === fecha
    );
    setEventosDelDia(filtrados);
    setFechaSeleccionada(fecha);
  };

  const eventPropGetter = (event) => {
    const color = event.resource?.color || '#555'; // fallback por si no hay color
    return {
      style: {
        backgroundColor: color,
        color: 'white',
        borderRadius: '4px',
        padding: '6px 4px'
      }
    };
  };

  return (
    <>
      <div style={{ height: actualHeight }} className="transition-all duration-300 ease-in-out">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          views={{ month: true }} // 👈 solo mes
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          popup={true}
          components={{
            toolbar: CustomToolbar // 👈 tu encabezado personalizado
          }}
        />
      </div>

      <EventCardModal
        eventos={eventosDelDia}
        fecha={fechaSeleccionada}
        onClose={() => {
          setEventosDelDia([]);
          setFechaSeleccionada(null);
        }}
      />
    </>
  );
};

export default BigCalendar;
