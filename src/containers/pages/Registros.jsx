import Navbar from "components/navigation/Navbar"
import Layout from "hocs/layouts/Layout"
import RegistroEntidad from "components/calendar/RegistroEntidad";

function Registros(){
    return(
        <Layout>
            <Navbar />
            <div className="py-2 px-1 sm:px-3 md:px-6 bg-bg-main-light dark:bg-bg-main-dark min-h-screen mt-[120px] md:mt-[130px]">
                <div className="max-w-7xl mx-auto">
                    <RegistroEntidad />
                </div>
            </div>
        </Layout>
    )
}
export default Registros

