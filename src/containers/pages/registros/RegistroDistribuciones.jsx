import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from "../../../components/navigation/Navbar"
import Layout from "../../../hocs/layouts/Layout"
import RegistroDistribuciones from '../../../components/componentes/RegistroDistribuciones';

function PaginaRegistroDistribuciones(){
    return(
        <Layout>
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <RegistroDistribuciones/>
            </div>
        </Layout>
    )
}
export default PaginaRegistroDistribuciones 