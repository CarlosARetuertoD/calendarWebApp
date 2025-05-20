import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from "components/navigation/Navbar"
import Layout from "hocs/layouts/Layout"
import RegistroPedidos from 'components/componentes/RegistroPedidos';

function PaginaRegistroPedidos() {
    return (
        <Layout>
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <RegistroPedidos />
            </div>
        </Layout>
    )
}
export default PaginaRegistroPedidos