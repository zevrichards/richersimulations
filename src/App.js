import logo from './logo.svg';
import './App.css';
import './css/w3-custom.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import React, { useState, useEffect } from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom'

import {auth, firestore} from './config/config.js' //storage, app, analytics
//firebase config
import firebase from 'firebase/compat/app';
import { useAuthState } from 'react-firebase-hooks/auth'
import 'firebase/compat/auth'

import Home from './components/Home';
import { Cart } from './components/Cart';
import { Orders } from './components/Orders';
import { SignIn } from './components/SignIn.js'
import { DataDeletion } from './components/DataDeletion.js'
import { Downloads } from './components/Downloads';
import { FAQ } from './components/FAQ';
import { Register } from './components/Register.js'

//icons
import { FaPaypal, FaCcVisa, FaCcMastercard } from 'react-icons/fa'



const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [user] = useAuthState(auth);
  SignInUser = SignInUser.bind(this);

  // Handle anon -> Google sign-in transitions.
  // Runs whenever the auth state changes. For any non-anonymous user:
  //   1. Ensure a Firestore Users/{uid} doc exists (fixes the server-side
  //      "User not found" error in the Fygaro webhook).
  //   2. If sessionStorage.pendingAnonMerge is set (stashed in SignIn.js
  //      when we couldn't linkWithRedirect because the Google account
  //      already existed), migrate the cart items from the anon UID to
  //      the now-signed-in UID, then clear the flag.
  useEffect(() => {
    async function handleAuthChange() {
      if (!user || user.isAnonymous) return;

      // 1. Upsert user doc (merge:true so we don't clobber name/etc).
      try {
        await firestore.collection('Users').doc(user.uid).set(
          { UID: user.uid, email: user.email || null },
          { merge: true }
        );
      } catch (e) {
        console.error('User doc upsert failed:', e);
      }

      // 2. Migrate anonymous cart if a merge is pending.
      const anonUid = sessionStorage.getItem('pendingAnonMerge');
      if (anonUid && anonUid !== user.uid) {
        sessionStorage.removeItem('pendingAnonMerge');
        try {
          const anonCart = await firestore
            .collection('Users').doc(anonUid).collection('Cart').get();
          if (!anonCart.empty) {
            const batch = firestore.batch();
            anonCart.forEach(doc => {
              batch.set(
                firestore.collection('Users').doc(user.uid)
                  .collection('Cart').doc(doc.id),
                doc.data(),
                { merge: true }
              );
              batch.delete(doc.ref);
            });
            await batch.commit();
          }
        } catch (e) {
          console.error('Anon cart migration failed:', e);
        }
      }
    }
    handleAuthChange();
  }, [user]);

  // const myProps = Object.assign({}, props);
  // delete myProps.computedMatch;

  // Accordion 
function myAccFunc() {
  var x = document.getElementById("demoAcc");
  console.log(x.className)
  if (x.className.indexOf("w3-show") == -1) {
    x.className += " w3-show";
  } else {
    x.className = x.className.replace(" w3-show", "");
  }
  // if (classNameAttr == "w3-show") {
  //   setclassNameAttr("")
  // }

}

// Click on the "products" link on page load to open the accordion for demo purposes
// document.getElementById("myBtn").click();

// Open and close sidebar
function w3_open() {
  document.getElementById("mySidebar").style.display = "block";
  document.getElementById("myOverlay").style.display = "block";
  // if (StyleDisplay != "block") {
    // setStyleDisplay("block");
  // }
}
  
