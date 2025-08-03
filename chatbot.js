// Advanced AI Chatbot with Intelligence Features
let knowledge = {};
let isLoading = false;
let currentTheme = 'light';

// Advanced AI Components
let conversationContext = [];
let conversationHistory = [];
let userPreferences = {};
let userBehavior = {};
let learningData = {};
let responseQuality = {};

// NLP and Intent Analysis
class NLPProcessor {
  constructor() {
    this.synonyms = {
      'loan': ['loans', 'borrow', 'credit', 'money', 'fund', 'advance', 'financing'],
      'vehicle': ['bike', 'motorcycle', 'scooter', 'two wheeler', 'transport'],
      'gold': ['jewelry', 'ornaments', 'precious metal'],
      'business': ['commercial', 'enterprise', 'company', 'startup'],
      'apply': ['application', 'apply for', 'start', 'begin', 'get', 'obtain'],
      'document': ['documents', 'paperwork', 'papers', 'proof', 'certificate'],
      'emi': ['payment', 'installment', 'monthly payment', 'repayment'],
      'help': ['support', 'assist', 'guide', 'aid'],
      'contact': ['call', 'reach', 'connect', 'get in touch'],
      'urgent': ['emergency', 'immediately', 'quick', 'fast', 'asap']
    };
    
    this.intentPatterns = {
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      farewell: ['bye', 'goodbye', 'see you', 'thank you', 'thanks'],
      loan_general: ['loan', 'loans', 'borrow', 'money', 'fund'],
      vehicle_loan: ['vehicle loan', 'bike loan', 'motorcycle loan', 'scooter loan', 'two wheeler'],
      gold_loan: ['gold loan', 'gold', 'jewelry loan'],
      business_loan: ['business loan', 'business', 'commercial loan'],
      cd_loan: ['cd loan', 'certificate of deposit'],
      emi: ['emi', 'payment', 'installment', 'repay'],
      documents: ['document', 'documents', 'paperwork', 'proof'],
      application: ['apply', 'application', 'process', 'start'],
      support: ['help', 'support', 'contact', 'assist'],
      urgent: ['urgent', 'emergency', 'immediately', 'quick']
    };
  }

  preprocessText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractKeywords(text) {
    const words = text.split(' ');
    const keywords = [];
    
    for (const word of words) {
      // Add base word
      keywords.push(word);
      
      // Add synonyms
      for (const [base, synonyms] of Object.entries(this.synonyms)) {
        if (synonyms.includes(word) || word === base) {
          keywords.push(base, ...synonyms);
        }
      }
    }
    
    return [...new Set(keywords)];
  }

  analyzeIntent(text) {
    const processedText = this.preprocessText(text);
    const scores = {};
    
    // Special handling for general loan queries
    if (processedText.includes('loan') || processedText.includes('loans')) {
      // Check if it's a specific loan type first
      if (processedText.includes('vehicle') || processedText.includes('bike') || processedText.includes('motorcycle') || processedText.includes('scooter') || processedText.includes('two wheeler')) {
        scores['vehicle_loan'] = 15;
      } else if (processedText.includes('gold')) {
        scores['gold_loan'] = 15;
      } else if (processedText.includes('business')) {
        scores['business_loan'] = 15;
      } else if (processedText.includes('cd') || processedText.includes('certificate')) {
        scores['cd_loan'] = 15;
      } else {
        // General loan query - should not match specific loan types
        scores['loan_general'] = 10;
      }
    }
    
    // Calculate intent scores for other patterns
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      // Skip loan-related intents as we handled them above
      if (intent.includes('loan') && intent !== 'loan_general') {
        continue;
      }
      
      let score = 0;
      
      for (const pattern of patterns) {
        if (processedText.includes(pattern)) {
          score += pattern.length; // Longer patterns get higher scores
        }
      }
      
      if (score > 0) {
        scores[intent] = score;
      }
    }
    
    // Return the highest scoring intent
    const maxScore = Math.max(...Object.values(scores));
    const bestIntent = Object.keys(scores).find(key => scores[key] === maxScore);
    
    // Debug logging (remove in production)
    console.log('Intent Analysis:', {
      text: processedText,
      intent: bestIntent || 'unknown',
      confidence: maxScore / 10,
      scores: scores
    });
    
