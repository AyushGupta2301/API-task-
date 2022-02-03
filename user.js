var mongoose = require('mongoose');

const refUserSchema = new mongoose.Schema({ // sub Schema of reffered user, this will be used to find the reffered user.
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    }
});

const UserSchema = new mongoose.Schema({ // Schema of User 
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    refferedUser:{ // this is the reference by which 2 documents will be connected. 
        type: refUserSchema,
        default: {}
    },
    isPaymentmade:{
        type: Boolean,
        required: true
    },
    totalEarnings:{
        type: Number,
        required: true
    }

});

module.exports = mongoose.model('User',UserSchema)
