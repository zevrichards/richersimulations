import React from 'react'
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom'

import {firestore, Timestamp} from '../config/config.js'

import {CartItem} from './CartItem.js'
import PayPal from './PayPal.js'

//icons
import { MdRemoveShoppingCart, MdTungsten } from "react-icons/md"
import { RiContactsBookLine, RiEmotionSadLine } from "react-icons/ri"
import {RiDeleteBin5Line} from 'react-icons/ri'
import { FaPaypal, FaCcVisa, FaCcMastercard } from 'react-icons/fa'

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
      processing:false,}; 
    this.GetCart = this.GetCart.bind(this);
    this.UpdateOrders = this.UpdateOrders.bind(this);
    this.temp_CartToOrders = this.temp_CartToOrders.bind(this);
    this.UpdatePromoCodeStock = this.UpdatePromoCodeStock.bind(this);    
    this.EmptyCart = this.EmptyCart.bind(this);
    this.handleOrderApprove = this.handleOrderApprove.bind(this);
    this.CustomizeState = this.CustomizeState.bind(this);
    this.handleReceivePayment = this.handleReceivePayment.bind(this);
    this.SetCustomerData = this.SetCustomerData.bind(this);
    //FOR TEMPORARY USE ONLY. REMOVE BEFORE BUILD ///////////////////////////////////////////////////////////
    // this.handleTestOrderApprove = this.handleTestOrderApprove.bind(this);        
    //FOR TEMPORARY USE ONLY. REMOVE BEFORE BUILD ///////////////////////////////////////////////////////////
    this.CheckPromoCode = this.CheckPromoCode.bind(this);
    }

    async componentDidUpdate(prevProps) {
      if (prevProps !== this.props) {
          ///get the cart and check for previously saved user data to set the customer data fields
          if (this.props.user)
          {
              await this.GetCart(this.props.user.uid);  
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

  async temp_CartToOrders() {
    console.log('Pushing Cart to Orders');
    const time = Timestamp.now().seconds.toString();
    const CustomerName= this.state.CustomerName;
    const TotalPrice = this.state.TotalPrice;
    const PromoCodeDesc = this.state.DiscountDescription;        
    const PromoCode = this.state.PromoCode;

    var ItemsArray= [];

    //retrieve the cart
    const Cart = await firestore.collection('Users').doc(this.state.uid).collection('Cart').get()


    //create a new order document with the TimeStamp as the order number
    await firestore.collection('Users').doc(this.state.uid).collection('Orders').doc(time).set({ 
        OrderNumber: time,
        PromoCode: PromoCode})

        //for every item in the cart
        for (var doc of Cart.docs){
            //then push the item to the order list
            ItemsArray.push({text: doc.data().Name,
                        image: doc.data().ItemImg,
                        // quantity: 1,
                        price: '$'+(doc.data().Price*(1-doc.data().Discount)).toFixed(2),
                        URL: doc.data().URL
                    })
        }
        
        //if any promocodes were used, push it to the order list
        if (PromoCodeDesc != '') {
            ItemsArray.push({text: PromoCodeDesc,
                            price: '$'+(this.state.DiscountPrice).toFixed(2)})     
        }

    //copy the itemsarray to the customers orders collection
    firestore.collection('Users').doc(this.state.uid).collection('Orders').doc(time).collection('Items').doc(doc.data().Name).set({...doc.data()});   
    
    //add the filename IDs to the customers FileIDs array to grant them the necessary permissions to the repository
    const FileIDs = []
    //get any file Ids already present so we can add to it
    if (firestore.collection('Users').doc(this.state.uid).FieldIDs != undefined) {
      FileIDs = firestore.collection('Users').doc(this.state.uid).data().FieldIDs
    }
    // FileIDs = [...firestore.collection('Users').doc(this.props.user.uid).data().FieldIDs]

    for (var item of ItemsArray){
      //the File ID lies between the last forweard slash ('%2F') and the beginning of the beginning of the access token/metadata ('?alt'). Also replace format to bring back spaces ('%20')
      FileIDs.push(item.URL.split('%2F').pop().split('?alt')[0].replaceAll('%20', ' '));
           }
    firestore.collection('Users').doc(this.state.uid).update({FileIDs: FileIDs}) 

  }
  
  async UpdateOrders() {
      console.log('Updating Orders');
      const time = Timestamp.now().seconds.toString();
      const CustomerName= this.state.CustomerName;
      const TotalPrice = this.state.TotalPrice;
      const PromoCodeDesc = this.state.DiscountDescription;        
      const PromoCode = this.state.PromoCode;

      var ItemsArray= [];

      
      //make sure the user email has been set correctly. we set it here again as there seems to be some conflict with the initialization of State
      if (this.props.user) {
          if ((this.props.user.email) && (this.props.user.email != 'richersimulations@gmail.com')) {
              this.setState({Email: this.props.user.email})                
              // console.log('email: ',this.props.user.email,',',this.state.Email)
          }
      }

      //console.log (Deliver, CustomerName, DeliveryAddress1, DeliveryAddress2, DeliveryCity, DeliveryTelNumber);

      //retrieve the cart
      const Cart = await firestore.collection('Users').doc(this.props.user.uid).collection('Cart').get()


      //create a new order document with the TimeStamp as the order number
      await firestore.collection('Users').doc(this.props.user.uid).collection('Orders').doc(time).set({ 
          OrderNumber: time,
          PromoCode: PromoCode})

          //for every item in the cart
          for (var doc of Cart.docs){
              //then push the item to the order list
              ItemsArray.push({text: doc.data().Name,
                          image: doc.data().ItemImg,
                          // quantity: 1,
                          price: '$'+(doc.data().Price*(1-doc.data().Discount)).toFixed(2),
                          URL: doc.data().URL
                      })
          }
          
          //if any promocodes were used, push it to the order list
          if (PromoCodeDesc != '') {
              ItemsArray.push({text: PromoCodeDesc,
                              price: '$'+(this.state.DiscountPrice).toFixed(2)})     
          }

      //copy the itemsarray to the customers orders collection
      firestore.collection('Users').doc(this.props.user.uid).collection('Orders').doc(time).collection('Items').doc(doc.data().Name).set({...doc.data()});   
      
      //add the filename IDs to the customers FileIDs array to grant them the necessary permissions to the repository
      const FileIDs = []
      //get any file Ids already present so we can add to it
      if (firestore.collection('Users').doc(this.props.user.uid).FieldIDs != undefined) {
        FileIDs = firestore.collection('Users').doc(this.props.user.uid).data().FieldIDs
      }
      // FileIDs = [...firestore.collection('Users').doc(this.props.user.uid).data().FieldIDs]

      for (var item of ItemsArray){
        //the File ID lies between the last forweard slash ('%2F') and the beginning of the beginning of the access token/metadata ('?alt'). Also replace format to bring back spaces ('%20')
        FileIDs.push(item.URL.split('%2F').pop().split('?alt')[0].replaceAll('%20', ' '));
             }
      firestore.collection('Users').doc(this.props.user.uid).update({FileIDs: FileIDs}) 
          
      
      
      //SEND EMAILS
      //queue the mail to mail collection
      console.log(this.state.CustomerName)
      firestore.collection('mail').add({
          to: this.state.Email,
          cc: 'richersimulations@gmail.com',
          template: {
              name: 'receipt',
              data: {
                  ordernumber: time,
                  total: TotalPrice,
                  items: ItemsArray,
                  receipt: true,
                  name: CustomerName,
                  }
              }
          }).then(() => console.log('Queued email for delivery!'));                
  }

  async handleRemoveFromCart(product){
      await firestore.collection('Users').doc(this.props.user.uid).collection('Cart').doc(product.Name).delete().then(async () => {
          await this.GetCart(this.props.user.uid);
          })
  // this.BOGOHO()      
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

  async handleOrderApprove(){
      console.log('Order approved');
      await this.UpdateOrders();                   
      await this.UpdatePromoCodeStock();
      await this.EmptyCart();      
      alert('Order confirmed. Thank you for your purchase! Your receipt has been sent to: '+this.state.Email);
      this.setState({checkout: false, Items:[], TotalPrice:0, processing:false,});
  }

  async handleTestOrderApprove(){
      await this.UpdateOrders();             
      // await this.UpdatePromoCodeStock();
      // await this.EmptyCart();        
      alert('Order confirmed. Thank you for your purchase! Your receipt has been sent to: '+this.state.Email);
      this.setState({checkout: false, Items:[], TotalPrice:0, processing:false,});
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
        if (this.state.Email=='') {
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

  async handleReceivePayment() {
    
    await this.ValidateCustomerData().then(
      //ensure that the enterred data is valid before taking customer to payment link      
      (result) => {
        if (result) {
          alert('IMPORTANT! Click on the RETURN button after your transaction is complete to receive an order confirmation!')
          //set the customer data, this may have changed from what was previously enterred. If this is brand new info it will be needed for when the payment button returns us to this page for order confirmation
          this.SetCustomerData().then(
            () => window.location.href = 'https://www.fygaro.com/en/pb/f70be460-0194-4362-bbb3-3ff31facbdc6/?amount='+this.state.TotalPrice
          )
        }  
      }
      )      
  }

  async SetCustomerData() {
    // console.log(this.props.user.uid)
    await firestore.collection('Users').doc(this.props.user.uid).update({
      name: this.state.CustomerName,
      // email: this.state.Email,
    })
  }

  async CustomizeState() {
    //THIS MAY BE BAD PRACTICE. WE ARE SETTING STATE FROM THE URL.
    ///THEREFORE WE HAVE A DUPLICATE INSTEAD OF SINGLE SOURCE OF TRUTH

    //try to load previously saved user data
    await firestore.collection('Users').doc(this.props.user.uid).get().then( 
      snapshot => {
          const user = snapshot.data();
          // console.log(user)  
          this.setState({CustomerName: user.name, Email: user.email, ConfirmEmail: user.email})
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

async UpdatePromoCodeStock() {
  //THIS IS HAPPENING TOO FAST WHEN MULTIPLE ITEMS ARE ORDERED
  
  console.log('Updating promo codes')
  if (this.state.PromoCodeApplied)  {
    await firestore.collection('PromoCodes').doc(this.state.PromoCode).get().then( 
        async snapshot => {
            const doc = snapshot.data();
            var Quantity = doc.Quantity;
            Quantity = Quantity - 1;
            await firestore.collection('PromoCodes').doc(this.state.PromoCode).update({'Quantity': Quantity});
        })    
  }
}



  render() {

    return ( 
      <> 
      <div>
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
            <button
              className="w3-button w3-black"
              disabled={this.state.processing}
              onClick={async () => {
                if (!this.state.processing) {                    
                  if (await this.ValidateCustomerData() == true) { 
                    this.setState({processing: true})
                    this.handleTestOrderApprove()		
                  }					
                }
                }}
              >
                {this.state.processing ? 'Processing Order...' : 'TEST'}
            <br/> US${this.state.TotalPrice}
            </button>
            &nbsp;&nbsp;

            <label>UID: </label>
            <input className="w3-input w3-border w3-grey" type='text' onChange={(e) => this.setState({uid: e.target.value})} value={this.state.uid}/>

            <button
              className="w3-button w3-black"
              disabled={this.state.processing}
              onClick={async () => {this.GetCart(this.state.uid)}	}
              >
                 GET CART
            </button>  

            <button
              className="w3-button w3-black"
              disabled={this.state.processing}
              onClick={async () => {
                    this.temp_CartToOrders()	
                  }		
                }			
              >
                CART TO ORDERS
            </button>          

            <button
              className="w3-button w3-black"
              disabled={this.state.processing}
              onClick={async () => {
                if (!this.state.processing) {                    
                  if (await this.ValidateCustomerData() == true) { 
                    this.setState({processing: true})
                    this.handleOrderApprove()
                  }					
                }
                }}
              >
                {this.state.processing ? 'Processing Order...' : 'ORDER'}
            <br/> US${this.state.TotalPrice}
            </button>

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
                              onClick={() => this.handleReceivePayment()}                          
                              >
                                <FaCcMastercard/> <FaCcVisa/> <br/> Debit Card/Credit Card  <br/> US${this.state.TotalPrice}
                            </button>
                            &nbsp;&nbsp;

                            <button className="w3-button w3-black" onClick={async () => {
                                                                            if (!this.state.processing) {                    
                                                                              if (await this.ValidateCustomerData() == true) { 
                                                                                this.setState({processing: true})
                                                                                this.handleOrderApprove()		
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
