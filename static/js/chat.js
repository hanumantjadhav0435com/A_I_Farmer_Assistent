// Chat functionality for AI Farming Assistant
class ChatAssistant {
    constructor() {
        this.currentSessionId = null;
        this.isTyping = false;
        this.messageInput = document.getElementById('messageInput');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Message input handling
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize textarea
            this.messageInput.addEventListener('input', () => {
                this.messageInput.style.height = 'auto';
                this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
            });
        }
        
        // Category tab handling
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all tabs and contents
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.category-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const category = tab.getAttribute('data-category');
                const content = document.getElementById(`${category}-content`);
                if (content) {
                    content.classList.add('active');
                }
            });
        });
        
        // Language change handling
        document.querySelectorAll('[onclick*="changeLanguage"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const language = e.target.getAttribute('onclick').match(/changeLanguage\('(.+?)'\)/)[1];
                this.changeLanguage(language);
            });
        });
    }
    
    async sendMessage() {
        let message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Get category-specific parameters
        const categoryData = this.getCategoryData();
        if (categoryData.category && categoryData.parameters) {
            // Build enhanced message with category context
            message = this.buildCategoryMessage(message, categoryData);
        }
        
        // Clear input and show user message
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const response = await fetch('/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.currentSessionId,
                    category: categoryData.category,
                    parameters: categoryData.parameters
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update session ID if new session was created
                if (data.session_id && !this.currentSessionId) {
                    this.currentSessionId = data.session_id;
                }
                
                // Add AI response
                this.addMessage('assistant', data.ai_response.content);
            } else {
                this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
                console.error('Error:', data.error);
            }
        } catch (error) {
            console.error('Network error:', error);
            this.addMessage('assistant', 'Sorry, I\'m having trouble connecting. Please check your internet connection and try again.');
        } finally {
            this.hideTypingIndicator();
        }
    }
    
    getCategoryData() {
        const activeTab = document.querySelector('.category-tab.active');
        if (!activeTab) return { category: null, parameters: {} };
        
        const category = activeTab.getAttribute('data-category');
        const parameters = {};
        
        // Get all form inputs for the active category
        const activeContent = document.querySelector('.category-content.active');
        if (activeContent) {
            const inputs = activeContent.querySelectorAll('select, input');
            inputs.forEach(input => {
                if (input.value) {
                    const paramName = input.id.replace(`${category}-`, '');
                    parameters[paramName] = input.value;
                }
            });
        }
        
        return { category, parameters };
    }
    
    buildCategoryMessage(userMessage, categoryData) {
        const { category, parameters } = categoryData;
        
        if (!category || Object.keys(parameters).length === 0) {
            return userMessage;
        }
        
        let enhancedMessage = userMessage;
        
        // Add context based on category and parameters
        const contextParts = [];
        
        if (parameters.crop) {
            contextParts.push(`Crop: ${parameters.crop}`);
        }
        if (parameters.soil) {
            contextParts.push(`Soil type: ${parameters.soil}`);
        }
        if (parameters.size) {
            contextParts.push(`Farm size: ${parameters.size} acres`);
        }
        if (parameters.stage) {
            contextParts.push(`Growth stage: ${parameters.stage}`);
        }
        if (parameters.season) {
            contextParts.push(`Season: ${parameters.season}`);
        }
        if (parameters.method) {
            contextParts.push(`Irrigation method: ${parameters.method}`);
        }
        if (parameters.problem) {
            contextParts.push(`Problem type: ${parameters.problem}`);
        }
        if (parameters.treatment) {
            contextParts.push(`Treatment preference: ${parameters.treatment}`);
        }
        if (parameters.severity) {
            contextParts.push(`Severity: ${parameters.severity}`);
        }
        if (parameters.climate) {
            contextParts.push(`Climate: ${parameters.climate}`);
        }
        if (parameters.topic) {
            contextParts.push(`Topic: ${parameters.topic}`);
        }
        
        if (contextParts.length > 0) {
            const context = contextParts.join(', ');
            enhancedMessage = `${userMessage}\n\nContext: ${context}\nCategory: ${category}`;
        }
        
        return enhancedMessage;
    }
    
    sendQuickMessage(message) {
        if (this.messageInput) {
            this.messageInput.value = message;
            this.sendMessage();
        }
    }
    
    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (type === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
            messageContent.textContent = content;
        } else {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
            // Parse content for better formatting
            messageContent.innerHTML = this.formatAIResponse(content);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        if (this.chatMessages) {
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
        }
    }
    
    formatAIResponse(content) {
        // Convert markdown-like formatting to HTML
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
        
        // Format lists
        formatted = formatted.replace(/^\s*-\s+(.+)/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Format numbered lists
        formatted = formatted.replace(/^\s*\d+\.\s+(.+)/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
        
        return formatted;
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'block';
            this.scrollToBottom();
        }
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }
    
    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    

    
    clearChat() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
    }
    
    addWelcomeMessage() {
        const welcomeMessage = `Welcome to AI Farming Assistant! 🌱

I'm here to help you with:
• 🧪 Fertilizer recommendations
• 💧 Watering schedules
• 🐛 Pest control advice
• 🌾 General farming guidance

Ask me anything about your farming needs!`;
        
        this.addMessage('assistant', welcomeMessage);
    }
    
    changeLanguage(language) {
        // Update language preference
        fetch('/api/change-language', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ language: language })
        }).then(response => {
            if (response.ok) {
                // Show success message
                this.showNotification(`Language changed to ${language}`, 'success');
                
                // Update language dropdown text
                const languageNames = {
                    'english': 'English',
                    'hindi': 'हिंदी',
                    'marathi': 'मराठी'
                };
                
                const dropdownBtn = document.getElementById('languageDropdown');
                if (dropdownBtn) {
                    dropdownBtn.innerHTML = `<i class="fas fa-language me-1"></i>${languageNames[language]}`;
                }
            }
        }).catch(error => {
            console.error('Error changing language:', error);
            this.showNotification('Error changing language', 'error');
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    async getCropSuggestions(soilType, location) {
        try {
            const response = await fetch('/api/crop-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    soil_type: soilType,
                    location: location
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addMessage('assistant', data.suggestions);
            } else {
                this.addMessage('assistant', 'Sorry, I couldn\'t provide crop suggestions at this time.');
            }
        } catch (error) {
            console.error('Error getting crop suggestions:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error while getting crop suggestions.');
        }
    }
}

// Global functions for HTML onclick handlers
function sendQuickMessage(message) {
    if (window.chatAssistant) {
        window.chatAssistant.sendQuickMessage(message);
    }
}

function sendMessage() {
    if (window.chatAssistant) {
        window.chatAssistant.sendMessage();
    }
}

function changeLanguage(language) {
    if (window.chatAssistant) {
        window.chatAssistant.changeLanguage(language);
    }
}

function startNewChat() {
    if (window.chatAssistant) {
        window.chatAssistant.currentSessionId = null;
        window.chatAssistant.clearChat();
        window.chatAssistant.addWelcomeMessage();
    }
}

// Initialize chat assistant when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chatAssistant = new ChatAssistant();
    
    // Add smooth scrolling to chat messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.style.scrollBehavior = 'smooth';
    }
    
    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.type === 'submit') {
                const originalText = this.innerHTML;
                this.innerHTML = '<span class="loading-spinner me-2"></span>Processing...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 2000);
            }
        });
    });
    
    // Add hover effects to message bubbles
    document.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('message-content')) {
            e.target.style.transform = 'scale(1.02)';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.classList.contains('message-content')) {
            e.target.style.transform = 'scale(1)';
        }
    });
    
    // Add copy functionality to AI responses
    document.addEventListener('dblclick', function(e) {
        if (e.target.closest('.message.assistant .message-content')) {
            const text = e.target.textContent;
            navigator.clipboard.writeText(text).then(() => {
                if (window.chatAssistant) {
                    window.chatAssistant.showNotification('Response copied to clipboard!', 'info');
                }
            }).catch(err => {
                console.error('Failed to copy text:', err);
            });
        }
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to send message
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
        
        // Escape to clear input
        if (e.key === 'Escape') {
            const messageInput = document.getElementById('messageInput');
            if (messageInput && messageInput === document.activeElement) {
                messageInput.value = '';
                messageInput.style.height = 'auto';
            }
        }
    });
    
    // Add auto-save draft functionality
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        // Load draft on page load
        const draft = localStorage.getItem('chat_draft');
        if (draft) {
            messageInput.value = draft;
        }
        
        // Save draft as user types
        messageInput.addEventListener('input', function() {
            localStorage.setItem('chat_draft', this.value);
        });
        
        // Clear draft when message is sent
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                localStorage.removeItem('chat_draft');
            }
        });
    }
});

// Service worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Add error handling for network issues
window.addEventListener('online', function() {
    if (window.chatAssistant) {
        window.chatAssistant.showNotification('Connection restored!', 'success');
    }
});

window.addEventListener('offline', function() {
    if (window.chatAssistant) {
        window.chatAssistant.showNotification('You are offline. Some features may not work.', 'warning');
    }
});
