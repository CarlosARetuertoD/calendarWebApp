import {connect} from 'react-redux'
import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import DotLoader from 'react-spinners/DotLoader'
import { Typewriter } from 'react-simple-typewriter'

function Navbar(){
  const[loading,setLoading]=useState(true)
  window.onscroll = function() {scrollFunction()}

  function scrollFunction() {
        if(document.getElementById('navbar-login')){
            if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
                document.getElementById('navbar-login').classList.add('shadow-navbar');
            }else{
                document.getElementById('navbar-login').classList.remove('shadow-navbar');
            }
        }
    }
  return(
    <nav data-scroll data-scroll-id="hey" id='navbar-login' className='w-full py-6 top-0 transition duration-300 ease-in-out z-[9999] fixed'>
      <div className="px-4 sm:px-6">
        <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap md:px-12 px-2">
          <div className="ml-4 mt-2">
           <div className="text-4xl font-bold tracking-tight sm:text-center sm:text-4xl text-white">
                <h1 className="text-2xl font-bold tracking-tight sm:text-center sm:text-4xl text-white">
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
           </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

const mapStateToProps=state=>({

})

export default connect(mapStateToProps, {

})(Navbar)