    return {
      intent: bestIntent || 'unknown',
      confidence: maxScore / 10, // Normalize confidence
      scores: scores
    };
  }

  extractEntities(text) {
    const entities = {
      loan_amount: null,
      loan_type: null,
      urgency: null,
      time_period: null
    };
    
    // Extract loan amounts
    const amountMatch = text.match(/(\d+)\s*(lakh|lac|thousand|k|rs|rupees?)/i);
    if (amountMatch) {
      entities.loan_amount = amountMatch[0];
    }
    
    // Extract loan types
    if (text.includes('vehicle') || text.includes('bike')) entities.loan_type = 'vehicle';
    if (text.includes('gold')) entities.loan_type = 'gold';
    if (text.includes('business')) entities.loan_type = 'business';
    
    // Extract urgency
    if (text.includes('urgent') || text.includes('emergency')) entities.urgency = 'high';
    
    return entities;
  }
}

// Context Memory System
class ContextMemory {
  constructor() {
    this.shortTerm = [];
    this.longTerm = {};
    this.maxShortTerm = 10;
  }

  addToShortTerm(message, intent, response) {
    this.shortTerm.push({
      message,
      intent,
      response,
      timestamp: Date.now()
    });
    
    if (this.shortTerm.length > this.maxShortTerm) {
      this.shortTerm.shift();
    }
  }

  getRecentContext(count = 3) {
    return this.shortTerm.slice(-count);
  }

  updateLongTerm(userId, data) {
    if (!this.longTerm[userId]) {
      this.longTerm[userId] = {
        preferences: {},
        interests: {},
        behavior: {}
      };
    }
    
    Object.assign(this.longTerm[userId], data);
  }

  getContextualResponse(intent, recentContext) {
    // Analyze recent conversation for context
    const loanMentions = recentContext.filter(ctx => 
      ctx.intent && ctx.intent.includes('loan')
    ).length;
    
    const emiMentions = recentContext.filter(ctx => 
      ctx.intent && ctx.intent.includes('emi')
    ).length;
    
    // Adjust response based on context
    if (loanMentions > 0 && intent === 'documents') {
      return "Since you're asking about loan documents, here are the specific requirements for your loan type...";
    }
    
    if (emiMentions > 0 && intent === 'support') {
      return "For EMI-related support, you can check your schedule online or contact our EMI support team.";
    }
    
    return null; // No specific context found
  }
}

// Learning System
class LearningSystem {
  constructor() {
    this.responseQuality = {};
    this.userFeedback = {};
    this.improvementSuggestions = [];
  }

  recordFeedback(message, response, feedback) {
    const key = `${message}_${response}`;
    if (!this.responseQuality[key]) {
      this.responseQuality[key] = { positive: 0, negative: 0 };
    }
    
    if (feedback === 'positive') {
      this.responseQuality[key].positive++;
    } else {
      this.responseQuality[key].negative++;
    }
  }

  analyzeResponseQuality() {
    const suggestions = [];
    
    for (const [key, quality] of Object.entries(this.responseQuality)) {
      const total = quality.positive + quality.negative;
      const ratio = quality.positive / total;
      
      if (ratio < 0.5 && total > 2) {
        suggestions.push({
          message: key.split('_')[0],
          currentResponse: key.split('_')[1],
          quality: ratio,
          suggestion: 'Consider improving this response'
        });
      }
    }
    
    return suggestions;
  }

  getImprovedResponse(message, intent) {
    // Check if we have better responses for similar messages
    const similarMessages = Object.keys(this.responseQuality)
      .filter(key => key.includes(message.toLowerCase()))
      .sort((a, b) => {
        const aQuality = this.responseQuality[a];
        const bQuality = this.responseQuality[b];
        const aRatio = aQuality.positive / (aQuality.positive + aQuality.negative);
        const bRatio = bQuality.positive / (bQuality.positive + bQuality.negative);
        return bRatio - aRatio;
      });
    
    if (similarMessages.length > 0) {
      return similarMessages[0].split('_')[1];
    }
    
    return null;
  }
}

