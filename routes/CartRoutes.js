import express from "express"
import {addToCart,updateCart,getUserCart} from "../controller/CartController.js"
const cartRoutes=express.Router();

cartRoutes.post('/get',getUserCart)
cartRoutes.post('/add',addToCart)
cartRoutes.post('/update',updateCart)

export default cartRoutes;