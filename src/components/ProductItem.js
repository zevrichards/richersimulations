import React from 'react'
// import {BrowserRouter, Switch, Route, Link} from 'react-router-dom'
import {firebase, firestore} from '../config/config.js'

import { ProductImage } from './ProductImage.js'

import Dialog from "@mui/material/Dialog"

export class ProductItem extends React.Component {
    constructor(props) {
        super(props); 
        this.state = {ProductDetailsDialogShow: false,
                    Images: [],
                    Discount: 0}   
        this.GetProductImgs = this.GetProductImgs.bind(this);    
        // this.props.Item = this.props.Item.data();
        // this.handleChange = this.handleChange.bind(this);
        this.Discount = this.Discount.bind(this);
    }

    async GetProductImgs(){
        const imgs = [];

        var listRef = firebase.storage().ref().child('/products/'+this.props.Item.Name);

        listRef.listAll().then((res) => {
                res.items.forEach((itemRef) => {
                    itemRef.getDownloadURL().then((URL) => {
                        imgs.push(URL);
                    })
                })
            })      

        this.setState({Images: imgs})
    }

    async componentDidUpdate(prevProps) {
        if (prevProps !== this.props) {
            await this.GetProductImgs();            
            

        }
    }

    async componentDidMount() {
        await this.GetProductImgs();
        await this.Discount();
    }

    async Discount() {
        this.setState({Discount: this.props.Item.Discount});
        await (firestore.collection('Sales').doc('Storewide').get().then(
            snapshot => {
                if( snapshot.data().Discount !== 0) {
                    this.setState({Discount: snapshot.data().Discount, SaleName: snapshot.data().Name});
                    return;
                }
            }
        )
        )
        return;
        
    }         
    
    
    render() {
        const closeDialog = () => {
            this.setState({ProductDetailsDialogShow: false});
          };
      
        const openDialog = () => {
            this.setState({ProductDetailsDialogShow: true});
        }; 

        // const discount = this.Discount();
    
        const ProductDetailsDialog = this.state.ProductDetailsDialogShow
        &&
        <Dialog className="w3-display-container" onClose = {closeDialog} open = {this.state.ProductDetailsDialogShow} fullWidth maxWidth="lg">      
        <br/>
        <center>
            <h2>{this.props.Item.Name}</h2>
        </center>
            <br/>
            <div>
                <ProductImage Item={this.props.Item} Images={this.state.Images}/>
            </div>
            <br/>
            <h3><b>Description</b></h3>
            <div dangerouslySetInnerHTML={{__html: this.props.Item.Description}}></div>
        </Dialog>
        
        return (
            <div className="w3-col l2 s6">
                <div onClick={()=> openDialog()} className="w3-container">
                    
                    <div className="w3-display-container">
                        <img src={this.props.Item.ItemImg} alt="" style={{width:"100%"}} ></img> {/*  */}
                        
                        {this.props.Item.Discount !== 0 &&
                        <span className="w3-tag w3-display-topleft"><label className="notice">SALE</label></span> }

                        {this.state.Discount !== 0 &&
                        <span className="w3-tag w3-display-topleft"><label className="notice">{this.state.SaleName}</label></span> }
                        
                        <div className="w3-display-middle w3-display-hover">
                            <button className="w3-button w3-black" onClick={() => this.props.handleAddToCart()} >Buy now <i className="fa fa-shopping-cart"></i></button>
                        </div>
                    </div>
                    <p>{this.props.Item.Name}
                    <br/>

                    {this.props.Item.Discount!==0 && 
                        (
                        <>
                        {/* <label className="notice">{(this.props.Item.Discount*100).toFixed(0)}% Off</label> */}
                        <label className="notice">{(this.state.Discount*100).toFixed(0)}% Off</label>
                        <br/>
                        <s>${this.props.Item.Price}</s>                        
                        </>)
                    }
                    {/* <b> ${(this.props.Item.Price*(1-this.props.Item.Discount)).toFixed(2)}</b> */}
                    <b> ${(this.props.Item.Price*(1-this.state.Discount)).toFixed(2)}</b>
                    </p>
                </div>

                {ProductDetailsDialog}

            </div>

            
        )
    }
}
