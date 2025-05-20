const express = require('express');
const router = express.Router();
const { isToken } = require('../middlewares/token_validator');  // Your existing middleware for token validation

// Inside the route handler for /validate-token
router.get('/validate-token', isToken, (req, res) => {
    console.log('Token validation route accessed');  // Debug log
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
        'Pragma': 'no-cache', // For HTTP/1.0 compatibility
        'Expires': '0' // Ensure that the response is not cached
    });

    res.json({
        message: 'Token is valid',
        code: 200
    });
});

module.exports = router;
