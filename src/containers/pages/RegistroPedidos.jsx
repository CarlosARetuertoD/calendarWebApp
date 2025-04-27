import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from "components/navigation/Navbar"
import Layout from "hocs/layouts/Layout"
import RegistroPedido from 'components/calendar/RegistroPedido';
 
function RegistroPedidos(){
    return(
        <Layout>
            <div className="p-6">
                <Navbar/>
            </div>
            <div className="p-6 pt-10">
                <RegistroPedido/>
            </div>
        </Layout>
    )
}
export default RegistroPedidos