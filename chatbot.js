// chatbot.js - AI Customer Support Assistant (Gemini API - FREE)

class RedLinkChatbot {
  constructor() {
    this.isOpen = false;
    this.conversationHistory = [];
    this.init();
  }

  init() {
    this.createChatWidget();
    this.attachEventListeners();
  }

  createChatWidget() {
    const chatHTML = `
      <!-- Floating Chat Button -->
      <div id="chat-button" class="chat-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="chat-badge">AI Assistant</span>
      </div>

      <!-- Chat Window -->
      <div id="chat-window" class="chat-window" style="display: none;">
        <div class="chat-header">
          <div class="chat-header-left">
            <div class="chat-avatar">🤖</div>
            <div>
              <h4>RedLink AI Assistant</h4>
              <p class="chat-status">Online • Always here to help</p>
            </div>
          </div>
          <button id="close-chat" class="close-chat-btn">&times;</button>
        </div>

        <div class="chat-messages" id="chat-messages">
          <div class="message bot-message">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <p>Hello! I'm your RedLink AI Assistant powered by Google Gemini. I can help you with:</p>
              <ul>
                <li>Blood donation eligibility questions</li>
                <li>Finding blood banks near you</li>
                <li>Scheduling donations</li>
                <li>Understanding blood types</li>
                <li>General queries about blood donation</li>
              </ul>
              <p>How can I assist you today?</p>
            </div>
          </div>
        </div>

        <div class="chat-input-container">
          <div class="quick-questions">
            <button class="quick-btn" onclick="chatbot.sendQuickQuestion('Am I eligible to donate blood?')">
              🩺 Am I eligible?
            </button>
            <button class="quick-btn" onclick="chatbot.sendQuickQuestion('Where are blood banks near me?')">
              📍 Find blood banks
            </button>
            <button class="quick-btn" onclick="chatbot.sendQuickQuestion('What is my blood type compatibility?')">
              🩸 Blood compatibility
            </button>
          </div>
          <div class="chat-input-wrapper">
            <input 
              type="text" 
              id="chat-input" 
              placeholder="Type your question here..."
              autocomplete="off"
            />
            <button id="send-message" class="send-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);
  }

  attachEventListeners() {
    const chatButton = document.getElementById('chat-button');
    const closeChat = document.getElementById('close-chat');
    const sendButton = document.getElementById('send-message');
    const chatInput = document.getElementById('chat-input');

    chatButton.addEventListener('click', () => this.toggleChat());
    closeChat.addEventListener('click', () => this.toggleChat());
    sendButton.addEventListener('click', () => this.sendMessage());
    
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const chatWindow = document.getElementById('chat-window');
    const chatButton = document.getElementById('chat-button');

    if (this.isOpen) {
      chatWindow.style.display = 'flex';
      chatButton.style.display = 'none';
      document.getElementById('chat-input').focus();
    } else {
      chatWindow.style.display = 'none';
      chatButton.style.display = 'flex';
    }
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      // Add bot response
      this.addMessage(response, 'bot');
      
    } catch (error) {
      this.removeTypingIndicator();
      this.addMessage('Sorry, I encountered an error. Please try again or contact support.', 'bot');
      console.error('Chatbot error:', error);
    }
  }

  sendQuickQuestion(question) {
    document.getElementById('chat-input').value = question;
    this.sendMessage();
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageClass = sender === 'user' ? 'user-message' : 'bot-message';
    const avatar = sender === 'user' ? '👤' : '🤖';

    const messageHTML = `
      <div class="message ${messageClass}">
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <p>${this.formatMessage(text)}</p>
          <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Store in conversation history
    this.conversationHistory.push({
      role: sender === 'user' ? 'user' : 'model',
      parts: [{ text: text }]
    });
  }

