import { getContext, extension_settings } from "../../extensions.js";
import { saveChat } from "../../script.js";

const extensionName = "st-message-rewind";
const DEFAULT_SETTINGS = { requireConfirmation: true };

async function performRewind(messageIndex) {
    const context = getContext();
    const chat = context.chat;

    if (messageIndex < 0 || messageIndex >= chat.length) return;

    const settings = extension_settings[extensionName] || DEFAULT_SETTINGS;
    if (settings.requireConfirmation) {
        const messageSnippet = chat[messageIndex].mes.substring(0, 40) + (chat[messageIndex].mes.length > 40 ? "..." : "");
        const confirmed = window.confirm(`Are you sure you want to rewind to this message?\n\n"${messageSnippet}"\n\nAll messages underneath this one will be permanently deleted.`);
        if (!confirmed) return;
    }

    chat.splice(messageIndex + 1);
    await saveChat();
    context.printMessages();
}

function injectRewindButtons() {
    const messageBlocks = document.querySelectorAll('.mes');

    messageBlocks.forEach((block) => {
        if (block.querySelector('.rewind-row')) return;

        const messageIdStr = block.getAttribute('mesid') || block.getAttribute('data-mesid');
        if (messageIdStr === null) return;
        const messageId = parseInt(messageIdStr, 10);
        if (isNaN(messageId)) return;

        const buttonRow = document.createElement('div');
        buttonRow.className = 'rewind-row';
        buttonRow.style.display = 'flex';
        buttonRow.style.justifyContent = 'flex-end';
        buttonRow.style.marginTop = '12px';
        buttonRow.style.paddingTop = '8px';
        buttonRow.style.borderTop = '1px solid rgba(255, 255, 255, 0.05)';

        const rewindButton = document.createElement('button');
        rewindButton.innerHTML = '<i class="fa-solid fa-history"></i> Rewind to here';
        rewindButton.style.background = 'rgba(255, 255, 255, 0.05)';
        rewindButton.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        rewindButton.style.color = '#b0b0b0';
        rewindButton.style.padding = '4px 10px';
        rewindButton.style.borderRadius = '10px';
        rewindButton.style.fontSize = '0.75rem';
        rewindButton.style.cursor = 'pointer';
        rewindButton.style.transition = 'all 0.2s ease';

        rewindButton.addEventListener('mouseenter', () => {
            rewindButton.style.background = 'rgba(255, 255, 255, 0.12)';
            rewindButton.style.color = '#ffffff';
        });
        rewindButton.addEventListener('mouseleave', () => {
            rewindButton.style.background = 'rgba(255, 255, 255, 0.05)';
            rewindButton.style.color = '#b0b0b0';
        });

        rewindButton.addEventListener('click', (e) => {
            e.stopPropagation();
            performRewind(messageId);
        });

        buttonRow.appendChild(rewindButton);
        block.appendChild(buttonRow);
    });
}

jQuery(async () => {
    console.log("[Message Rewind] Extension initialized.");

    const observer = new MutationObserver(() => {
        injectRewindButtons();
    });

    const chatContainer = document.getElementById('chat');
    if (chatContainer) {
        observer.observe(chatContainer, { childList: true, subtree: true });
    }

    setTimeout(injectRewindButtons, 500);
});