// Dynamic Response Generator
class ResponseGenerator {
  constructor() {
    this.templates = {
      loan_general: [
        "We offer {loan_types}. Which type interests you?",
        "Our main loan products are {loan_types}. What would you like to know?",
        "You can choose from {loan_types}. Which one are you interested in?"
      ],
      vehicle_loan: [
        "We offer vehicle loans specifically for bikes and two-wheelers with competitive interest rates and flexible repayment options. You'll need valid ID proof, address proof, income proof, and bike details. The loan amount depends on the bike value and your eligibility. Contact us for current rates and application process.",
        "Vehicle loans are available for bikes and two-wheelers. Our rates are competitive and we offer flexible terms. Required documents include ID proof, address proof, income proof, and bike details.",
        "For vehicle loans (bikes and two-wheelers), we provide competitive rates and easy documentation. The loan amount is based on bike value and your eligibility."
      ],
      gold_loan: [
        "Yes, we provide gold loans. You'll need valid ID proof, address proof, and gold items to pledge. The loan amount depends on the gold value and purity.",
        "Gold loans are available with your gold as collateral. Required documents include ID proof, address proof, and gold items. Loan amount depends on gold value and purity.",
        "We offer gold loans where you can pledge your gold jewelry. Documentation includes ID proof, address proof, and gold items."
      ],
      business_loan: [
        "You can apply for a business loan through our website, mobile app, or by visiting your nearest branch. Our team will guide you through the entire process.",
        "Business loans are available online and offline. Our team provides complete guidance throughout the application process.",
        "For business loans, you can apply online or visit any branch. We offer comprehensive support during the application."
      ]
    };
    
    this.loanTypes = "business loans, gold loans, and vehicle loans";
  }

  generateResponse(intent, context = {}) {
    const templates = this.templates[intent];
    if (!templates) {
      return this.getFallbackResponse(intent);
    }
    
    // Select template based on context and randomness
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Fill template variables
    let response = template.replace('{loan_types}', this.loanTypes);
    
    // Add contextual information
    if (context.urgency === 'high') {
      response += " For urgent processing, please contact our support team immediately.";
    }
    
    return response;
  }

  getFallbackResponse(intent) {
    const fallbacks = {
      greeting: "Hello! Welcome to our banking services. How can I help you today with your loan queries?",
      farewell: "Thank you for chatting with us! Have a great day. Feel free to return if you have more questions.",
      unknown: "I'm here to help with your loan queries. You can ask me about loan types, application process, EMI details, documents, or contact information. What would you like to know?"
    };
    
    return fallbacks[intent] || fallbacks.unknown;
  }
}

// Initialize AI Components
const nlp = new NLPProcessor();
const memory = new ContextMemory();
const learning = new LearningSystem();
const responseGen = new ResponseGenerator();

// Enhanced Response Generation
function generateIntelligentResponse(input) {
  // Preprocess input
  const processedInput = nlp.preprocessText(input);
  
  // Analyze intent with confidence
  const intentAnalysis = nlp.analyzeIntent(processedInput);
  
  // Extract entities
  const entities = nlp.extractEntities(processedInput);
  
  // Get recent context
  const recentContext = memory.getRecentContext();
  
  // Check for contextual response
  const contextualResponse = memory.getContextualResponse(intentAnalysis.intent, recentContext);
  if (contextualResponse) {
    memory.addToShortTerm(input, intentAnalysis.intent, contextualResponse);
    return contextualResponse;
  }
  
  // Check for improved response from learning
  const improvedResponse = learning.getImprovedResponse(processedInput, intentAnalysis.intent);
  if (improvedResponse) {
    memory.addToShortTerm(input, intentAnalysis.intent, improvedResponse);
    return improvedResponse;
  }
  
  // Generate new response
  const response = responseGen.generateResponse(intentAnalysis.intent, entities);
  
  // Store in memory
  memory.addToShortTerm(input, intentAnalysis.intent, response);
  
  return response;
}

