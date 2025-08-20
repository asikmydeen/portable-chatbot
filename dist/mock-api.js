/**
 * Mock API Server for GitHub Pages Demo
 * Provides realistic AI responses without requiring a backend server
 */
(function() {
    'use strict';

    // Mock responses for different types of queries
    const mockResponses = [
        "I'm a demo AI assistant! I can help you with various questions and tasks. What would you like to know?",
        "This is a simulated response from the Professional AI Chatbot. In a real implementation, I would be powered by your choice of AI model through your backend API.",
        "Great question! As a demo bot, I can show you how markdown formatting works:\n\n**Bold text**\n*Italic text*\n\n```javascript\nconsole.log('Code highlighting!');\n```\n\nAnd even lists:\n- Feature 1\n- Feature 2\n- Feature 3",
        "I notice this is a demo environment. The chatbot supports:\n\n🎨 **Rich Formatting** - Markdown and code highlighting\n📁 **File Uploads** - Attach documents and images\n🎯 **Customizable** - Themes, sizing, positioning\n💾 **Export** - Download conversation history\n🌙 **Dark Mode** - Light/dark theme switching",
        "This chatbot component is built with vanilla JavaScript and can be integrated into any web application. It's framework-agnostic and works with React, Vue, Angular, or plain HTML!",
    ];

    const codeExamples = [
        "Here's a Python example:\n\n```python\ndef hello_world():\n    print('Hello from the AI Chatbot!')\n    return 'Demo response'\n\nhello_world()\n```",
        "And here's some JavaScript:\n\n```javascript\nconst chatbot = createChatbot({\n    endpoint: '/api/chat',\n    theme: 'dark',\n    heading: 'My AI Assistant'\n});\n\nchatbot.show();\n```",
        "CSS styling example:\n\n```css\n.my-custom-theme {\n    --primary-color: #6366f1;\n    --background: #f8fafc;\n    border-radius: 16px;\n}\n```"
    ];

    const technicalResponses = [
        "The chatbot uses modern web standards including:\n\n- **Web Components** for encapsulation\n- **CSS Custom Properties** for theming\n- **Intersection Observer** for performance\n- **File API** for attachments\n- **Local Storage** for persistence",
        "Performance optimizations include:\n\n✅ Lazy loading of resources\n✅ Efficient DOM manipulation\n✅ Debounced resize handlers\n✅ Minimal bundle size (31.3KB)\n✅ Tree-shakeable modules",
    ];

    // Simulate network delay
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Generate contextual response based on message content
    function generateResponse(message) {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('code') || lowerMsg.includes('javascript') || lowerMsg.includes('python')) {
            return codeExamples[Math.floor(Math.random() * codeExamples.length)];
        }
        
        if (lowerMsg.includes('technical') || lowerMsg.includes('performance') || lowerMsg.includes('optimize')) {
            return technicalResponses[Math.floor(Math.random() * technicalResponses.length)];
        }
        
        if (lowerMsg.includes('how') && (lowerMsg.includes('work') || lowerMsg.includes('integrate'))) {
            return "Integration is simple! Just include the script and initialize:\n\n```html\n<script src=\"portable-chatbot.js\" \n        data-chatbot-endpoint=\"/api/chat\"\n        data-chatbot-heading=\"My Bot\"></script>\n```\n\nOr programmatically:\n\n```javascript\nconst bot = createChatbot({\n    endpoint: '/api/chat',\n    theme: 'dark'\n});\n```";
        }
        
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }

    // Create mock fetch interceptor
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options = {}) {
        // More robust URL matching for demo API calls
        const isApiCall = (typeof url === 'string' && url.includes('/api/chat')) || 
                         (url instanceof URL && url.pathname.includes('/api/chat')) ||
                         (typeof url === 'string' && url.endsWith('/api/chat'));
        
        if (isApiCall) {
            console.log('🎭 INTERCEPTING API call for demo:', url);
            
            await delay(300 + Math.random() * 500); // Simulate shorter network delay
            
            try {
                const body = options.body;
                let messages = [];
                
                if (body instanceof FormData) {
                    // Handle file uploads in demo
                    const files = [];
                    for (let [key, value] of body.entries()) {
                        if (key.startsWith('file_')) {
                            files.push(value.name);
                        }
                    }
                    
                    const fileResponse = files.length > 0 
                        ? `I can see you've uploaded: **${files.join(', ')}**\n\nIn a real implementation, I would analyze these files. For this demo, I'm just acknowledging them!`
                        : generateResponse('file upload');
                        
                    return new Response(JSON.stringify({
                        choices: [{
                            message: {
                                content: fileResponse
                            }
                        }]
                    }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                let data = {};
                if (typeof body === 'string') {
                    try {
                        data = JSON.parse(body);
                        messages = data.messages || [];
                    } catch (e) {
                        console.warn('Failed to parse request body:', e);
                    }
                }
                
                const lastMessage = messages[messages.length - 1];
                const userMessage = lastMessage ? lastMessage.content : 'Hello';
                const response = generateResponse(userMessage);
                
                // Simulate streaming response
                if (data.stream) {
                    const chunks = response.split(' ');
                    let responseText = '';
                    
                    const stream = new ReadableStream({
                        start(controller) {
                            let i = 0;
                            const timer = setInterval(() => {
                                if (i < chunks.length) {
                                    const content = i === 0 ? chunks[i] : ' ' + chunks[i];
                                    
                                    // Use the correct format that the chatbot expects
                                    const chunkData = {
                                        content: content
                                    };
                                    
                                    const chunk = `data: ${JSON.stringify(chunkData)}\n\n`;
                                    console.log('📤 Sending chunk:', chunk);
                                    controller.enqueue(new TextEncoder().encode(chunk));
                                    i++;
                                } else {
                                    // Send done signal
                                    controller.enqueue(new TextEncoder().encode('data: {"done": true}\n\n'));
                                    controller.close();
                                    clearInterval(timer);
                                }
                            }, 50 + Math.random() * 100);
                        }
                    });
                    
                    return new Response(stream, {
                        status: 200,
                        headers: { 
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive'
                        }
                    });
                }
                
                // For non-streaming, send as SSE format anyway since that's what the chatbot expects
                const streamData = `data: ${JSON.stringify({ content: response })}\n\ndata: ${JSON.stringify({ done: true })}\n\n`;
                return new Response(streamData, {
                    status: 200,
                    headers: { 
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    }
                });
                
            } catch (error) {
                console.error('Mock API error:', error);
                return new Response(JSON.stringify({
                    error: 'Demo API simulation error'
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // For all other requests, use original fetch
        return originalFetch.call(this, url, options);
    };
    
    // Also try to intercept any fetch calls made with full URLs
    const originalGlobalFetch = globalThis.fetch;
    globalThis.fetch = window.fetch;

    console.log('🎭 Mock API loaded for GitHub Pages demo');
    
    // Expose a test function for debugging
    window.testMockAPI = async function() {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'test' }],
                    stream: true
                })
            });
            console.log('Test response:', response);
            return response;
        } catch (error) {
            console.error('Test failed:', error);
        }
    };
    
    // Add demo indicator
    function addDemoIndicator() {
        if (document.getElementById('demo-indicator')) return; // Prevent duplicates
        
        const indicator = document.createElement('div');
        indicator.id = 'demo-indicator';
        indicator.innerHTML = '🎭 Demo Mode Active';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #10b981;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;
        document.body.appendChild(indicator);
    }
    
    // Add indicator when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDemoIndicator);
    } else {
        addDemoIndicator();
    }
})();