import Layout from "hocs/layouts/Layout";
import Navbar from "components/navigation/Navbar";
import RegistroLetras from "components/componentes/RegistroLetras";

function PaginaRegistroLetras() {
  return (
    <Layout>
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <RegistroLetras />
      </div>
    </Layout>
  );
}

export default PaginaRegistroLetras;