// Enhanced findBestResponse function
function findBestResponse(input) {
  input = input.toLowerCase().trim();
  
  // Add to conversation history
  conversationHistory.push({ role: 'user', content: input, timestamp: Date.now() });
  if (conversationHistory.length > 10) {
    conversationHistory.shift();
  }
  
  // Special handling for general loan queries
  if (input.includes('loan') || input.includes('loans')) {
    // Check if it's a specific loan type
    if (input.includes('vehicle') || input.includes('bike') || input.includes('motorcycle') || input.includes('scooter') || input.includes('two wheeler')) {
      // Let it go to intelligent response generation for vehicle loan
    } else if (input.includes('gold')) {
      // Let it go to intelligent response generation for gold loan
    } else if (input.includes('business')) {
      // Let it go to intelligent response generation for business loan
    } else {
      // General loan query - return general response
      return responseGen.generateResponse('loan_general');
    }
  }

  // First try exact keyword matching from knowledge.json
  let bestIntent = findExactMatch(input);
  
  if (bestIntent) {
    updateConversationContext(bestIntent.tag);
    return bestIntent.response;
  }

  // Use intelligent response generation
  const response = generateIntelligentResponse(input);
  
  // Debug logging (remove in production)
  console.log('Input:', input);
  console.log('Response:', response);
  
  return response;
}

// Enhanced feedback system
function recordUserFeedback(message, response, feedback) {
  learning.recordFeedback(message, response, feedback);
  
  // Update user behavior
  if (!userBehavior[feedback]) {
    userBehavior[feedback] = 0;
  }
  userBehavior[feedback]++;
  
  // Analyze and suggest improvements
  const suggestions = learning.analyzeResponseQuality();
  if (suggestions.length > 0) {
    console.log('Learning Suggestions:', suggestions);
  }
}

// Enhanced reaction system
function addReaction(button, emoji) {
  // Remove existing reactions
  const reactions = button.parentElement.querySelectorAll('.reaction-btn');
  reactions.forEach(btn => btn.style.background = 'none');
  
  // Add reaction
  button.style.background = 'rgba(102, 126, 234, 0.2)';
  button.style.borderRadius = '50%';
  
  // Record feedback
  const messageElement = button.closest('.message');
  const userMessage = messageElement.previousElementSibling?.querySelector('.user-message')?.textContent;
  const botResponse = messageElement.querySelector('.bot-message')?.textContent;
  
  if (userMessage && botResponse) {
    const feedback = emoji === '👍' ? 'positive' : 'negative';
    recordUserFeedback(userMessage, botResponse, feedback);
  }
  
  // Show feedback
  const feedbackMessage = emoji === '👍' ? 'Thank you for the feedback!' : 'We\'ll improve our response.';
  showFeedback(feedbackMessage);
}

// Load knowledge and initialize
fetch('knowledge.json')
  .then(res => res.json())
  .then(data => {
    knowledge = data;
    addBotMessage("Hello! I'm the Yogloans assistant. How can I help you today with your loan queries?");
  })
  .catch(error => {
    console.error('Error loading knowledge:', error);
    addBotMessage("Hello! I'm the Yogloans assistant. How can I help you today with your loan queries?");
  });

