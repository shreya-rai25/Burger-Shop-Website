import mongoose from "mongoose";
import express, { urlencoded } from "express";
import cors from "cors";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(urlencoded({ extended: true, limit: '10mb' }));

mongoose
  .connect("mongodb://localhost:27017/burgerMart")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Database connection error:", err)
  );

const signupSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  profilePic: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
  }
});

const signupCollection = mongoose.model("users", signupSchema);

app.post("/signup1", (req, res) => {
  signupCollection.findOne({ email: req.body.email }).then((isPresent) => {
    if (isPresent) 
    {
      res.send("Email Address Already in use!");
    } 
    else 
    {
      const newAccount = new signupCollection(req.body);
      newAccount.save().then((issaved) => {
        if (issaved) 
        {
          res.send("Account created successfully");
        } 
        else 
        {
          res.send("error");
        }
      });
    }
  });
});

app.post("/login1", (req, res) => {
  signupCollection.findOne({ email: req.body.email, password: req.body.password })
    .then((user) => 
    {
      if (user) 
      {
        res.status(200).send(user);
      } 
      else 
      {
        res.status(200).send("notfound");
      }
    })
    .catch(() => res.status(500).send("error"));
});

app.get("/getProfile", async (req, res) => {
  const { email } = req.query;
  try {
    const user = await signupCollection.findOne({ email: email });
    if (user) 
    {
      res.status(200).json(user);
    } 
    else 
    {
      res.status(404).send("notfound");
    }
  } 
  catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/updateProfile", async (req, res) => {
  const { email, username, phone, address, password, profilePic } = req.body;
  try {
    const updatedUser = await signupCollection.findOneAndUpdate(
      { email: email },
      {
        name: username, 
        phone,
        address,
        password,
        profilePic
      },
      { new: true } 
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send("update_failed");
  }
});

const cartSchema = new mongoose.Schema({
  itemId: Number,
  image: String,
  name: String,
  price: Number,
  quantity: Number,
  userEmail: String
});

const productCollection = mongoose.model("Cart", cartSchema);

app.post("/cart", (req, res) => {
  productCollection.findOne({ itemId: req.body.itemId }).then((alreadyAddedToCart) => {
    if (alreadyAddedToCart) 
    {
      res.send("Product is already in your cart");
    } 
    else 
    {
      const newCartItem = new productCollection(req.body);
      newCartItem.save().then((isAddedToCart) => {
        isAddedToCart ? res.send("Product added to cart successfully") : res.status(400).send("Failed to add product to cart");
      }).catch(() => res.status(500).send("Error saving to database"));
    }
  });
});

app.get("/cartItem", async (req, res) => {
  try {
    const { userEmail } = req.query;
    const userCart = await productCollection.find({ userEmail: userEmail });
    res.status(200).send(userCart);
  } catch (error) {
    res.status(500).send("Error fetching cart");
  }
});

app.delete("/deleteCart", async (req, res) => {
  const { itemId, userEmail } = req.query;
  try {
    const isItemRemoved = await productCollection.findOneAndDelete({ itemId: itemId, userEmail: userEmail });
    isItemRemoved ? res.send("Item removed successfully") : res.status(404).send("Item not found");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

const orderSchema = new mongoose.Schema({
  userEmail: String,
  items: Array,
  totalAmount: Number,
  address: String,
  paymentMethod: String,
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: "Confirmed" }
});

const OrderCollection = mongoose.model("Order", orderSchema);

app.post("/placeOrder", async (req, res) => {
  try {
    const { userEmail, items, totalAmount, paymentMethod, address } = req.body;
    const newOrder = new OrderCollection({ userEmail, items, totalAmount, paymentMethod, address });
    const savedOrder = await newOrder.save();
    if (savedOrder) 
    {
      await productCollection.deleteMany({ userEmail: userEmail });
      res.status(200).send("Order placed successfully and cart cleared");
    } 
    else 
    {
      res.status(400).send("Failed to place order");
    }
  } 
  catch (error) {
    res.status(500).send("Server error while placing order");
  }
});

app.get("/getOrders", async (req, res) => {
  try {
    const { userEmail } = req.query;
    const userOrders = await OrderCollection.find({ userEmail: userEmail }).sort({ orderDate: -1 });
    res.status(200).json(userOrders);
  } 
  catch (error) {
    res.status(500).send("Error fetching order history");
  }
});

const feedbackSchema = new mongoose.Schema({
  username: { type: String, default: "Anonymous" },
  email: String,
  burgerName: String,
  rating: { type: Number, default: 5 },
  title: String,
  review: String,
  image: String,
  date: { type: Date, default: Date.now }
});

const FeedbackCollection = mongoose.model("Feedback", feedbackSchema);

app.post("/submitFeedback", async (req, res) => {
  try {
    const newFeedback = new FeedbackCollection(req.body);
    await newFeedback.save();
    res.status(200).send("Success");
  } catch (error) { res.status(500).send("Error"); }
});

app.get("/allReviews", async (req, res) => {
  try {
    const reviews = await FeedbackCollection.find().sort({ date: -1 });
    res.status(200).json(reviews);
  } catch (error) { res.status(500).send("Error"); }
});

app.listen(7000, () => 
  console.log("Server started at port 7000")
);