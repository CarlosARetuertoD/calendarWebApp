import { connect } from "react-redux"

function Layout({children}){
    return (
        <div>
            <main>
                {children}
            </main>
        </div>
    )
}

const mapStateToProps = state =>({

})

export default connect(mapStateToProps,{

}) (Layout)