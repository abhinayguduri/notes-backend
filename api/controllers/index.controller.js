
exports.indexHandler = (req, res, next) => {
    res.status(200).json({
      message: "Welcome to the Notes Backend API!",
      status: "good",
      author:{
        name:"Abhinay Guduri",
        email:"guduriabhinay@gmail.com",
        phone:"+1 (647)-819-5889"
      }
    });
  };

  