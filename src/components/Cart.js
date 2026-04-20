import React from 'react'
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom'

import {firestore, Timestamp, auth} from '../config/config.js'

import {CartItem} from './CartItem.js'
import PayPal from './PayPal.js'

//icons
import { MdRemoveShoppingCart, MdTungsten } from "react-icons/md"
import { RiContactsBookLine, RiEmotionSadLine } from "react-icons/ri"
import {RiDeleteBin5Line} from 'react-icons/ri'
import { FaPaypal, FaCcVisa, FaCcMastercard } from 'react-icons/fa'
import { IoCartOutline } from "react-icons/io5"

export class Cart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      CustomerName: '',
      Email: '',
      checkout: false,
      Items:[],
      TotalPrice:0,
      PromoCodeApplied: false,
      PromoCode: '',
      DiscountDescription: '',
      DiscountPrice: 0,
      uid: '',
      // DiscountQuantity: 1,
      orderNumber: '',
      processing: false,
      pendingOrders: false,
    }; 
    this.GetCart = this.GetCart.bind(this);    
    this.GetPendingOrders = this.GetPendingOrders.bind(this);
    this.handlePayPalOrderApprove = this.handlePayPalOrderApprove.bind(this);
    this.handleRemoveFromCart = this.handleRemoveFromCart.bind(this);
    this.handleSendToPaymentPlatform = this.handleSendToPaymentPlatform.bind(this);
    this.handleSendToPayPal = this.handleSendToPayPal.bind(this);
    this.createPendingOrder = this.createPendingOrder.bind(this);    
    this.EmptyCart = this.EmptyCart.bind(this);
    this.CustomizeState = this.CustomizeState.bind(this);
    this.SetCustomerData = this.SetCustomerData.bind(this);
    this.CheckPromoCode = this.CheckPromoCode.bind(this);
    }

    async componentDidUpdate(prevProps) {
      if (prevProps !== this.props) {
          ///get the cart and check for previously saved user data to set the customer data fields
          if (this.props.user)
          {
              await this.GetCart(this.props.user.uid); 
              await this.GetPendingOrders();  
              await this.CustomizeState(); 
          }           
      }
  }

  async componentDidMount() {       

      ///get the cart
      if (this.props.user)
      {
          await this.GetCart(this.props.user.uid); 
      }
  }

  async GetCart(uid) {
    // alert(Timestamp.now().seconds.toString())
    const Items = [];
    var TotalPrice = 0
    this.setState({Items: [], TotalPrice:0});
    if (this.props.user !== null) {
        const Cart = await firestore.collection('Users').doc(uid).collection('Cart').get();
        
        Cart.forEach((doc) => {
          Items.push(doc.data());
          TotalPrice = TotalPrice + doc.data().Price*(1-doc.data().Discount);
        })
    }

    this.setState({Items: Items}); //ARRAY DOUBLES HERE?!?
    this.setState({TotalPrice: (TotalPrice).toFixed(2)})
  }
  

  async GetPendingOrders(){

    if (!this.props.user) return;

    // check to see if any pending orders exist
    const pendingOrdersQuerySnapshot = await firestore.collection("Users").doc(this.props.user.uid).collection("Orders").where("status", "==", "Payment Pending").get();

    // console.log("Pending Orders:", !pendingOrdersQuerySnapshot.empty)

    this.setState({pendingOrders: !pendingOrdersQuerySnapshot.empty});

  }

  async EmptyCart() {
    console.log('Emptying cart')
      if (this.props.user !== null) {
          await firestore.collection('Users').doc(this.props.user.uid).collection('Cart').get()
          .then(querySnapshot => {
              //delete all items in the cart, before deleting the cart itself
              querySnapshot.docs.forEach(snapshot => {
                  snapshot.ref.delete();
              })
          })
          .then(
              this.setState({checkout: false, Items:[], TotalPrice:0})
          )
      }
  }

async handleManualOrderApprove(){
  
  const token = await auth.currentUser.getIdToken();

  //POST to ManualOrderComplete cloud function which will handle the update of orders
  await fetch("https://manualordercomplete-lzd77xsmjq-uc.a.run.app", {
  method: "POST",
  headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
  },
  body: JSON.stringify( this.state.orderNumber, this.state.TotalPrice ),
  }).then(
      this.setState({checkout: false, Items:[], TotalPrice:0, })
      
  );

  alert('Order confirmed. Thank you for your purchase! Your receipt has been sent to: '+this.state.Email);
}

