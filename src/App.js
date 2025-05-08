import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import store from './store';
import { Provider } from 'react-redux';

import Error404 from 'containers/errors/Error404';
import Login from 'containers/pages/Login'
import Calendar from 'containers/pages/Calendar'
import RegistroLetras from 'containers/pages/RegistroLetras'
import RegistroPedido from 'containers/pages/RegistroPedidos'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path='*' element={<Error404 />} />
          <Route path='/' element={<Login />} />
          <Route path='/calendar' element={<Calendar />} />
          <Route path='/registro-letras' element={<RegistroLetras />} />
          <Route path='/registro-pedido' element={<RegistroPedido />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;