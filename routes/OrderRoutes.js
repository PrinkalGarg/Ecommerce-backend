import express from "express";
import {
    CodMethod,
    StripeMethod,
    RazorMethod,
    userOrder,
    allOrders,
    updateStatus
} from "../controller/OrderControler.js"; // Check if file name is correct

import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/AdminAuth.js";

const OrderRoute = express.Router();

// Admin Routes
OrderRoute.get('/listadmin',allOrders);
OrderRoute.post('/status', adminAuth, updateStatus);

// Payment Routes
OrderRoute.post('/place',userAuth, CodMethod); 
OrderRoute.post('/userorder',userAuth,userOrder);
OrderRoute.post('/stripe', userAuth, StripeMethod);
OrderRoute.post('/razor', userAuth, RazorMethod);

// Test Route


export { OrderRoute };