async handlePayPalOrderApprove(){
    //the PayPal webhook will call the cloud function to update orders on the back end when the transaction is succesful
    //route to Orders page here:
    window.location.href = "https://richersimulations.com/orders"
}

  async ValidateCustomerData() {
    var result = true;
    console.log('Validating Customer Data...')
    if (this.state.CustomerName=='') {
        alert('Please enter a full name for your Order')
        result = false;
        console.log('Invalid Name');                
    }
    if (this.props.user.isAnonymous || this.props.user.email == 'richersimulations@gmail.com') {
        if (this.state.Email==undefined) {
            alert('Please enter a email for your receipt')
            result = false;
            // console.log('Invalid Email');  
        }
        else {
          if ((!this.state.Email.includes("@")) || (!this.state.Email.includes("."))) {
            alert('Your email address is incomplete. ')
            result = false;
          }
          if ((this.state.Email != this.state.ConfirmEmail)) {
              alert('Emails do not match.')
              result = false;
          }
        }              
    }
    // console.log(result)
    return result    
    
  }

  // async handleReceivePayment() {
    
  //   await this.ValidateCustomerData().then(
  //     //ensure that the enterred data is valid before taking customer to payment link      
  //     (result) => {
  //       if (result) {
  //         alert('IMPORTANT! Click on the RETURN button after your transaction is complete to receive an order confirmation!')
  //         //set the customer data, this may have changed from what was previously enterred. If this is brand new info it will be needed for when the payment button returns us to this page for order confirmation
  //         this.SetCustomerData().then(
  //           () => window.location.href = 'https://www.fygaro.com/en/pb/f70be460-0194-4362-bbb3-3ff31facbdc6/?amount='+this.state.TotalPrice
  //         )
  //       }  
  //     }
  //     )      
  // }

  async createPendingOrder() {

    //Order Number created here
    const orderNumber = Timestamp.now().seconds.toString();
    this.setState({orderNumber: orderNumber});

   
    //create a pending order for later reference. this will be deleted later when the order is completed.
    await firestore
        .collection("PendingOrders")
        .doc(orderNumber)
        .set({                                
            status: "Payment Pending",
            createdAt:  new Date(),
            orderNumber: orderNumber,
            amount: Number(this.state.TotalPrice),
            userId: this.props.user.uid,
            email: this.state.Email,   
            PromoCode: this.state.PromoCode || null,
        });

    // 🧾 Create pending order in user's orders colletions. this will contain all the items. later we will change "pending" to "paid" or "cancelled"
    const pendingOrderRef = firestore
        .collection("Users")
        .doc(this.props.user.uid)
        .collection("Orders")
        .doc(orderNumber)

    //set data from userref here

    // console.log(pendingOrder)
    // console.log(userSnap.data())
    await pendingOrderRef.set({
        status: "Payment Pending",
        createdAt:  new Date(),
        orderNumber: orderNumber,            
        amount: Number(this.state.TotalPrice),
        // userId: this.props.user.uid,
        // email: this.state.Email,    
        PromoCode: this.state.PromoCode || null,
    });

    // 📦 Copy cart items + empty cart
    const cartRef = firestore
        .collection("Users")
        .doc(this.props.user.uid)
        .collection("Cart")

    const cartSnap = await cartRef.get();

    const batch = firestore.batch();
    // console.log(this.props.user.uid, cartSnap.length)
    for (const doc of cartSnap.docs) {        
        //copy from cart to pending order
        const orderItemRef = pendingOrderRef
            .collection("Items")
            .doc(doc.id);
        batch.set(orderItemRef, doc.data())
        //delete from cart
        batch.delete(doc.ref)
    }

    // await the batch commit so all items land in Firestore before we
    // return — otherwise the user can be redirected to the payment page
    // before their cart has finished writing to the pending order.
    await batch.commit();

    // return the orderNumber so callers don't have to rely on state,
    // which is async and won't be updated until the next render.
    return orderNumber;
    
}

