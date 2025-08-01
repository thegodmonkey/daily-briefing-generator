// This script manages the client-side logic for the chat interface.

// Wait until the HTML document is fully loaded before running the script.
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the important HTML elements we need to interact with.
    const chatContainer = document.getElementById('chat-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');

    let chatHistory = []; // This will be managed on the client and sent to the server.

    // --- Initial Briefing Fetch ---
    // On initial load, fetch the briefing without any user message, just an empty history.
    fetch('/api/briefing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: chatHistory }) // Send an empty history to get the initial briefing.
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return response.json();
        })
        .then(data => {
            loadingIndicator.remove();
            appendAIMessage(data.briefing);
        })
        .catch(error => {
            console.error('Error fetching initial briefing:', error);
            loadingIndicator.textContent = 'Error loading briefing. Check the console for details.';
        });

    // --- Event Listeners ---
    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;

        appendUserMessage(message);

        // Send the current chat history along with the new message.
        fetch('/api/briefing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history: chatHistory, message: message })
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error) });
                }
                return response.json();
            })
            .then(data => {
                appendAIMessage(data.briefing);
            })
            .catch(error => {
                console.error('Error sending message:', error);
                appendAIMessage(`Sorry, something went wrong: ${error.message}`);
            });
    });

    messageInput.addEventListener('keydown', (event) => {
        // Check if the Enter key was pressed without the Shift key.
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent the default action (adding a new line).
            chatForm.requestSubmit(); // Programmatically submit the form.
        }
    });

    function appendUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message');
        messageElement.textContent = text;
        chatContainer.appendChild(messageElement);
        messageInput.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;
        chatHistory.push({ role: 'user', parts: [{ text }] });
    }

    /**
     * Creates a new message element for an AI response, parses the Markdown, and appends it to the chat container.
     * @param {string} markdown - The Markdown-formatted string received from the AI.
     */
    function appendAIMessage(markdown) {
        const messageElement = document.createElement('div');
        // Add CSS classes for styling the message bubble.
        messageElement.classList.add('message', 'ai-message');
        // Use the 'marked' library (loaded in index.html) to convert the Markdown string to HTML.
        messageElement.innerHTML = marked.parse(markdown);
        // Add the newly created HTML element to the chat window.
        chatContainer.appendChild(messageElement);
        // Automatically scroll the chat window to the bottom to show the latest message.
        chatContainer.scrollTop = chatContainer.scrollHeight;
        chatHistory.push({ role: 'model', parts: [{ text: markdown }] });
    }
});