// Keep existing helper functions
function findExactMatch(input) {
  let bestIntent = null;
  let maxScore = 0;

  for (const intent of knowledge.intents) {
    let score = 0;
    
    for (const keyword of intent.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact match (highest priority)
      if (input.includes(keywordLower)) {
        score += 10;
      }
      
      // Word-by-word matching
      const inputWords = input.split(/\s+/);
      const keywordWords = keywordLower.split(/\s+/);
      
      for (const inputWord of inputWords) {
        for (const keywordWord of keywordWords) {
          // Exact word match
          if (inputWord === keywordWord) {
            score += 3;
          }
          // Partial word match (for typos and variations)
          else if (inputWord.includes(keywordWord) || keywordWord.includes(inputWord)) {
            score += 1;
          }
          // Handle common variations and synonyms
          else if (isWordVariation(inputWord, keywordWord)) {
            score += 2;
          }
        }
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }

  return maxScore > 5 ? bestIntent : null;
}

function updateConversationContext(tag) {
  conversationContext.push(tag);
  if (conversationContext.length > 5) {
    conversationContext.shift();
  }
}

function isWordVariation(word1, word2) {
  const variations = {
    'loan': ['loans'],
    'loans': ['loan'],
    'offer': ['offers'],
    'offers': ['offer'],
    'type': ['types'],
    'types': ['type'],
    'what': ['which'],
    'which': ['what'],
    'how': ['what'],
    'when': ['what'],
    'where': ['what'],
    'emi': ['payment', 'installment'],
    'payment': ['emi', 'installment'],
    'installment': ['emi', 'payment'],
    'document': ['documents', 'paperwork'],
    'documents': ['document', 'paperwork'],
    'paperwork': ['document', 'documents'],
    'apply': ['application', 'apply for'],
    'application': ['apply', 'apply for'],
    'require': ['required', 'need'],
    'required': ['require', 'need'],
    'need': ['require', 'required'],
    'contact': ['call', 'reach', 'support'],
    'call': ['contact', 'reach', 'support'],
    'support': ['contact', 'call', 'reach'],
    'branch': ['location', 'office'],
    'location': ['branch', 'office'],
    'office': ['branch', 'location'],
    'money': ['fund', 'loan'],
    'fund': ['money', 'loan'],
    'quick': ['fast', 'urgent'],
    'fast': ['quick', 'urgent'],
    'urgent': ['quick', 'fast']
  };

  const word1Lower = word1.toLowerCase();
  const word2Lower = word2.toLowerCase();
  
  if (variations[word1Lower] && variations[word1Lower].includes(word2Lower)) {
    return true;
  }
  if (variations[word2Lower] && variations[word2Lower].includes(word1Lower)) {
    return true;
  }
  
  return false;
}

// Keep all existing UI functions unchanged
function handleUserMessage() {
  const inputBox = document.getElementById("userInput");
  const userText = inputBox.value.trim();

  if (userText === "" || isLoading) return;

  addUserMessage(userText);
  inputBox.value = "";
  
  // Show typing indicator after a small delay
  setTimeout(() => {
    showTypingIndicator();
    
    // Simulate processing time
    setTimeout(() => {
      hideTypingIndicator();
      const response = findBestResponse(userText);
      addBotMessage(response);
    }, 800 + Math.random() * 1200); // Random delay between 0.8-2 seconds
  }, 300); // Small delay before showing typing indicator
}

function findBestResponse(input) {
  input = input.toLowerCase().trim();
  let bestIntent = null;
  let maxScore = 0;

  // Split input into words for better matching
  const inputWords = input.split(/\s+/);
  
  for (const intent of knowledge.intents) {
    let score = 0;
    
    for (const keyword of intent.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact match
      if (input.includes(keywordLower)) {
        score += 3;
      }
      
      // Word-by-word matching
      const keywordWords = keywordLower.split(/\s+/);
      for (const inputWord of inputWords) {
        for (const keywordWord of keywordWords) {
          // Exact word match
          if (inputWord === keywordWord) {
            score += 2;
          }
          // Partial word match (for typos and variations)
          else if (inputWord.includes(keywordWord) || keywordWord.includes(inputWord)) {
            score += 1;
          }
          // Handle common variations
          else if (
            (inputWord === 'loans' && keywordWord === 'loan') ||
            (inputWord === 'loan' && keywordWord === 'loans') ||
            (inputWord === 'offer' && keywordWord === 'offers') ||
            (inputWord === 'offers' && keywordWord === 'offer') ||
            (inputWord === 'type' && keywordWord === 'types') ||
            (inputWord === 'types' && keywordWord === 'type') ||
            (inputWord === 'what' && keywordWord === 'which') ||
            (inputWord === 'which' && keywordWord === 'what')
          ) {
            score += 1;
          }
        }
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }

  // If no good match found, try to guess based on common words
  if (maxScore === 0) {
    if (input.includes('loan') || input.includes('loans')) {
      return "We offer various loan types including business loans, gold loans, CD loans, personal loans, home loans, vehicle loans, and more. Which type interests you?";
    }
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! Welcome to our banking services. How can I help you today with your loan queries?";
    }
    if (input.includes('bye') || input.includes('goodbye') || input.includes('thank')) {
      return "Thank you for chatting with us! Have a great day. Feel free to return if you have more questions.";
    }
  }

  return bestIntent ? bestIntent.response : "I'm sorry, I couldn't understand that. Please try rephrasing your question about loans, EMI, documents, or any other banking services.";
}

function addUserMessage(text) {
  const msgBox = document.getElementById("messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = "message user";
  messageDiv.innerHTML = `
    <div class="user-message">${text}</div>
    <div class="user-avatar">U</div>
  `;
  msgBox.appendChild(messageDiv);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function addBotMessage(text) {
  const msgBox = document.getElementById("messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = "message bot";
  
  // Add reaction buttons
  const reactionsHTML = `
    <div class="message-reactions">
      <button class="reaction-btn" onclick="addReaction(this, '👍')" title="Helpful">👍</button>
      <button class="reaction-btn" onclick="addReaction(this, '👎')" title="Not helpful">👎</button>
      <button class="reaction-btn" onclick="addReaction(this, '💬')" title="Need more info">💬</button>
    </div>
  `;

  messageDiv.innerHTML = `
    <div class="bot-avatar">Y</div>
    <div class="bot-message">
      ${text}
      ${reactionsHTML}
    </div>
  `;
  
  msgBox.appendChild(messageDiv);
  msgBox.scrollTop = msgBox.scrollHeight;
  
  // Add hover effect to buttons in bot messages
  const buttons = messageDiv.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
    });
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = 'none';
    });
  });
}

