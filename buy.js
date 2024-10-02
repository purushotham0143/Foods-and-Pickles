document.getElementById('upiForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the default form submission behavior

    const upiId = document.getElementById('upiId').value;
    const messageDiv = document.getElementById('message');

    // Simple validation to check if UPI ID is valid
    if (!validateUPI(upiId)) {
        messageDiv.innerHTML = '<p class="error-message">Invalid UPI ID. Please enter a valid UPI ID.</p>';
        return;
    }

    // Simulate the payment process
    messageDiv.innerHTML = '<p class="success-message">Processing your payment...</p>';

    // Simulate delay for payment processing (e.g., 3 seconds)
    setTimeout(function() {
        // Show success message
        messageDiv.innerHTML = '<p class="success-message">Payment Successful! Thank you for your purchase.</p>';
        
        // Optional: Redirect to a success page or show confirmation details
        // window.location.href = 'success.html'; // Uncomment if you have a success page

    }, 3000); // 3 seconds delay for simulation
});

// UPI ID validation function
function validateUPI(upiId) {
    const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiPattern.test(upiId);
}
