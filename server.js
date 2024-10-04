// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000; // Change this to any port you prefer

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
    const contactData = req.body;

    // Read existing contacts from the file
    fs.readFile(path.join(__dirname, 'contact.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading contact file.' });
        }

        let contacts = [];
        if (data) {
            contacts = JSON.parse(data);
        }

        // Add new contact to the array
        contacts.push(contactData);

        // Write updated contacts back to the file
        fs.writeFile(path.join(__dirname, 'contact.json'), JSON.stringify(contacts, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving contact details.' });
            }
            res.json({ message: 'Contact details submitted successfully!' });
        });
    });
});

// Endpoint to submit an order
app.post('/api/orders', (req, res) => {
    const newOrder = req.body; // Get the order data from the request
    
    newOrder.date =  new Date().toLocaleTimeString();

    // Read existing orders from orders.json
    fs.readFile(path.join(__dirname, 'orders.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading orders file');
        }

        let orders = [];
        if (data) {
            orders = JSON.parse(data); // Parse existing orders
        }

        orders.push(newOrder); // Add the new order to the list

        // Write updated orders back to orders.json
        fs.writeFile(path.join(__dirname, 'orders.json'), JSON.stringify(orders, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving order');
            }
            res.send('Order placed successfully!'); // Send success response
        });
    });
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



            
app.post('/getTotalAmount', (req, res) => {
    let data = JSON.parse(fs.readFileSync("amount.json", 'utf-8'));
    let amount = req.body.amount;
    let fileName = req.body.fileName
    let username = req.body.username

    if (amount && fileName && username) {
        data.push({
            amount: amount,
            fileName: fileName,
            username : username,
            date: new Date().toLocaleString() // Date and time
        });
        fs.writeFileSync("amount.json", JSON.stringify(data,null,2));
    }

    res.status(200).send({ success: true });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