async handleSendToPayPal() {

    await this.createPendingOrder();

    this.ValidateCustomerData().then((result) => {
        //ensure that the enterred data is valid before taking customer to payment link            
        if (result) {
            //set the customer data, this may have changed from what was previously enterred. If this is brand new info it will be needed for when the payment button returns us to this page for order confirmation
            this.SetCustomerData().then(async () => { 
                //ensure that the enterred data is valid before taking customer to payment link
                this.setState({checkout: result})
            })          
        }
    })        
}

async handleSendToPaymentPlatform() { 

    this.setState({processing: true})

    async function createJWT(amount, orderNumber) {
        const response = await fetch(
            "https://createfygarojwt-lzd77xsmjq-uc.a.run.app",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: amount,
                    orderNumber: orderNumber,
                    // amount: 1,
                    // orderNumber: 'TEST_ORDER',
                  })
            }
        );
    
        const data = await response.json();
        return data.token;
    }       


    // IMPORTANT: we no longer read orderNumber from this.state here.
    // createPendingOrder() generates a fresh orderNumber every call and
    // returns it — we use the returned value so the JWT and the
    // PendingOrders doc always match. Relying on this.state.orderNumber
    // was buggy because setState is async: the state read in this
    // function was the *previous* order (or '' on first click).
    this.ValidateCustomerData().then(
      //ensure that the enterred data is valid before taking customer to payment link
      async (result) => {
        if (result) {
            
            this.setState({processing: true});
            const orderNumber = await this.createPendingOrder();
           //set the customer data, this may have changed from what was previously enterred. If this is brand new info it will be needed for when the payment button returns us to this page for order confirmation
            this.SetCustomerData().then(async () => {                    
                    const token = await createJWT(
                        this.state.TotalPrice, orderNumber);
                    
                    window.location.href = "https://www.fygaro.com/en/pb/f70be460-0194-4362-bbb3-3ff31facbdc6/?jwt=" + token
                }
            )
        }  
      }
      )      
  }

  async SetCustomerData() {
    // console.log(this.props.user.uid)
    await firestore.collection('Users').doc(this.props.user.uid).set({
      name: this.state.CustomerName,
      email: this.state.Email,
      uid: this.props.user.uid,
    },
    {merge:true})
  }

  async CustomizeState() {
    //THIS MAY BE BAD PRACTICE. WE ARE SETTING STATE FROM THE URL.
    ///THEREFORE WE HAVE A DUPLICATE INSTEAD OF SINGLE SOURCE OF TRUTH

    //try to load previously saved user data
    await firestore.collection('Users').doc(this.props.user.uid).get().then( 
      snapshot => {
          const user = snapshot.data();
          // console.log(user)  
          this.setState({CustomerName: user.name, Email: this.props.user.email, ConfirmEmail: this.props.user.email})
    } 
    )

    //if we came from the Fygaro payment button, check for the return URL and process the approved payment
    if (this.props.location.search != '') {
      const params = new URLSearchParams(this.props.location.search);

      if (params.get('handleOrderApprove')) {           
        console.log('Return URL from Fygaro payment button') 
        if (this.state.Items.length > 0) {
          this.handleOrderApprove()
        }
      } 
    }
  }


  ValidatePromoCode (doc) {
    //check for code quantity
    if (doc.data().Quantity <= 0) {        
        alert('Promo Code expired.')
        return false
    }
    //check that discount is less than actual price
    if (doc.data().Price >= this.state.TotalPrice) {
        alert('Promo code cannot be used for this order.')
        return false
    }
    
    return true
  } 

CheckPromoCode () {
    //query the promocodes
    const query = firestore.collection('PromoCodes')
                    .where('Code', '==', this.state.PromoCode)
                    .get()
                    .then((querySnapshot) => {
                        if (querySnapshot.empty) {
                            alert('No matching promo code found.')
                        }
                      querySnapshot.forEach((doc) => {
                        //if a matching promocode is found, validate it, then apply it
                        if (this.ValidatePromoCode(doc)) {                              
                            this.setState({PromoCodeApplied: true, DiscountDescription: doc.data().Description, DiscountPrice: -(doc.data().Price), TotalPrice: this.state.TotalPrice-doc.data().Price})
                        }                           
                      })
                    })
                            

}

