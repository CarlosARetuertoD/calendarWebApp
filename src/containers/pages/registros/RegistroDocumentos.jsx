import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from "components/navigation/Navbar"
import Layout from "hocs/layouts/Layout"
import RegistroDocumentos from 'components/componentes/RegistroDocumentos';

function PaginaRegistroDocumentos() {
    return (
        <Layout>
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <RegistroDocumentos />
            </div>
        </Layout>
    )
}
export default PaginaRegistroDocumentos