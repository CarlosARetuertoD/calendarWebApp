import { connect } from "react-redux"

function Layout({children}){
    return (
        <div>
            <main className="py-2 px-1 sm:px-3 md:px-6 pt-[120px] md:pt-[130px] bg-bg-main-light dark:bg-bg-main-dark">
                {children}
            </main>
        </div>
    )
}

const mapStateToProps = state =>({

})

export default connect(mapStateToProps,{

}) (Layout)