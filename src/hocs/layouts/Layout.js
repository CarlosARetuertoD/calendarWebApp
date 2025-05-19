import { connect } from "react-redux"
import Navbar from "../../components/navigation/Navbar"

function Layout({children, noPadding = false}){
    return (
        <div className="min-h-screen bg-bg-main-light dark:bg-bg-main-dark">
            <Navbar />
            <main className="pt-4 pb-8 px-4 sm:px-6 lg:px-8 max-w-[2000px] mx-auto">
                {children}
            </main>
        </div>
    )
}

const mapStateToProps = state =>({

})

export default connect(mapStateToProps,{

}) (Layout)