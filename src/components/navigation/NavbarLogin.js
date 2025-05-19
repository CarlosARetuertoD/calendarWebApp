import {connect} from 'react-redux'
import { Link } from 'react-router-dom'
import { Typewriter } from 'react-simple-typewriter'

function Navbar(){
  return(
    <nav className='w-full py-6 top-0 fixed z-[9999]'>
      <div className="px-4 sm:px-6">
        <div className="flex items-center">
          <Link to='/' className="text-4xl font-bold tracking-tight text-login-text">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-login-text">
              <Typewriter
                words={['REDEL']}
                loop={0}
                cursor
                cursorStyle='•'
                typeSpeed={200}
                deleteSpeed={200}
                delaySpeed={3000}
              />
            </h1>
          </Link>
        </div>
      </div>
    </nav>
  )
}

const mapStateToProps=state=>({

})

export default connect(mapStateToProps, {

})(Navbar)