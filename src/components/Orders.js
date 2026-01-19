import React from 'react'
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom'

import {firestore, Timestamp} from '../config/config.js'

import {CartItem} from './CartItem.js'
import PayPal from './PayPal.js'

//icons
import { MdRemoveShoppingCart, MdTungsten } from "react-icons/md"
import { RiDownloadFill , RiEmotionSadLine } from "react-icons/ri"
import {IoMdDownload } from 'react-icons/ri'
import { FaPaypal, FaCcVisa, FaCcMastercard } from 'react-icons/fa'

export class Orders extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      CustomerName: '',
      Email: '',
      Items:[],
      TotalPrice:0,
    }; 
    this.GetOrders = this.GetOrders.bind(this);    
    this.CustomizeState = this.CustomizeState.bind(this);
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
    const ItemsArray = [];
    var TotalPrice = 0;
    // this.setState({Items: []});


    if (!this.props.user) return;

    // Fetch all orders
    const Orders = await firestore.collection("Users").doc(this.props.user.uid).collection("Orders").get();

    // Wait for ALL orders
    await Promise.all(
      Orders.docs.map(async (Orderdoc) => {
        const Items = await firestore.collection("Users").doc(this.props.user.uid).collection("Orders").doc(Orderdoc.data().OrderNumber).collection("Items").get();

        // Wait for ALL items in this order
        await Promise.all(
          Items.docs.map(async (Itemdoc) => {
            const ProductSnapshot = await firestore.collection("Products").doc(Itemdoc.data().Name).get();

            const ReplacementURLdoc = ProductSnapshot.data();

            ItemsArray.push({...Itemdoc.data(),URL: ReplacementURLdoc.URL});
            // console.log(Itemdoc.data().URL, ReplacementURLdoc.URL)

            TotalPrice += Itemdoc.data().Price * (1 - Itemdoc.data().Discount);

            console.log("pushed an item: ", ItemsArray);
          })
        );
      })
    );

    //This only runs after ALL async work is done
    this.setState({
      Items: ItemsArray,
      TotalPrice: TotalPrice.toFixed(2),
    });

    console.log("final state: ", this.state.Items);
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
    // if (this.props.location.search != '') {
    //   const params = new URLSearchParams(this.props.location.search);

    //   if (params.get('handleOrderApprove')) {           
    //     console.log('Return URL from Fygaro payment button') 
    //     if (this.state.Items.length > 0) {
    //       this.handleOrderApprove()
    //     }
    //   } 
    }
  



  render() {

    return (
    <>

      {(!this.props.user || this.props.user.isAnonymous) ? (

      <div>
        <a href='/SignIn'><button className="w3-button w3-black">Please Sign In to see your Orders.</button></a>
      </div>

      ) : (

      <div>
        { (this.state.Items.length === 0) ? (
            <a href='/' className="w3-button w3-black">You havent placed any orders yet. <RiEmotionSadLine/>  Let's fix that.</a>
        ) : (
            <>

            <table className='center'>
              <tbody>
                  {this.state.Items.map((product) => (
                          
                              <tr key={product.Name}>
                                  <td>
                                    <CartItem Item={product}/>
                                  </td>
                                  <td> 
                                    <a class="w3-button w3-yellow" href={product.URL}><RiDownloadFill  size={32}/></a>
                                  </td>
                              </tr>
                                
                          
                      ))  }                           
                  </tbody>
              </table>
              </>
        )
                        }

      </div>

      ) }                    


    </>
      
      
    )
  }
}
