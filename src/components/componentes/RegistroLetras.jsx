const getEventStyle = (event) => {
  const baseStyle = {
    padding: '2px 4px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    width: '100%',
    transition: 'all 0.2s ease-in-out'
  };

  switch (event.estado) {
    case 'pendiente':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(234, 179, 8, 0.1)', // warning/10
        color: 'rgb(234, 179, 8)', // warning
        border: '1px solid rgba(234, 179, 8, 0.2)',
        '&:hover': {
          backgroundColor: 'rgba(234, 179, 8, 0.2)',
          transform: 'scale(1.02)'
        }
      };
    case 'pagado':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(34, 197, 94, 0.1)', // success/10
        color: 'rgb(34, 197, 94)', // success
        border: '1px solid rgba(34, 197, 94, 0.2)',
        '&:hover': {
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          transform: 'scale(1.02)'
        }
      };
    case 'atrasado':
      return {
        ...baseStyle,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // error/10
        color: 'rgb(239, 68, 68)', // error
        border: '1px solid rgba(239, 68, 68, 0.2)',
        '&:hover': {
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          transform: 'scale(1.02)'
        }
      };
    default:
      return {
        ...baseStyle,
        backgroundColor: 'rgba(156, 163, 175, 0.1)', // gray-400/10
        color: 'rgb(156, 163, 175)', // gray-400
        border: '1px solid rgba(156, 163, 175, 0.2)',
        '&:hover': {
          backgroundColor: 'rgba(156, 163, 175, 0.2)',
          transform: 'scale(1.02)'
        }
      };
  }
};

return (
  <div className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)]">
    <Calendar
      localizer={localizer}
      events={eventos}
      startAccessor="start"
      endAccessor="end"
      style={{ height: '100%' }}
      eventPropGetter={getEventStyle}
      components={{
        event: EventoCalendario,
        toolbar: ToolbarCalendario
      }}
      views={['month', 'week', 'day']}
      defaultView="month"
      className="bg-bg-card-light dark:bg-bg-card-dark rounded-lg shadow-lg border border-border-light dark:border-border-dark"
    />
  </div>
); 