import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from "components/navigation/Navbar"
import Layout from "hocs/layouts/Layout"
import RegistroDistribuciones from 'components/calendar/RegistroDistribuciones';

function PaginaRegistroDistribuciones(){
    return(
        <Layout>
            <div className="sticky top-0 z-50 bg-bg-main-light dark:bg-bg-main-dark">
                <Navbar/>
            </div>
            <div className="py-2 px-1 sm:px-3 md:px-6 bg-bg-main-light dark:bg-bg-main-dark min-h-screen mt-[120px] md:mt-[130px]">
                <div className="max-w-7xl mx-auto">
                    <RegistroDistribuciones/>
                </div>
            </div>
        </Layout>
    )
}
export default PaginaRegistroDistribuciones 