function showFeedback(message) {
  const feedbackDiv = document.createElement('div');
  feedbackDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--primary-gradient);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  feedbackDiv.textContent = message;
  document.body.appendChild(feedbackDiv);
  
  setTimeout(() => {
    feedbackDiv.remove();
  }, 3000);
}

function showTypingIndicator() {
  const msgBox = document.getElementById("messages");
  const typingDiv = document.createElement("div");
  typingDiv.className = "message bot typing-indicator";
  typingDiv.id = "typing-indicator";
  typingDiv.style.display = "flex";
  typingDiv.innerHTML = `
    <div class="bot-avatar">Y</div>
    <div class="bot-message">
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  msgBox.appendChild(typingDiv);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function showLoader() {
  isLoading = true;
  const msgBox = document.getElementById("messages");
  const loaderDiv = document.createElement("div");
  loaderDiv.className = "loader-container";
  loaderDiv.id = "loader";
  loaderDiv.innerHTML = `
    <div class="bot-avatar">Y</div>
    <div class="bot-message">
      <div class="loader">
        <div class="loader-dot"></div>
        <div class="loader-dot"></div>
        <div class="loader-dot"></div>
      </div>
      <div class="loader-text">Processing your request...</div>
    </div>
  `;
  msgBox.appendChild(loaderDiv);
  msgBox.scrollTop = msgBox.scrollHeight;
}

function hideLoader() {
  isLoading = false;
  const loader = document.getElementById("loader");
  if (loader) {
    loader.remove();
  }
}

function toggleTheme() {
  const body = document.body;
  const themeToggle = document.querySelector('.theme-toggle');
  
  if (currentTheme === 'light') {
    body.setAttribute('data-theme', 'dark');
    currentTheme = 'dark';
    themeToggle.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
      </svg>
    `;
  } else {
    body.removeAttribute('data-theme');
    currentTheme = 'light';
    themeToggle.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
  }
  
  // Save theme preference
  localStorage.setItem('chatbot-theme', currentTheme);
}

// Handle Enter key press
document.addEventListener('DOMContentLoaded', function() {
  const inputBox = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  
  inputBox.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleUserMessage();
    }
  });
  
  // Focus on input when page loads
  inputBox.focus();
  
  // Add click event for send button
  sendBtn.addEventListener('click', handleUserMessage);
  
  // Load saved theme
  const savedTheme = localStorage.getItem('chatbot-theme');
  if (savedTheme === 'dark') {
    toggleTheme();
  }
});

// Auto-scroll to bottom when new messages are added
function scrollToBottom() {
  const msgBox = document.getElementById("messages");
  msgBox.scrollTop = msgBox.scrollHeight;
}

// Add smooth scrolling
function smoothScrollToBottom() {
  const msgBox = document.getElementById("messages");
  msgBox.scrollTo({
    top: msgBox.scrollHeight,
    behavior: 'smooth'
  });
}

// Add CSS animation for feedback
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
