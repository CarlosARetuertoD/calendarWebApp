import Navbar from "components/navigation/Navbar"
import Layout from "hocs/layouts/Layout"
import RegistroEntidad from "components/componentes/RegistroEntidad";

function Registros(){
    return(
        <Layout>
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <RegistroEntidad />
            </div>
        </Layout>
    )
}
export default Registros

