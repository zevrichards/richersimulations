import React from 'react'
// import {useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// import {firebase} from '../config/config.js'

export class ProductImage extends React.Component {
    constructor(props) {
        super(props);       
    }


    render(){   
        // console.log(this.state.images)    
        return (
            <>
                <div className="w3-display-container"> 
                    <center>
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={50}
                        slidesPerView={1}
                        navigation
                        pagination={{ clickable: true }}
                        scrollbar={{ draggable: true }}
                        >
                            {this.props.Images.map((Image) => (                                 
                                <SwiperSlide key={Image}><img width='100%' height="undefined" className="w3-display-container" src={Image} alt={Image}/></SwiperSlide>                                                    
                            ))
                            }
                    </Swiper>
                    </center> 
            </div>
          </>


            
            )
    }
}