function w3_close() {
  document.getElementById("mySidebar").style.display = "none";
  document.getElementById("myOverlay").style.display = "none";
  // if (StyleDisplay != "none") {
    // setStyleDisplay("none");
  // }
}

  return (

    <ThemeProvider theme={darkTheme}>
      <CssBaseline />

    <div className="App">
      
          {/* <!-- Sidebar/menu --> */}
      <nav className="w3-sidebar w3-bar-block w3-black w3-collapse w3-top" style={{zIndex:3, width:"260px"}} id="mySidebar">
        <div className="w3-container w3-display-container w3-padding-16">
          <i onClick={() => w3_close()} className="fa fa-remove w3-hide-large w3-button w3-display-topright"></i>
          <a href="\"><h3 className="w3-wide"><img width="230px" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/RicherSimulations_whi_1536x85.png?alt=media&token=0fff0772-7cad-4d4f-95f4-e305c37b3b1f"></img></h3></a>
        </div>
        <div className="w3-padding-64 w3-large w3-text-white" style={{weight:"bold"}}>
          <a href="\" className="w3-bar-item w3-button">Home</a>
          {/* <a onClick={() => myAccFunc()} href="#" className="w3-button w3-block w3-white w3-left-align" id="myBtn">
            Products <i className="fa fa-caret-down"></i>
          </a>
          <div id="demoAcc" className="w3-bar-block w3-hide w3-padding-large w3-medium">
            <a href="#" className="w3-bar-item w3-button w3-light-grey"><i className="fa fa-caret-right w3-margin-right"></i>CaribsySky Dominica 2023</a>
            <a href="#" className="w3-bar-item w3-button">CaribSky TBPB 2020</a>
            <a href="#" className="w3-bar-item w3-button">CaribSky St. Vincent 2019</a>
          </div> */}
            {/* <a href="#" className="w3-bar-item w3-button">Downloads</a> */}
            <a href="/#About" className="w3-bar-item w3-button">About</a>
            <a href="FAQ" className="w3-bar-item w3-button">FAQ</a>
            <a href="Downloads" className="w3-bar-item w3-button">Downloads</a>
          </div>
        <a href="mailto:richersimulations@gmail.com" className="w3-bar-item w3-button w3-padding">Contact</a>
      </nav>

      {/* <!-- Top menu on small screens --> */}
      <header className="w3-bar w3-top w3-hide-large w3-black w3-xlarge">
        <div className="w3-bar-item w3-padding-48 w3-wide" style={{height:"60px"}}><a href="\"><img height="50px" src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/RicherSimulations_thumb100.png?alt=media&token=1029b16b-97ca-4ce0-b256-e9f865a998be"></img></a></div>
        {/* <a href="SignIn"><i className="fa fa-user"></i></a>
        &nbsp;
        <a href="Cart"><i className="fa fa-shopping-cart w3-margin-right"></i></a>
        &nbsp;  */}
        <p className="w3-right">
          <a href="#" onClick={() => w3_open()} className="w3-bar-item w3-button w3-padding-24 w3-right" ><i className="fa fa-bars"></i></a>
          <a href="Cart" className="w3-bar-item w3-button w3-padding-24 w3-right" ><i className="fa fa-shopping-cart"></i></a> 
          <a href="SignIn" className="w3-bar-item w3-button w3-padding-24 w3-right" ><i className="fa fa-user"></i></a> 
        </p>
      </header>

      {/* <!-- Overlay effect when opening sidebar on small screens --> */}
      <div className="w3-overlay w3-hide-large" onClick={() => w3_close()} style={{cursor:"pointer"}} title="close side menu" id="myOverlay"></div>

      {/* <!-- !PAGE CONTENT! --> */}
      <div className="w3-main" style={{marginLeft:"260px"}}>

        {/* <!-- Push down content on small screens --> */}
        <div className="w3-hide-large" style={{margintop:"83px"}}></div>

        {/* <!-- Top header --> */}
        <header className="w3-container w3-xlarge">
          {/* <p className="w3-left">Featured Products</p> */}
          <p className="w3-right">
            <a href="SignIn"><i className="fa fa-user"></i></a>
            &nbsp;
            <a href="Cart"><i className="fa fa-shopping-cart w3-margin-right"></i></a>      
          </p>
        </header>

        <br/>
        <br/>

        <section>
          <BrowserRouter>
            <Switch>
              
              
              <Route exact path='/' render={(props) => <Home {...props} user={user} AnonSignIn={SignInUser}/>}/>
              <Route path='/DataDeletion' component={DataDeletion}/> 
              <Route path='/Downloads' component={Downloads}/> 
              <Route path='/FAQ' component={FAQ}/>    
              {/* <Route path='/cart' render={(props) => <Cart {...myProps} user={user} AnonSignIn={SignInUser}/>}/> */}
              <Route exact path='/Cart' render={(props) => <Cart {...props} user={user} AnonSignIn={SignInUser}/>}/>
              <Route exact path='/Orders' render={(props) => <Orders {...props} user={user}/>}/>
              <Route path='/SignIn' render={(props) => <SignIn {...props} user={user}/>}/>
              <Route path='/Register' component={Register}/>
              
            </Switch>
          </BrowserRouter>
        </section> 

        {/* <!-- Subscribe section --> */}
        {/* <div className="w3-container w3-black w3-padding-32">
          <h1>Subscribe</h1>
          <p>To get special offers and VIP treatment:</p>
          <p><input className="w3-input w3-border" type="text" placeholder="Enter e-mail" style={{width:"100%"}}></input></p>
          <button type="button" className="w3-button w3-red w3-margin-bottom">Subscribe</button>
        </div> */}
        
        {/* <!-- Footer --> */}
        <footer className="w3-padding-64 w3-custom-grey w3-small w3-center" id="footer">
          <div className="w3-row-padding">
            {/* <div className="w3-col s4">
              <h4>Contact</h4>
              <p>Questions? Go ahead.</p>
              <form action="/action_page.php" target="_blank">
                <p><input className="w3-input w3-border w3-grey" type="text" placeholder="Name" name="Name" required></input></p>
                <p><input className="w3-input w3-border w3-grey" type="text" placeholder="Email" name="Email" required></input></p>
                <p><input className="w3-input w3-border w3-grey" type="text" placeholder="Subject" name="Subject" required></input></p>
                <p><input className="w3-input w3-border w3-grey" type="text" placeholder="Message" name="Message" required></input></p>
                <button type="submit" className="w3-button w3-block w3-black">Send</button>
              </form>
            </div> */}

            <div className="w3-col s4" id="About">
              <h4>About</h4>
              <p>Richer Simulations is a developer of High Quality freeware and payware add-ons for the Caribbean region in Microsoft Flight Simulator, Lockheed Martin Prepar3d and Laminar Research X-Plane.</p>
              <p>Our payware add-ons are also available on <a href="http://secure.simmarket.com/richer-simulations.mhtml">SimMarket</a> and the MSFS Marketplace</p>
              <p>Officially stablished in 2012, Richer Simulations has grown from a one man team creating freeware FSX photo-terrain for his home island of Dominica in 2010, to a small group of developers who have a passion for enriching the Caribbean scene in various simulators today.</p>
            </div>

            <div className="w3-col s1">
              &nbsp;
            </div>

            <div className="w3-col s4 w3-justify">
              <h4>Store</h4>
              <p><i className="fa fa-fw fa-map-marker"></i> Richer Simulations</p>
              <p><i className="fa fa-fw fa-envelope"></i> <a href="mailto:richersimulations@gmail.com">richersimulations@gmail.com</a></p>
              <h4>We accept</h4>
              <p><FaPaypal size={16}/> PayPal</p>
              <p><FaCcMastercard size={16}/> <FaCcVisa size={16}/> Debit/Credit Card</p>
              <br/>
              <i className="fa fa-facebook-official w3-hover-opacity w3-large"></i>
              <i className="fa fa-instagram w3-hover-opacity w3-large"></i>
              <i className="fa fa-twitter w3-hover-opacity w3-large"></i>
            </div>
          </div>
        </footer>

        <div className="w3-black w3-center w3-padding-24">
          <br/>
          <a href='' className="w3-hover-opacity">Privacy Policy</a>    {/* https://www.termsfeed.com/live/00c6b083-aa1c-453d-9efe-0bd27f824410     */}
          &nbsp; | &nbsp;
          <a href='/DataDeletion' className="w3-hover-opacity">Data Deletion Policy</a>
          &nbsp; | &nbsp;
          <a href='' className="w3-hover-opacity">Refund Policy</a>  {/* https://www.termsfeed.com/live/2da60c43-2f3b-4cb3-8a7b-d8d676450ca9 */}          
        </div>

        {/* <!-- End page content --> */}
      </div>

      {/* <!-- Newsletter Modal --> */}
      <div id="newsletter" className="w3-modal">
        <div className="w3-modal-content w3-animate-zoom" style={{padding:"32px"}}>
          <div className="w3-container w3-white w3-center">
            <i onClick={() => {document.getElementById('newsletter').style.display='none'}} className="fa fa-remove w3-right w3-button w3-transparent w3-xxlarge"></i>
            <h2 className="w3-wide">NEWSLETTER</h2>
            <p>Join our mailing list to receive updates on new arrivals and special offers.</p>
            <p><input className="w3-input w3-border" type="text" placeholder="Enter e-mail"></input></p>
            <button type="button" className="w3-button w3-padding-large w3-red w3-margin-bottom" onClick={() => {document.getElementById('newsletter').style.display='none'}}>Subscribe</button>
          </div>
        </div>
      </div>

    </div>

    </ThemeProvider>
  );
}

function SignInUser() {
  return (
    // <div>
      auth.signInAnonymously()
  //  </div>
  )
}

export default App;

