import { getContext } from "../../../extensions.js";
import { saveChat } from "../../../script.js";

async function performRewind(messageIndex) {
    const context = getContext();
    const chat = context.chat;

    if (messageIndex < 0 || messageIndex >= chat.length) return;

    const messageSnippet = chat[messageIndex].mes.substring(0, 40) + (chat[messageIndex].mes.length > 40 ? "..." : "");
    const confirmed = window.confirm(`Are you sure you want to rewind to this message?\n\n"${messageSnippet}"\n\nAll messages underneath this one will be permanently deleted.`);

    if (!confirmed) return;

    // Truncate chat array and update UI
    chat.splice(messageIndex + 1);
    await saveChat();
    context.printMessages();
}

function addRewindButtons() {
    const messageBlocks = document.querySelectorAll('.mes');

    messageBlocks.forEach((block) => {
        // Prevent duplicate buttons
        if (block.querySelector('.rewind-row')) return;

        const messageId = parseInt(block.getAttribute('mesid'), 10);
        if (isNaN(messageId)) return;

        // Create a dedicated wrapper row to sit cleanly below the message
        const buttonRow = document.createElement('div');
        buttonRow.className = 'rewind-row';
        buttonRow.style.display = 'flex';
        buttonRow.style.justifyContent='flex-end';
        buttonRow.style.marginTop = '4px';
        buttonRow.style.marginBottom = '8px';
        buttonRow.style.opacity = '0.6';
        buttonRow.style.transition = 'opacity 0.2s ease';

        buttonRow.addEventListener('mouseenter', () => buttonRow.style.opacity = '1');
        buttonRow.addEventListener('mouseleave', () => buttonRow.style.opacity = '0.6');

        const rewindButton = document.createElement('button');
        rewindButton.className = 'menu_button menu_button_icon';
        rewindButton.innerHTML = '<i class="fa-solid fa-history"></i> Rewind to here';
        rewindButton.style.padding = '2px 8px';
        rewindButton.style.fontSize = '0.8rem';
        rewindButton.style.cursor = 'pointer';

        rewindButton.addEventListener('click', () => performRewind(messageId));

        buttonRow.appendChild(rewindButton);

        // Append directly to the bottom of the .mes block
        block.appendChild(buttonRow);
    });
}

jQuery(async () => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                addRewindButtons();
            }
        }
    });

    const chatContainer = document.getElementById('chat');
    if (chatContainer) {
        observer.observe(chatContainer, { childList: true, subtree: true });
    }

    addRewindButtons();
});