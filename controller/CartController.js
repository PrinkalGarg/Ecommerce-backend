import Customer from "../models/Customer.js";

const addToCart=async(req,res)=>
{
//     try {
      
//    const{userId,itemId,size}=req.body;
//    const userData=await Customer.findById(userId)
//    const cartdata=await userData.cartdata;
//    if(cartdata[itemId])
//    {
//     if(cartdata[itemId][size])
//     {
//         cartdata[itemId][size]+=1;
//     }
//     else{
//         cartdata[itemId][size]=1;
//     }
//    }
//    else{
//     cartdata[itemId]={}
//     cartdata[itemId][size]=1;
//    }

//    await Customer.findByIdAndUpdate(userId,{cartdata})


//     } catch (error) {
        
//     }
console.log("Hello");

    
}
const updateCart=async(req,res)=>
    {
        console.log("update Cart");
        
    }
    const getUserCart=async(req,res)=>
        {
            console.log("update Cart");
            
        }

export {addToCart,updateCart,getUserCart}