  formatMessage(text) {
    // Convert markdown-like formatting to HTML
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    text = text.replace(/• /g, '• ');
    return text;
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingHTML = `
      <div class="message bot-message typing-indicator" id="typing-indicator">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  async getAIResponse(userMessage) {
    try {
      // Call backend API which will call Gemini
      const response = await fetch('http://localhost:5000/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: this.conversationHistory.slice(-10) // Last 5 exchanges
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data.reply;

    } catch (error) {
      console.error('AI API Error:', error);
      
      // Fallback responses if API fails
      return this.getFallbackResponse(userMessage);
    }
  }

  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('eligible') || lowerMessage.includes('donate')) {
      return `To be eligible to donate blood, you must meet these criteria:

**Basic Requirements:**
• Be 18-65 years old
• Weigh at least 50 kg
• Be healthy with no recent illness
• Wait 56 days since last donation
• No recent surgeries or tattoos

You can take the full eligibility assessment in the **"Donate Blood"** section of our platform!`;
    }

    if (lowerMessage.includes('blood bank') || lowerMessage.includes('location') || lowerMessage.includes('near')) {
      return `We have 5 major blood banks in Delhi:

**1. AIIMS Delhi** - Ansari Nagar
   Phone: +91 11 2659 8500

**2. Red Cross Blood Bank** - Connaught Place
   Phone: +91 11 2371 6441

**3. Safdarjung Hospital** - Ring Road
   Phone: +91 11 2673 0000

**4. Rotary Blood Bank** - Rajendra Place
   Phone: +91 11 2574 2014

**5. Apollo Hospital** - Sarita Vihar
   Phone: +91 11 2692 5858

You can view their exact locations, inventory, and book appointments in the **"Donate Blood"** tab!`;
    }

    if (lowerMessage.includes('blood type') || lowerMessage.includes('compatibility')) {
      return `**Blood Type Compatibility Guide:**

**Universal Donors & Recipients:**
• **O-** - Universal donor (can donate to all blood types)
• **AB+** - Universal recipient (can receive from all blood types)

**Specific Compatibility:**
• **A+** can donate to: A+, AB+
• **A-** can donate to: A+, A-, AB+, AB-
• **B+** can donate to: B+, AB+
• **B-** can donate to: B+, B-, AB+, AB-
• **O+** can donate to: O+, A+, B+, AB+
• **AB-** can donate to: AB+, AB-

Need to check specific compatibility? Let me know your blood type!`;
    }

    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent')) {
      return `**For Urgent Blood Needs:**

**Immediate Steps:**
1. Go to the **"Receive Blood"** tab
2. Fill in patient details and required blood type
3. Mark urgency as "Emergency"
4. We'll show you nearby blood banks with availability
5. Our system will notify matching donors immediately

**For Life-Threatening Emergencies:**
• Call 112 (Emergency Services)
• Visit nearest hospital immediately
• Contact blood banks directly for critical cases

**Blood Banks 24/7 Emergency:**
• AIIMS Delhi: +91 11 2659 8500
• Safdarjung Hospital: +91 11 2673 0000`;
    }

    if (lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
      return `**How to Schedule a Blood Donation:**

**Step-by-Step Process:**
1. Go to **"Donate Blood"** tab
2. Complete the eligibility questionnaire (8 questions)
3. If eligible, browse nearby blood banks
4. Click **"Select for Donation"** on your preferred bank
5. Choose your preferred date and time slot
6. Submit your appointment!

**Available Time Slots:**
• 09:00 AM - 11:00 AM
• 11:00 AM - 01:00 PM
• 02:00 PM - 04:00 PM
• 04:00 PM - 06:00 PM

You can also view your scheduled donations in your **Profile** section.`;
    }

    if (lowerMessage.includes('requirement') || lowerMessage.includes('criteria')) {
      return `**Blood Donation Requirements:**

**You Must:**
✅ Be between 18-65 years old
✅ Weigh at least 50 kg
✅ Be in good health
✅ Have normal blood pressure
✅ Not be on antibiotics or blood thinners

**You Cannot Donate If:**
❌ Had fever/cold in past month
❌ Major health disorders (heart, lung, liver, kidney)
❌ Donated blood less than 56 days ago
❌ Had surgery in past 6 months
❌ Got a tattoo in past 3 months

**What to Do Before Donation:**
• Get adequate sleep (6-8 hours)
• Eat iron-rich foods
• Drink plenty of water
• Bring ID proof

Take our quick assessment in the **"Donate Blood"** section!`;
    }

    // Default response
    return `I'm here to help with blood donation questions! I can assist you with:

**Common Topics:**
• ✅ Checking donation eligibility
• 📍 Finding nearby blood banks
• 🩸 Understanding blood types & compatibility
• 📅 Scheduling donations
• 🚨 Emergency blood requests
• 📋 Donation requirements & preparation

**Quick Actions:**
• Click **"Donate Blood"** to schedule
• Click **"Receive Blood"** to request
• Click **"Emergency"** for urgent alerts

What would you like to know?`;
  }
}

// Initialize chatbot when page loads
let chatbot;
document.addEventListener('DOMContentLoaded', () => {
  chatbot = new RedLinkChatbot();
  console.log('🤖 RedLink AI Chatbot initialized (Powered by Google Gemini)');
});
