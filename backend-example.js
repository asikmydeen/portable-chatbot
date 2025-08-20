/**
 * Sample Backend for Portable AI Chatbot
 * 
 * This is a simple Express.js server that provides a chat API endpoint
 * compatible with the portable chatbot. It demonstrates both streaming
 * and non-streaming responses.
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        // Accept images and documents
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
    }
});

// Middleware
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for testing the chatbot)
app.use(express.static('.'));

// Mock AI responses for demonstration
const mockResponses = [
    "Hello! I'm a demo AI assistant. How can I help you today?",
    "That's an interesting question! Let me think about that for a moment.",
    "I understand what you're asking. Here's what I think about that topic.",
    "Thanks for sharing that with me. I appreciate your input.",
    "I'm here to help with any questions you might have.",
    "That's a great point! Let me expand on that idea.",
    "I can see why that would be important to you."
];

function getRandomResponse() {
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

function simulateTypingDelay() {
    return Math.random() * 1000 + 500; // 500-1500ms delay
}

// Chat endpoint - handles both streaming and non-streaming
app.post('/api/chat', upload.any(), async (req, res) => {
    try {
        console.log('📨 Received chat request');
        
        // Parse messages (could be in body or form data)
        let messages;
        if (req.body.messages) {
            messages = typeof req.body.messages === 'string' 
                ? JSON.parse(req.body.messages) 
                : req.body.messages;
        } else {
            messages = [];
        }

        // Check for streaming preference
        const isStreaming = req.body.stream === 'true' || req.body.stream === true;
        
        console.log(`💬 Processing ${messages.length} messages, streaming: ${isStreaming}`);
        
        // Handle uploaded files
        if (req.files && req.files.length > 0) {
            console.log(`📎 Received ${req.files.length} files:`);
            req.files.forEach((file, index) => {
                console.log(`  - ${file.originalname} (${file.mimetype})`);
            });
            
            // Clean up uploaded files after processing
            setTimeout(() => {
                req.files.forEach(file => {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error('Error deleting file:', err);
                    });
                });
            }, 5000);
        }

        // Get the last user message for context
        const lastMessage = messages[messages.length - 1];
        const userMessage = lastMessage ? lastMessage.content : '';
        
        // Generate response based on user input
        let response;
        if (userMessage.toLowerCase().includes('file') && req.files?.length > 0) {
            const fileNames = req.files.map(f => f.originalname).join(', ');
            response = `I can see you've uploaded ${req.files.length} file(s): ${fileNames}. I'm a demo bot so I can't actually process files, but in a real implementation, I would analyze them for you!`;
        } else if (userMessage.toLowerCase().includes('code')) {
            response = `Here's a code example:\n\n\`\`\`javascript\nfunction greet(name) {\n    return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("World"));\n\`\`\`\n\nThis function demonstrates basic JavaScript syntax with template literals.`;
        } else if (userMessage.toLowerCase().includes('markdown')) {
            response = `Here's some **markdown** formatting:\n\n# Header 1\n## Header 2\n\n- List item 1\n- List item 2\n\n*Italic text* and **bold text**\n\n> This is a blockquote\n\nAnd here's a [link](https://example.com)!`;
        } else {
            response = getRandomResponse();
        }

        if (isStreaming) {
            // Server-Sent Events streaming response
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Split response into chunks for streaming effect
            const words = response.split(' ');
            let currentResponse = '';

            for (let i = 0; i < words.length; i++) {
                currentResponse += (i > 0 ? ' ' : '') + words[i];
                
                // Send chunk
                res.write(`data: ${JSON.stringify({ content: words[i] + (i < words.length - 1 ? ' ' : '') })}\n\n`);
                
                // Add realistic delay between words
                await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            }

            // Send completion signal
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            
        } else {
            // Simple JSON response
            await new Promise(resolve => setTimeout(resolve, simulateTypingDelay()));
            
            res.json({
                content: response,
                done: true,
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('❌ Chat API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Endpoint to get server info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Portable Chatbot Backend',
        version: '1.0.0',
        features: [
            'Server-Sent Events streaming',
            'File upload support',
            'CORS enabled',
            'Markdown responses',
            'Mock AI responses'
        ],
        endpoints: {
            '/api/chat': 'Main chat endpoint (POST)',
            '/api/health': 'Health check (GET)',
            '/api/info': 'Server information (GET)'
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'Maximum file size is 10MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files',
                message: 'Maximum 5 files allowed'
            });
        }
    }
    
    res.status(500).json({
        error: 'Server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Portable Chatbot Backend running on port ${PORT}`);
    console.log(`📡 Chat endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`💾 Health check: http://localhost:${PORT}/api/health`);
    console.log(`ℹ️  Server info: http://localhost:${PORT}/api/info`);
    console.log(`\n🎯 Ready to handle chatbot requests!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});

module.exports = app;