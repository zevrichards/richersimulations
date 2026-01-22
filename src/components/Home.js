import React from 'react'

import { withRouter } from 'react-router-dom';
import Dialog from "@mui/material/Dialog";

import {firestore} from '../config/config.js'

import { ProductItem } from './ProductItem.js'

class Home extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      AddtoCartDialogShow: false,
      Products: []
    }
    this.GetProducts = this.GetProducts.bind(this);
    this.handleAddToCart = this.handleAddToCart.bind(this);
  }

  async componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
        // await this.GetProducts();  
    }
  }

  async componentDidMount() {
      await this.GetProducts();      
  }

  async GetProducts() {  

    const Items = []
    const query = await firestore.collection('Products').get()
        
    query.forEach((doc) => {
      Items.push(doc.data())
    }
    )

    this.setState({Products: Items});
  }

  async handleAddToCart(item) {

    if (this.props.user == null) {
      await this.props.AnonSignIn().then( (res) => { 
        // console.log(res.user.uid)
        this.AddToCart(res.user.uid, item);
        this.setState({AddtoCartDialogShow: true})
      })
    }
    else
    {
      this.AddToCart(this.props.user.uid, item);
      this.setState({AddtoCartDialogShow: true})
    }

    // try {
    //   await this.props.AnonSignIn();  
    // }
    // catch(err) {
    //   console.log(err)
    // }
    // finally {
    //   this.AddToCart(this.props.user.uid, item);
    //   this.setState({AddtoCartDialogShow: true})
    // }
    
    
  }

  async AddToCart(uid, Item) {
    // console.log(uid);
    if (uid !== null) {
      
      // console.log(item);

        // const doc = await firestore.collection('Products').doc(ItemName).get();
        // console.log(doc.data());
        // const ItemImg = doc.data().ItemImg;

        // console.log(item)
        firestore.collection('Users').doc(uid).collection('Cart').doc(Item.Name).set(Item) 
    }
    
  }

  render() {

    const closeDialog = () => {
      this.setState({AddtoCartDialogShow: false});
    };

    const openDialog = () => {
      this.setState({AddtoCartDialogShow: true});
    }; 

    const AddtoCartDialog = this.state.AddtoCartDialogShow
      &&
      <Dialog onClose = {closeDialog} open = {openDialog}>      
      <br/>
      <center>
        A new item was just added to your cart. {" "}
      </center>
        <br/>
        <div>
          &nbsp;
            <a href="/cart"><button className="w3-button w3-black w3-text-yellow" style={{color: 'yellow'}} onClick = {() => (
              this.setState({AddtoCartDialogShow: false})
              )}> 
              {/* this.props.history.push('/Cart') */}
              View Cart and Checkout
            </button></a>
            &nbsp;
            &nbsp;
            <button className="w3-button w3-black" onClick = {closeDialog}>
              Continue Shopping
            </button>
            &nbsp;
        </div>
        <br/>
      </Dialog>
    
    return (
      <div>
   

  {/* <!-- Image header --> */}
  <div className="w3-display-container w3-container">
    <img src="https://firebasestorage.googleapis.com/v0/b/richersimulations-b57cb.appspot.com/o/banners%2FTDPD%202023%20banner.png?alt=media&token=a5729702-47f6-467b-b514-4b152d8b8343"
      alt="TDPD 2023" style={{width:"100%", height:"undefined"}}></img>
    <div className="w3-display-topleft w3-text-white" style={{padding:"24px 48px"}}>
      <h1 className="w3-jumbo w3-hide-small">Latest Release:</h1>
      <h1 className="w3-hide-small"><b>TDPD 2023 MSFS, XP and P3D</b></h1>
      {/* <h1 className="w3-hide-small">MSFS</h1> */}
      <p><a href="#products" className="w3-button w3-black w3-padding-large w3-large">SHOP NOW</a></p>
    </div>
  </div>

  <div className="w3-container w3-text-grey" id="products">
    <p>{this.state.Products.length} items</p>
  </div>

  {/* <!-- Product grid --> */}
  <div className="w3-row">
  
    {this.state.Products.map((Product) => (      
      <ProductItem key={Product.Name} Item={Product} handleAddToCart={() => this.handleAddToCart(Product)}/>
    )
    )
  }

    {AddtoCartDialog}
    
  </div> 
      </div>
    )
  }
}

export default withRouter(Home);
