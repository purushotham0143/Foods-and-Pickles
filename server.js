// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000; // Change this to any port you prefer
// MongoDB connection
mongoose.connect('mongodb+srv://rpurushotham0143:1234@cluster0.ivuxpys.mongodb.net/krishikapickles?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

  
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.once('open', () => {
    console.log('Connected to MongoDB');
  });
  
  // Define the contact schema
  const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
  });
  // Define the order schema
  const orderSchema = new mongoose.Schema({
    customerName: String,
    companyName: String,
    address: {
        street: String,
        apartment: String,
        city: String,
        state: String,
        zip: String,
        country: String,
    },
    contactInfo: {
        phone: String,
        email: String,
    },
    orderDetails: {
        items: Array,
        total: String,
        screenshot: Boolean,
        orderTime: String,
    },
});
// Define the amount schema
const amountSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    fileName: { type: String, required: true },
    username: { type: String, required: true },
    date: { type: Date, default: Date.now } // Automatically add the current date and time
});


// Create a model for the amount collection
const Amount = mongoose.model('Amount', amountSchema);

// Create a model for the orders collection
const Order = mongoose.model('Order', orderSchema);

  // Create a model for the contact collection
  const Contact = mongoose.model('Contact', contactSchema);
  
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads')); // Update the path to include __dirname
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Rename file with timestamp
    }
});

const upload = multer({ 
    dest : path.join(__dirname,'uploads'),
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        if (extName && mimeType) {
            cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});


app.post('/upload-screenshot', upload.single('paymentScreenshot'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.json({ success: true, message: 'File uploaded successfully', filePath: `/uploads/${req.file.filename}` });
});


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('./'))  // Serve static files from the "public" directory
app.use('/uploads', express.static('uploads')); // Serve uploaded images from the "uploads" directory

// Endpoint to submit a review


app.get('/',(req,res) => {
    res.sendFile('Home.html',{root:'./'})
})

app.post('/submit-review', upload.single('reviewImage'), (req, res) => {
    const reviewData = req.body;
    const imageURL = req.file ? `/uploads/${req.file.filename}` : ''; // Get the uploaded image URL

    // Create a review object with image URL
    const review = {
        name: reviewData.name,
        review: reviewData.review,
        rating: reviewData.rating,
        imageURL: imageURL
    };

    // Read existing reviews
    fs.readFile(path.join(__dirname, 'reviews.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading reviews file.' });
        }

        const reviews = JSON.parse(data);
        reviews.push(review); // Add the new review

        // Write updated reviews back to the file
        fs.writeFile(path.join(__dirname, 'reviews.json'), JSON.stringify(reviews, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving review.' });
            }
            res.json({ message: 'Review submitted successfully!' });
        });
    });
});


app.post('/submit-contact', (req, res) => {
    const contactData = new Contact({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message,
    });

    contactData
        .save()
        .then(() => res.status(200).json({ message: 'Contact saved successfully' }))
        .catch((error) => {
            console.error('Error saving contact:', error);
            res.status(400).json({ error });
        });
});


// Endpoint to submit an order and store it in MongoDB
// Async/Await for cleaner code
// Endpoint to submit an order and store it in MongoDB

app.post('/api/orders', async (req, res) => {
    try {
        // Directly accept the complete body
        const {
            firstName,
            lastName,
            companyName,
            country,
            streetAddress,
            apartment,
            city,
            state,
            zip,
            phone,
            email,
            orderItems,
            orderTotal,
            screenshot,
            date,
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !orderItems || !orderTotal) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        console.log('Received Order Data:', req.body);

        // Create a new order document
        const newOrder = new Order({
            customerName: `${firstName} ${lastName}`,
            companyName,
            address: {
                street: streetAddress,
                apartment,
                city,
                state,
                zip,
                country,
            },
            contactInfo: {
                phone,
                email,
            },
            orderDetails: {
                items: orderItems,
                total: orderTotal,
                screenshot,
                orderTime: date,
            },
        });

        // Save to MongoDB
        await newOrder.save();

        // Respond with success
        res.status(200).json({ message: 'Order placed successfully!' });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Internal server error. Could not place the order.' });
    }
});



// Endpoint to get all reviews
app.get('/reviews.json', (req, res) => {
    fs.readFile(path.join(__dirname, 'reviews.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading reviews file.' });
        }
        res.json(JSON.parse(data));
    });
});



app.post('/getTotalAmount', async (req, res) => {
    try {
        const { amount, fileName, username } = req.body;

        // Validate input
        if (!amount || !fileName || !username) {
            return res.status(400).json({ success: false, error: 'All fields are required.' });
        }

        // Create a new Amount entry
        const newAmount = new Amount({ amount, fileName, username });

        // Save to MongoDB
        await newAmount.save();
        res.status(200).json({ success: true, message: 'Amount data saved successfully!' });

    } catch (error) {
        console.error('Error saving amount data:', error);
        res.status(500).json({ success: false, error: 'Failed to save amount data.' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
