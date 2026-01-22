import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useHistory } from "react-router-dom";
import { registerWithEmailAndPassword, signInWithGoogle} from '../service/auth'
import { auth, firebase } from '../config/config.js'

export const Register = (props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmPassword] = useState("");
  // const [name, setName] = useState("");
  const [user, loading, error] = useAuthState(auth);
  const history = useHistory();

  const register = () => {
    if (!email) {
      alert("Please enter email.");
    }
    else {      
      if (!password) {
        alert("Please enter password.");
      }
      else {      
        if (password != confirmpassword) {
          alert("Passwords do not match.");
        }
        else {
          if (user) { //already signed in anonymously
            //new users will have the anonymous login linked to a new registration
            const credential = firebase.auth.EmailAuthProvider.credential(email, password);
            auth.currentUser.linkWithCredential(credential)
            history.replace("/");
          }
          else {
            registerWithEmailAndPassword(email, password);
          }
        }
      }
    }
  };

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (!user.isAnonymous) {
       history.replace("/");
      }
    }
  }, [user, loading]);

  return (
    <div className="register">
      <div className="register__container">
        {/* <input
          type="text"
          className="register__textBox"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
        /> */}
        <input
          type="text"
          className="register__textBox"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail Address"
        />
        <br/>
        <input
          type="password"
          className="register__textBox"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <br/>
        <input
          type="password"
          className="login__textBox"
          value={confirmpassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          />
          <br/>
        <button className="register__btn" onClick={register}>
          Register
        </button>
        {/* <button
          className="register__btn register__google"
          onClick={signInWithGoogle}
        >
          Register with Google
        </button> */}
        <div>
          Already have an account? <Link to="/SignIn">Login</Link> now.
        </div>
      </div>
    </div>
  );
}

export default Register;