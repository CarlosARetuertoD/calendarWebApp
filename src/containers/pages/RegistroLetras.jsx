import Navbar from "components/navigation/Navbar"
import RegistroLetra from "components/calendar/RegistroLetras"
import Layout from "hocs/layouts/Layout"

  
function RegistroLetras(){
    return(
        <Layout>
            <div className="p-6">
                <Navbar/>
            </div>
            <div className="p-6">
                <RegistroLetra 
                />
            </div>
        </Layout>
    )
}
export default RegistroLetras