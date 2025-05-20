import React, { useState } from 'react';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EventCardModal from '../modales/EventCardModal';
import CustomToolbar from '../navigation/CustomToolbar'; 
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

const BigCalendar = ({ eventos = [], altura = 900 }) => {
  const [eventosDelDia, setEventosDelDia] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);

  const handleSelectEvent = (eventoClickeado) => {
    const fecha = new Date(eventoClickeado.start).toDateString();
    const filtrados = eventos.filter(e =>
      new Date(e.start).toDateString() === fecha
    );
    setEventosDelDia(filtrados);
    setFechaSeleccionada(fecha);
  };

  const eventPropGetter = (event) => {
    const beneficiario = event.resource?.beneficiario;
    let backgroundColor = '#555';

    if (beneficiario === 'Pionier') backgroundColor = '#1976d2';
    else if (beneficiario === 'Wrangler') backgroundColor = '#ff9800';
    else if (beneficiario === 'Norton') backgroundColor = '#43a047';
    else if (beneficiario === 'Vowh') backgroundColor = '#8e24aa';
    else if (beneficiario === 'Metal') backgroundColor = '#fdd835';
    else if (beneficiario === 'Préstamo') backgroundColor = '#d81b60';

    return {
      style: {
        backgroundColor,
        color: 'white',
        borderRadius: '4px',
        padding: '6px 4px'
      }
    };
  };

  return (
    <>
      <div style={{ height: altura }}>
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