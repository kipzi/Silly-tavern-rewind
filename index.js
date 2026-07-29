import { getContext, extension_settings } from "../../extensions.js";
import { saveChat } from "../../script.js";

const extensionName = "st-message-rewind";
const DEFAULT_SETTINGS = { requireConfirmation: true };

async function performRewind(messageIndex) {
    try {
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
    } catch (err) {
        console.error("[Message Rewind] Error executing rewind:", err);
    }
}

function injectRewindButtons() {
    try {
        const messageBlocks = document.querySelectorAll('.mes');

        messageBlocks.forEach((block) => {
            if (block.querySelector('.rewind-btn-custom')) return;

            const messageIdStr = block.getAttribute('mesid') || block.getAttribute('data-mesid');
            if (messageIdStr === null) return;
            const messageId = parseInt(messageIdStr, 10);
            if (isNaN(messageId)) return;

            // Create or find a bottom toolbar row to sit near the swipe controls
            let bottomBar = block.querySelector('.mes-bottom-toolbar');
            if (!bottomBar) {
                bottomBar = document.createElement('div');
                bottomBar.className = 'mes-bottom-toolbar';
                bottomBar.style.display = 'flex';
                bottomBar.style.justifyContent = 'flex-end';
                bottomBar.style.alignItems = 'center';
                bottomBar.style.gap = '8px';
                bottomBar.style.marginTop = '10px';
                bottomBar.style.paddingTop = '6px';
                bottomBar.style.borderTop = '1px solid rgba(255, 255, 255, 0.05)';
                block.appendChild(bottomBar);
            }

            const rewindButton = document.createElement('button');
            rewindButton.className = 'rewind-btn-custom';
            rewindButton.innerHTML = '<i class="fa-solid fa-history"></i> Rewind';
            rewindButton.style.background = 'rgba(255, 255, 255, 0.05)';
            rewindButton.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            rewindButton.style.color = '#b0b0b0';
            rewindButton.style.padding = '3px 8px';
            rewindButton.style.borderRadius = '8px';
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

            bottomBar.appendChild(rewindButton);
        });
    } catch (err) {
        console.error("[Message Rewind] Error injecting buttons:", err);
    }
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

    setTimeout(injectRewindButtons, 800);
});
