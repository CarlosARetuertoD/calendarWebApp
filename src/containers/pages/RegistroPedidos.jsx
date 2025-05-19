import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from "components/navigation/Navbar"
import Layout from "hocs/layouts/Layout"
import RegistroPedidos from 'components/calendar/RegistroPedidos';

function PaginaRegistroPedidos() {
    return (
        <Layout>
            <Navbar />
            <div className="py-2 px-1 sm:px-3 md:px-6 bg-bg-main-light dark:bg-bg-main-dark min-h-screen mt-[120px] md:mt-[130px]">
                <div className="max-w-7xl mx-auto">
                    <RegistroPedidos />
                </div>
            </div>
        </Layout>
    )
}
export default PaginaRegistroPedidos