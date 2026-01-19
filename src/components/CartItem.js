import React from 'react'
import {firebase, firestore} from '../config/config.js'

export class CartItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            Discount: 0,
        }
        this.Discount = this.Discount.bind(this);
        
    }

    async componentDidMount() {
        // console.log(this.props.Item)        
        await this.Discount();
        
    }

    async Discount() {
        this.setState({Discount: this.props.Item.Discount});
        await (firestore.collection('Sales').doc('Storewide').get().then(
            snapshot => {
                if( snapshot.data().Discount !== 0) {
                    this.setState({Discount: snapshot.data().Discount});
                    return;
                }
            }
        )
        )
        return;
        
    } 

    
    
    
    render() {
        return (  
            <div className='CartItem'>
                <table className='CartItem'>
                    <tbody>
                        <tr>
                            <td>
                                <img className='ItemImg' src={this.props.Item.ItemImg}/>
                                <br/>
                                <label>{this.props.Item.Name}</label>
                            </td>
                            <td>&nbsp;</td>                        
                            <td>
                                <label>US$ {(this.props.Item.Price*(1-this.state.Discount)).toFixed(2)}</label> {/*  */}
                            </td>
                        </tr>  
                    </tbody>                  
                </table>
                <br/>
            </div>
        )
    }
}


