// Chat functionality for AI Farming Assistant
class ChatAssistant {
    constructor() {
        this.currentSessionId = null;
        this.isTyping = false;
        this.messageInput = document.getElementById('messageInput');
        this.chatMessages = document.getElementById('chatMessages');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.sessionsList = document.getElementById('sessionsList');
        
        this.initializeEventListeners();
        this.loadSessions();
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
        
        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.target.textContent.trim();
                if (message) {
                    this.sendQuickMessage(message);
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
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
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
                    session_id: this.currentSessionId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update session ID if new session was created
                if (data.session_id && !this.currentSessionId) {
                    this.currentSessionId = data.session_id;
                    this.loadSessions(); // Refresh sessions list
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
    
    async loadSessions() {
        try {
            const response = await fetch('/api/sessions');
            const data = await response.json();
            
            if (data.sessions && this.sessionsList) {
                this.renderSessions(data.sessions);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    }
    
    renderSessions(sessions) {
        if (!this.sessionsList) return;
        
        this.sessionsList.innerHTML = '';
        
        sessions.forEach(session => {
            const sessionDiv = document.createElement('div');
            sessionDiv.className = 'session-item';
            if (session.id === this.currentSessionId) {
                sessionDiv.classList.add('active');
            }
            
            sessionDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${session.name}</h6>
                        <small class="text-muted">${session.last_message}</small>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteSession(${session.id})">
                                <i class="fas fa-trash me-1"></i>Delete
                            </a></li>
                        </ul>
                    </div>
                </div>
            `;
            
            sessionDiv.addEventListener('click', () => {
                this.loadSession(session.id);
            });
            
            this.sessionsList.appendChild(sessionDiv);
        });
    }
    
    async loadSession(sessionId) {
        try {
            const response = await fetch(`/api/chat-history/${sessionId}`);
            const data = await response.json();
            
            if (data.messages) {
                this.currentSessionId = sessionId;
                this.clearChat();
                
                // Add welcome message for new sessions
                if (data.messages.length === 0) {
                    this.addWelcomeMessage();
                } else {
                    // Load existing messages
                    data.messages.forEach(msg => {
                        this.addMessage(msg.type, msg.content);
                    });
                }
                
                // Update active session in sidebar
                document.querySelectorAll('.session-item').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelectorAll('.session-item').forEach(item => {
                    if (item.textContent.includes(data.session_name)) {
                        item.classList.add('active');
                    }
                });
            }
        } catch (error) {
            console.error('Error loading session:', error);
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
        
        // Remove active class from all sessions
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
        });
    }
}

function deleteSession(sessionId) {
    if (confirm('Are you sure you want to delete this chat session?')) {
        fetch(`/delete-session/${sessionId}`, {
            method: 'POST'
        }).then(response => {
            if (response.ok) {
                window.location.reload();
            } else {
                alert('Error deleting session');
            }
        }).catch(error => {
            console.error('Error deleting session:', error);
            alert('Error deleting session');
        });
    }
}

function saveFarmProfile() {
    const cropType = document.getElementById('cropType').value;
    const soilType = document.getElementById('soilType').value;
    const farmSize = document.getElementById('farmSize').value;
    
    if (!cropType || !soilType) {
        alert('Please fill in at least crop type and soil type');
        return;
    }
    
    // This would normally save to the backend
    // For now, we'll just close the modal and show a success message
    const modal = bootstrap.Modal.getInstance(document.getElementById('farmProfileModal'));
    modal.hide();
    
    if (window.chatAssistant) {
        window.chatAssistant.showNotification('Farm profile saved successfully!', 'success');
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
