import Layout from "hocs/layouts/Layout";
import Navbar from "components/navigation/Navbar";
import RegistroLetras from "components/calendar/RegistroLetras";

function PaginaRegistroLetras() {
  return (
    <Layout>
      <Navbar />
      <div className="py-2 px-1 sm:px-3 md:px-6 bg-bg-main-light dark:bg-bg-main-dark min-h-screen mt-[120px] md:mt-[130px]">
        <div className="max-w-7xl mx-auto">
          <RegistroLetras />
        </div>
      </div>
    </Layout>
  );
}

export default PaginaRegistroLetras;