// async UpdatePromoCodeStock() {
//   //THIS IS HAPPENING TOO FAST WHEN MULTIPLE ITEMS ARE ORDERED
  
//   console.log('Updating promo codes')
//   if (this.state.PromoCodeApplied)  {
//     await firestore.collection('PromoCodes').doc(this.state.PromoCode).get().then( 
//         async snapshot => {
//             const doc = snapshot.data();
//             var Quantity = doc.Quantity;
//             Quantity = Quantity - 1;
//             await firestore.collection('PromoCodes').doc(this.state.PromoCode).update({'Quantity': Quantity});
//         })    
//   }
// }

async handleRemoveFromCart(item) {
  
  firestore
      .collection("Users")
      .doc(this.props.user.uid)
      .collection("Cart")
      .doc(item.Name)
      .delete()

  this.setState({Items:  [...this.state.Items.filter(itemJersey => itemJersey != item)]})
  // console.log(item.League+item.Team+item.Cut+item.Sleeve+item.Variant+item.Size);
}



  render() {

    return ( 
      <> 
      <div>        
            { (this.state.pendingOrders) &&
                <>
                    <a className="w3-button w3-blue" href='/orders'>You have unfinished orders.<br/>Complete them here. <IoCartOutline/></a>
                    <br/><br/> 
                </>  
                }
            { 
            (this.state.Items.length === 0) ? (
                <a href='/' className="w3-button w3-black">Your cart is empty. <RiEmotionSadLine/>  Let's fill it up.</a>
            ) : (
                <>
                <table className='center'>
                  <tbody>
                    <tr>
                        <td>
                          <label>Full Name: </label>
                        </td>
                        <td>
                            <input className="w3-input w3-border w3-grey" type='text' required={!this.state.PickupChecked} onChange={(e) => this.setState({CustomerName: e.target.value})} value={this.state.CustomerName}/>
                        </td>
                    </tr>
                    {this.props.user &&
                        (this.props.user.email == 'richersimulations@gmail.com') &&
                        <>   
                            <tr>
                                <td>
                                  <label>Email:  </label>
                                </td>
                                <td>
                                    <input className="w3-input w3-borde w3-grey" type='text' required={this.props.user.isAnonymous} onChange={(e) => this.setState({Email: e.target.value})} value={this.state.Email}/>
                                </td>
                            </tr>
                            <tr>
                              <td>
                                  <label>Confirm Email: </label>   
                              </td>
                              <td>
                                  <input className="w3-input w3-border w3-grey" type='text' required={this.props.user.isAnonymous} onChange={(e) => this.setState({ConfirmEmail: e.target.value})} value={this.state.ConfirmEmail}/>
                              </td>
                          </tr>
                       </>     
                    }
                  </tbody>
                </table>      

                
                
                <br/>
      
                <table className='center'>
                  <tbody>
                      {this.state.Items.map((product) => (
                              
                                  <tr key={product.Name}>
                                      <td>
                                        <CartItem Item={product}/>
                                      </td>
                                      <td>                                            
                                          <BrowserRouter>
                                              <Switch>
                                                  <Link className="w3-button w3-black" to='/cart' onClick={async () => this.handleRemoveFromCart(product)}><RiDeleteBin5Line size={32}/></Link> 
                                              </Switch>  
                                          </BrowserRouter>                          
                                      </td>
                                  </tr>
                                    
                              
                          ))  } 
                          <tr>
                          {this.state.PromoCodeApplied ? 
                              <>
                                  <td>
                                      <div className='CartItem'>
                                          <table className='CartItem'>
                                            <tbody>
                                                <tr>
                                                    <td><img className='productImgThumb' src={'https://firebasestorage.googleapis.com/v0/b/soccerexpressionz-test.appspot.com/o/promocode.png?alt=media&token=c3893d21-e420-4c4b-bd73-08baf3f30b1a'}/> </td>
                                                    <td>{this.state.DiscountDescription}</td> 
                                                    <td>Discount</td>
                                                    {/* <td>Quantity: {this.state.DiscountQuantity}</td>                                                                                                        */}
                                                    <td>US${this.state.DiscountPrice}</td>
                                                </tr>
                                              </tbody>
                                          </table>
                                      </div> 
                                  </td> 
                                  <td><RiDeleteBin5Line size={32}/></td>                                       
                              </>
                              :                            
                              <>  
                                <td>                                         
                                  <label>Discount Code:&nbsp;</label>
                                  <input className=" w3-grey" type='text' onChange={(e) => this.setState({PromoCode: e.target.value.toUpperCase()})} value={this.state.PromoCode}/>
                                  &nbsp;
                                  <button className="w3-button w3-black" onClick={() => this.CheckPromoCode()}>Apply</button>
                                </td> 
                              </>
                              }
                          </tr>
                      </tbody>
                  </table>
                  </>
            )
                            }
      
      </div>

      <br/>

      {(this.props.user && this.props.user.isAnonymous) ?
      ( 
        <div>
          <a href='/SignIn'><button className="w3-button w3-yellow">Please sign in to continue with your purchase...</button></a>
        </div>
      ) : (
        <div>
          {this.props.user !== null &&
                      this.props.user.email == 'richersimulations@gmail.com' &&
          
            <div>
            <br/>
                                

            {/* <button
              className="w3-button w3-black"
              disabled={this.state.processing}
              onClick={async () => {
                if (!this.state.processing) {                    
                  if (await this.ValidateCustomerData() == true) { 
                    this.setState({processing: true})
                    this.handleManualOrderApprove()
                  }					
                }
                }}
              >
                {this.state.processing ? 'Processing Order...' : 'ORDER'}
            <br/> US${this.state.TotalPrice}
            </button> */}

            </div >
          }
              

                  

                  {this.state.checkout ? (
                  <>
                      <label className='notice'>Remember to change currency to USD to avoid PayPal's extra fees!</label><br/>
                      <PayPal value={this.state.TotalPrice} OrderApproved={this.handleOrderApprove}/>
                  </>
                  
                  ) : (
                      (this.state.Items.length > 0) && 
                          <>                          
                            <button
                              className="w3-button w3-black"
                              onClick={() => this.handleSendToPaymentPlatform()}                          
                              >
                                {this.state.processing ?
                                  'Processing...'
                                  :
                                  <>
                                  <FaCcMastercard/> <FaCcVisa/> <br/> Debit Card/Credit Card  <br/> US${this.state.TotalPrice}
                                  </>
                                }
                            </button>
                            &nbsp;&nbsp;

                            <button className="w3-button w3-black" onClick={async () => {
                                                                            if (!this.state.processing) {                    
                                                                              if (await this.ValidateCustomerData() == true) { 
                                                                                this.setState({processing: true})
                                                                                this.handleSendToPayPal()	
                                                                              }					
                                                                            }
                                                                            }} >
                            <FaPaypal/> <br/> Paypal<br/> US${this.state.TotalPrice}
                            </button>
                            
                          </>
                          
                  )} 
        </div>
      )}
      <br/>

            
      <div>
          {(this.state.Items.length !== 0) &&
          <>
            <div>
              <BrowserRouter>
                  <Switch>
                        <Link className="w3-button w3-black" to='/cart' onClick={this.EmptyCart}>Empty Cart<br/><MdRemoveShoppingCart size={40}/></Link>
                  </Switch>  
              </BrowserRouter>
            </div>
            <br/><br/>
            <div>
                <a className="w3-button w3-black" href='/'>Shop some more...</a>
                <br/>
                <br/>
            </div>
          </>}
      </div>

      <div>
        Powered by:
        <img src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/visa.png?alt=media&token=58072175-6a2a-4ba6-8f73-c21e9e417aa6"/>
        <img src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/mastercard.png?alt=media&token=bde740a0-3530-421d-b6c5-d07dc11101ec"/>
        <img src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/linx.png?alt=media&token=8d54046b-9d8e-4545-8f94-c12785399ab8"/>
        <img src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/paypal.png?alt=media&token=3082ec48-8d45-406e-a7b3-77dbf99f2a6e"/>
        <img src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/republicbanktt.png?alt=media&token=6fbc1366-bd0d-4a0b-ad2c-c46f46d0c93e"/>
      </div>

      </>  

      
      
    )
  }
}
