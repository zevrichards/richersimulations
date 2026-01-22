import React, { useEffect, useState } from 'react'
import {Link, useHistory} from 'react-router-dom'
import {socialMediaAuth, logInWithEmailAndPassword} from '../service/auth'
import { facebookProvider, googleProvider, twitterProvider } from '../service/authMethods';
import { firebase, auth } from '../config/config.js'

//icons
import { FaFacebookSquare } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"


export const SignIn = (props) => {
    const history = useHistory();
  
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
  
  
    useEffect(() => {
      const unsub = auth.onAuthStateChanged(user => {
        // console.log("RAW AUTH STATE POST REDIRECT:", user);
        // if (user) console.log("IS ANON:", user.isAnonymous);
        setCurrentUser(user);
        setLoading(false);
        // if (user) history.push("/");
      });
      return unsub;
    }, []);
  
    // -------------------------------
    // Trigger Google Redirect Sign-In
    // -------------------------------
    const handleGoogleSignIn = async () => {
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        if (window.location.hostname === 'localhost') {
          await auth.signInWithPopup(googleProvider);
        } else {
          await auth.signInWithRedirect(googleProvider);
        }
      } catch (err) {
        console.error(err);
      }
    };
  
    // -------------------------------
    // Email/Password Login
    // -------------------------------
    const handleEmailSignIn = () => {
      logInWithEmailAndPassword(props.user, email, password);
    };
  
    if (loading) return <div>Loading...</div>;
  
    return (
      <>
        
        
        {currentUser && !currentUser.isAnonymous ? (
          <div>   
            
            <a className="w3-button w3-black" href='/'>Let's start shopping!</a>
            <br/><br/>
            <a className="w3-button w3-black" href='/Orders'>See your Orders</a>
            <br/><br/>
            <span><b>{currentUser.email}</b></span>
            <br/><br/>       
            <button className="w3-button w3-black" onClick={() => auth.signOut()}>Sign Out</button>
            
            
          </div>
        ) : (
          <div>
            <div className="login">
              <div className="login__container">
                <input
                  type="text"
                  className="login__textBox"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail Address"
                />
                <br/>
                <input
                  type="password"
                  className="login__textBox"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
                <br/>
                <button
                  className="login__btn"
                  onClick={handleEmailSignIn}
                >
                  Sign In
                </button>
  
                <div>
                  <Link to="/Reset">Forgot Password</Link>
                </div>
                <div>
                  Don't have an account? <Link to="/Register">Register</Link> now.
                </div>
              </div>
            </div>
  
            <br/><br/>
  
            <button className="w3-button w3-black" onClick={handleGoogleSignIn}>
              SIGN IN WITH <FcGoogle size={32}/>
            </button>
          </div>
        )}
      </>
    );
  };

// export const SignIn = (props) => {
//     let history = useHistory();

//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     // const [user, loading, error] = useAuthState(auth);

//     const handleOnClick = async (provider) => { 
//         console.log('Trying to sign in');
//         const res = await socialMediaAuth(props.user, provider);
//         console.log(res);
//         // history.push("/");
//     };


//     // if (props.user) {
//     //     console.log('Guest Account: ', props.user.isAnonymous)}

//     return (
//         <>
//         {props.user &&
//             !props.user.isAnonymous ? 
//                 <>
//                     <br/>
//                     <br/> 
//                     <a className="w3-button w3-black" href='/'>Let's start shopping!</a>
//                     <br/>
//                     <br/> 
//                     <a className="w3-button w3-black" href='/Orders'>See your Orders</a>
//                     <br/>
//                     <br/> 
//                     <button className="w3-button w3-black" onClick={() => auth.signOut()}>Sign Out</button> 
                    
//                 </>
            
//             :        
            
                
            
//                 <div>
//                     <div className="login">
//                         <div className="login__container">
//                             <input
//                             type="text"
//                             className="w3-grey login__textBox"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             placeholder="E-mail Address"
//                             />
//                             <br/>
//                             <br/>
//                             <input
//                             type="password"
//                             className="w3-grey login__textBox"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             placeholder="Password"
//                             />
//                             <br/>
//                             <br/>
//                             <button
//                             className="w3-button w3-black login__btn"
//                             onClick={() => {logInWithEmailAndPassword(props.user, email, password)}}
//                             >
//                             Sign In
//                             </button>
//                             <br/>
//                             <br/>

//                             <div>
//                                 <Link to="/Reset">Forgot Password</Link>
//                             </div>
//                             <div>
//                                 Don't have an account? <Link to="/Register">Register</Link> now.
//                             </div>
//                         </div>
//                     </div>

//                     <br/>
//                     <br/> 

//                     {/* <button onClick={() => handleOnClick(facebookProvider)}>SIGN IN WITH <FaFacebookSquare size={32}/></button> */}
//                     &nbsp; &nbsp;                 
//                     <button className="w3-button w3-black" onClick={() => handleOnClick(googleProvider)}>SIGN IN WITH <FcGoogle size={32}/> </button>
//                     <br/>
//                     <br/>
                    
//                 </div>                       
//         }
//         </>
//     )
// }
