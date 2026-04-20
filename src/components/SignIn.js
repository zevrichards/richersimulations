import React, { useEffect, useState } from 'react'
import {Link, useHistory} from 'react-router-dom'
import {socialMediaAuth, logInWithEmailAndPassword} from '../service/auth'
import { facebookProvider, googleProvider, twitterProvider } from '../service/authMethods';
import { firebase, auth } from '../config/config.js'
import { isInAppBrowser, buildOpenInBrowserUrl } from '../utils/browserDetect'

//icons
import { FaFacebookSquare } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"


export const SignIn = (props) => {
    const history = useHistory();
  
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inAppBrowser, setInAppBrowser] = useState(false);
  
  
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

    useEffect(() => {
      setInAppBrowser(isInAppBrowser());
    }, []);
  
    // -------------------------------
    // Trigger Google Sign-In
    //
    // Logic:
    //  - On localhost, use popup (redirect is painful to test locally and
    //    this project doesn't separate dev/prod builds).
    //  - If the user is currently anonymous, we try to LINK the Google
    //    credential onto that anon account so the cart/pending order
    //    carries over. If the Google account already exists as a separate
    //    Firebase user, we fall back to signing in to that existing user
    //    and stash the anon UID in sessionStorage so App.js can migrate
    //    the cart after the redirect returns.
    //  - Otherwise (no user, or already non-anon), plain sign-in.
    // -------------------------------
    const handleGoogleSignIn = async () => {
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

        const isLocalhost = window.location.hostname === 'localhost';
        const usePopup = isLocalhost;

        const current = auth.currentUser;

        // Case A: we have an anonymous user — try to link Google onto it.
        if (current && current.isAnonymous) {
          try {
            if (usePopup) {
              await current.linkWithPopup(googleProvider);
            } else {
              await current.linkWithRedirect(googleProvider);
            }
            return; // success; onAuthStateChanged will re-render
          } catch (linkErr) {
            // The Google account is already a Firebase user.
            // We can't link, so we have to sign in to the existing user
            // and migrate the cart from the anon UID afterwards.
            if (
              linkErr &&
              (linkErr.code === 'auth/credential-already-in-use' ||
               linkErr.code === 'auth/email-already-in-use')
            ) {
              sessionStorage.setItem('pendingAnonMerge', current.uid);
              if (usePopup) {
                await auth.signInWithPopup(googleProvider);
              } else {
                await auth.signInWithRedirect(googleProvider);
              }
              return;
            }
            throw linkErr;
          }
        }

        // Case B: no user, or already non-anon — plain sign in.
        if (usePopup) {
          await auth.signInWithPopup(googleProvider);
        } else {
          await auth.signInWithRedirect(googleProvider);
        }
      } catch (err) {
        console.error(err);
        alert('Sign-in failed: ' + (err && err.message ? err.message : 'Unknown error'));
      }
    };
  
    // -------------------------------
    // Email/Password Login
    // -------------------------------
    const handleEmailSignIn = () => {
      logInWithEmailAndPassword(props.user, email, password);
    };

    // -------------------------------
    // "Open in browser" handler for in-app browsers.
    // Tries an intent:// (Android) / x-safari-https:// (iOS) URL first
    // to force the system browser to take over. If that doesn't work
    // (some apps strip these schemes), the user still has the visible
    // instructions telling them how to do it manually.
    // -------------------------------
    const handleOpenInBrowser = () => {
      const target = window.location.href;
      const openUrl = buildOpenInBrowserUrl(target);
      try {
        window.location.href = openUrl;
      } catch (e) {
        console.error(e);
      }
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

            {/* If we detect an in-app browser (Instagram, Facebook, TikTok, etc),
                Google sign-in is unreliable. Show an explanation + an "Open in
                browser" button that tries to force the system browser. */}
            {inAppBrowser ? (
              <div className="w3-panel w3-pale-yellow w3-border w3-padding">
                <p>
                  <b>Google Sign-In doesn't work inside this app's browser.</b>
                </p>
                <p>
                  To sign in with Google, please open this page in your regular
                  browser (Safari, Chrome, etc.).
                </p>
                <p>
                  Tap the <b>&bull;&bull;&bull;</b> (or <b>share</b>) menu at the top
                  or bottom of this screen and choose <b>"Open in Browser"</b> /
                  <b>"Open in Safari"</b> / <b>"Open in Chrome"</b>.
                </p>
                <button
                  className="w3-button w3-black"
                  onClick={handleOpenInBrowser}
                >
                  Try to open in my browser
                </button>
                <p>
                  <small>
                    If the button above doesn't work, please use the menu
                    option as described. You can also sign in with email and
                    password using the form above.
                  </small>
                </p>
              </div>
            ) : (
              <button className="w3-button w3-black" onClick={handleGoogleSignIn}>
                SIGN IN WITH <FcGoogle size={32}/>
              </button>
            )}
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
