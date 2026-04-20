import {firestore, auth } from '../config/config.js';


///LINKING IS NOT WORKING. IF USER IS SIGNED IN ANONYMOUSLY THEN WE MUST CHECK TO SEE IF THE CREDENTIALS ALREADY EXIST
//IF THEY DO, SIMPLY SIGN IN
//IF THEY DO NOT, USE LINKWITHREDIRECT TO OBTAIN NEW CREDENTIALS?
const socialMediaAuth = async (user, provider) => {
  // if (user) {//already signed in anonymously
    //retrieve the cart so that we can copy it later
    
    
  //   const credential = null;
  //   if (provider.providerId == 'google.com') {
  //     // console.log(auth.currentUser)
  //     const credential = GoogleAuthProvider.credential(auth.currentUser.getIdToken)}
  //   // if (provider == FacebookAuthProvider) {
  //   //   console.log(provider)
  //   //   const credential = FacebookAuthProvider.credential( .authResponse.accessToken)}
  //   // alert(provider, credential)
  //   console.log(credential)
  //   return auth
  //   .currentUser.linkWithCredential(user, credential)
  //     .then((usercred) => {
  //       console.log("Anonymous account successfully upgraded", usercred.user);
  //     })
  //     // .catch((err) => {
  //     //     return err;
  //     // });
  // }
  // else {    
    return auth
    .signInWithRedirect(provider)
      .then((res) => {
          return res.user;
      })
      .catch((err) => {
          return err;
      });
    // }
};

const logInWithEmailAndPassword = async (user, email, password) => {
  // if (user) { //already signed in anonymously
  //   const credential = auth2.EmailAuthProvider.credential(email, password);

  //   await auth.currentUser.linkWithCredential(credential)
  // }
  // else {
    try {      
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  // }
    
  };

  const registerWithEmailAndPassword = async (email, password) => {
    try {
      const res = await auth.createUserWithEmailAndPassword(email, password);
      const user = res.user;
      await firestore.collection('Users').doc(user.uid).set({
        UID: user.uid,
        email: email,
      },
      {merge: true});
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      await auth.sendPasswordResetEmail(email);
      alert("Password reset link sent!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };


export {socialMediaAuth, logInWithEmailAndPassword, registerWithEmailAndPassword, sendPasswordReset};
