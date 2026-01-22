import React from 'react'
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom'

import {firestore, Timestamp} from '../config/config.js'

import {CartItem} from './CartItem.js'
import PayPal from './PayPal.js'

//icons
import { MdRemoveShoppingCart, MdTungsten } from "react-icons/md"
import { RiDownloadFill , RiEmotionSadLine, RiDeleteBin5Line } from "react-icons/ri"
import {IoMdDownload } from 'react-icons/ri'
import { FaPaypal, FaCcVisa, FaCcMastercard } from 'react-icons/fa'

export class Orders extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      CustomerName: '',
      Email: '',
      Orders:[],
      TotalPrice:0,
      checkout: false,
      checkoutOrder: '',
      processing: false,
      loaded: false,
    }; 
    this.GetOrders = this.GetOrders.bind(this);    
    this.CustomizeState = this.CustomizeState.bind(this);
    this.handleCancelOrder = this.handleCancelOrder.bind(this);
    this.handlePayPalOrderApprove = this.handlePayPalOrderApprove.bind(this);
    this.handleSendToPayPal = this.handleSendToPayPal.bind(this);
    this.handleSendToPaymentPlatform = this.handleSendToPaymentPlatform.bind(this);
    }

    async componentDidUpdate(prevProps) {      
      if (prevProps !== this.props) {
          ///get the Orders
          if (this.props.user)
          {
              //this is not working on its own for some reason
              await this.GetOrders();                
              //re-render is only occuring when I set state a 2nd time in the following function
              await this.CustomizeState(); 
          }           
      }
  }

  async componentDidMount() {       

      ///get the Orders
      if (this.props.user)
      {
          await this.GetOrders();  
      }
  }
 
  async GetOrders() {
    // const ItemsArray = [];
    
    // this.setState({Items: []});


    if (!this.props.user) return;

    // Fetch all orders
    const Orders = await firestore.collection("Users").doc(this.props.user.uid).collection("Orders").get();

    // Wait for ALL orders
    const OrdersArray = await Promise.all(
      Orders.docs.map(async (Orderdoc) => {
        let TotalPrice = 0;
        const Items = await firestore.collection("Users").doc(this.props.user.uid).collection("Orders").doc(Orderdoc.id).collection("Items").get();

        // Wait for ALL items in this order
        const ItemsArray = await Promise.all(
          Items.docs.map(async (Itemdoc) => {
            // find the actual current product that matcehs this item in the database so we can pull its current download URL which may have changed since the date the purchase was made
            const ProductSnapshot = await firestore.collection("Products").doc(Itemdoc.id).get();

            const ReplacementURLdoc = ProductSnapshot.data();

            TotalPrice += (Itemdoc.data().Price * (1 - Itemdoc.data().Discount));

            // console.log("pushed an item: ", TotalPrice);

            return {...Itemdoc.data(), URL: ReplacementURLdoc.URL}; //this is a promise?
          })
        )

        // console.log("ItemsArray", ItemsArray)

        const orderData = Orderdoc.data()
        return {
          orderNumber: Orderdoc.id,
          status: orderData.status,
          Items: ItemsArray,//Store the ItemsArray within the OrderArray
          amount: orderData.amount || TotalPrice.toFixed(2),
        }

        

      })
    )

    // console.log("OrdersArray", OrdersArray)

    //for sorting order on the page, add more as necessary
    const STATUS_PRIORITY = [
      "Payment Pending",
      "Completed",
      "Cancelled",
      undefined,
    ];

    //This only runs after ALL async work is done
    this.setState({
      Orders: OrdersArray.sort(
        (a, b) =>
          STATUS_PRIORITY.indexOf(a.status) -
          STATUS_PRIORITY.indexOf(b.status)
      ),
      loaded: true,
      // TotalPrice: TotalPrice.toFixed(2),
    });

    // console.log("final state: ", this.state.Orders, this.state.TotalPrice);
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
     
  }

  async handleCancelOrder(orderNumber) {

    this.setState(prevState => ({
      Orders: prevState.Orders.map(order =>
        order.orderNumber === orderNumber
          ? { ...order, status: "Cancelled" }
          : order
      )
    }));
  
    try {
      await firestore
        .collection("Users")
        .doc(this.props.user.uid)
        .collection("Orders")
        .doc(orderNumber)
        .update({status: "Cancelled"});

      await firestore
        .collection("PendingOrders")
        .doc(orderNumber)
        .delete();
    }catch (err) {
      console.error(err);
    }

  }

  async handleSendToPaymentPlatform(amount, orderNumber) { 
        
    async function createJWT(amount, orderNumber) {
        const response = await fetch(
            "https://createfygarojwt-lzd77xsmjq-uc.a.run.app",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: amount,
                    orderNumber: orderNumber,
                  })
            }
        );
    
        const data = await response.json();
        return data.token;
    }

    
                
    this.setState({processing: true});                      
    const token = await createJWT(amount, orderNumber);                    
    window.location.href = "https://www.fygaro.com/en/pb/f70be460-0194-4362-bbb3-3ff31facbdc6/?jwt=" + token
                     
  }

  async handleSendToPayPal(orderNumber) {
    this.setState({checkout: true, checkoutOrder:orderNumber})
  }

  async handlePayPalOrderApprove(orderNumber){
    
    //Update the state to change the current order from pending to paid
    //The cloud function will handle pdating the order from pending to paid on the database side.
    this.setState(prevState => ({
      Orders: prevState.Orders.map(order =>
        order.orderNumber === orderNumber
          ? { ...order, status: "Completed" }
          : order
      ),
      checkout: false,
    }));
  }  



  render() {

    return (
    <>

      {(!this.props.user || this.props.user.isAnonymous) ? (

      <div>
        <a href='/SignIn'><button className="w3-button w3-black">Please Sign In to see your Orders.</button></a>
      </div>

      ) : (
          
        
        (!this.state.loaded) ? (
          
          <span>Loading Orders...</span>
  
        ) : (

        <div>

          <span><b>{this.state.Email}</b></span><br/>
          <span><b>{this.state.CustomerName}</b></span>
          <br/><br/>

          { (this.state.Orders.length === 0) ? (
              <a href='/' className="w3-button w3-black">You havent placed any orders yet. <RiEmotionSadLine/>  Let's fix that.</a>
          ) : (

            <>         
            {this.state.Orders.map((order) => (
              <> 
              <table className="w3-table-all" key={order.orderNumber}>                
                <tbody>
                  <tr>
                    <td colSpan={3}>
                      Order: {order.orderNumber}&nbsp;|&nbsp;<b>{order.status}</b>&nbsp;|&nbsp;Amount: US$<b>{order.amount}</b>
                      &nbsp;|&nbsp;
                      {(order.status === "Payment Pending") &&
                      <>

                      <button
                      className="w3-button w3-blue"
                      onClick={() => this.handleSendToPaymentPlatform(order.amount, order.orderNumber)}                          
                      >
                          {this.state.processing ?
                          ('Processing...')
                          :
                          (<>
                              <FaCcVisa/> Pay Now: Credit/Debit Card
                          </>)
                          }
                      </button>
                      &nbsp;
                      <button
                      className="w3-button w3-blue"
                      onClick={() => this.handleSendToPayPal(order.orderNumber)}                          
                      >
                          <FaPaypal/> Pay Now: PayPal
                      </button>
                      &nbsp;|&nbsp;
                      <button
                      className="w3-button w3-blue"
                      onClick={() => this.handleCancelOrder(order.orderNumber)}                          
                      >
                          <RiDeleteBin5Line/> Cancel Order
                      </button>
                      </>
                      }
                      </td>
                </tr>                         

                {
                order.Items.map((product) => (                            
                        <tr key={product.Name}>
                            <td>
                              <CartItem Item={product}/>
                            </td>
                            <td> 
                              {
                                order.status == "Completed" &&
                              <a class="w3-button w3-yellow" href={product.URL}><RiDownloadFill  size={32}/><br/>Download</a>
                              }
                            </td>
                        </tr>
                          
                    
                ))  }  

                {
                (this.state.checkoutOrder === order.orderNumber)  &&
                <tr key= {order.orderNumber}>
                  <td colSpan={3}>
                    <label className='notice'>Remember to change currency to USD to avoid PayPal's extra fees!</label><br/>
                    <PayPal value={order.amount}
                      orderNumber={order.orderNumber} 
                      OrderApproved={this.handlePayPalOrderApprove}/>
                  </td>
                </tr>
                }
                      
                </tbody>
              </table>   
              
              
              <br/><br/> 
              </>   
              ))  }  

          </>
              
          )
                          }

        </div>
        )
                        

      )
      }

    </>
    )
  }
}
