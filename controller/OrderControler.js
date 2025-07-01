
import OrderModel from "../models/OrderModel.js"; // Ensure correct model name
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Placing Order Using COD
const CodMethod = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            street,
            city,
            state,
            zipcode,
            country,
            phone,
            paymentMethod,
            cart,
        } = req.body;

        const token = req.headers.token || req.headers.authorization; // Support both 'token' and 'Authorization'
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: Token required" });
        }

        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const orderDetail = {
            firstName,
            lastName,
            email,
            street,
            city,
            state,
            zipcode,
            country,
            phone,
            paymentMethod,
            cart,
            id, // Better to store as userId instead of just id
        };

        const result = await OrderModel.create(orderDetail);

        res.status(201).json({ message: "Order placed successfully", order: result });
    } catch (error) {
        console.error("Error in CodMethod:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


//Stripe Payment Method
const StripeMethod = async (req, res) => {
    console.log("stripe");
};

//Razor Payment method
const RazorMethod = async (req, res) => {
    console.log("razor");
};

//UserOrder display method
const userOrder = async (req, res) => {
    console.log(req.body.userId);
    
    const list=await OrderModel.find({id:req.body.userId});
    if(list.length==0){
        res.status(200).json({message:"No Order Found",status:"False"});}
    else{
        res.status(200).json({message:"Order Found",status:"True",data:list});
    }
};
//Status of the product Update Method.
const updateStatus = async (req, res) => {
    console.log("updateStatus");
    
};

const allOrders = async (req, res) => {
    const orders=await OrderModel.find({});
            res.status(201).json({ message: "Order Details", order: orders });

};
export  {
    CodMethod,
    StripeMethod,
    RazorMethod,
    userOrder,
    updateStatus,allOrders
};