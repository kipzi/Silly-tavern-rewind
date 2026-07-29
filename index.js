/**
 * Perform the message rewind action.
 * @param {number} messageIndex - The chat array index to rewind to
 */
async function performRewind(messageIndex) {
    try {
        const context = SillyTavern.getContext();
        const chat = context.chat;

        if (!chat || messageIndex < 0 || messageIndex >= chat.length) return;

        const extensionName = "st-message-rewind";
        const DEFAULT_SETTINGS = { requireConfirmation: true };
        const settings = (context.extensionSettings && context.extensionSettings[extensionName]) || DEFAULT_SETTINGS;

        if (settings.requireConfirmation) {
            const snippet = chat[messageIndex].mes ? chat[messageIndex].mes.slice(0, 40) : "";
            const confirmed = window.confirm(
                `Are you sure you want to rewind to this message?\n\n"${snippet}"\n\nAll messages underneath this one will be permanently deleted.`
            );
            if (!confirmed) return;
        }

        chat.splice(messageIndex + 1);
        await context.saveChat();
        context.printMessages();
    } catch (err) {
        console.error("[Message Rewind] Rewind Error:", err);
    }
}

/**
 * Scan the DOM and inject Rewind buttons onto message cards.
 */
function injectRewindButtons() {
    try {
        const messageBlocks = document.querySelectorAll(".mes");
        if (messageBlocks.length === 0) return;

        messageBlocks.forEach((block) => {
            if (block.querySelector(".rewind-btn-custom")) return;

            const mesIdStr = block.getAttribute("mesid") || block.getAttribute("data-mesid");
            if (mesIdStr === "" || mesIdStr === null) return;
            
            const messageId = parseInt(mesIdStr, 10);
            if (isNaN(messageId)) return;

            let bottomBar = block.querySelector(".mes-bottom-toolbar");
            if (!bottomBar) {
                bottomBar = document.createElement("div");
                bottomBar.className = "mes-bottom-toolbar";
                bottomBar.style.display = "flex";
                bottomBar.style.justifyContent = "flex-end";
                bottomBar.style.alignItems = "center";
                bottomBar.style.gap = "8px";
                bottomBar.style.marginTop = "10px";
                bottomBar.style.paddingTop = "6px";
                bottomBar.style.borderTop = "1px solid rgba(255, 255, 255, 0.05)";
                bottomBar.style.width = "100%";
                bottomBar.style.position = "relative";
                block.appendChild(bottomBar);
            }

            const rewindButton = document.createElement("button");
            rewindButton.className = "rewind-btn-custom";
            rewindButton.innerHTML = '<i class="fa-solid fa-history"></i> Rewind';
            rewindButton.style.background = "rgba(255, 255, 255, 0.05)";
            rewindButton.style.border = "1px solid rgba(255, 255, 255, 0.1)";
            rewindButton.style.color = "#b0b0b0";
            rewindButton.style.padding = "3px 8px";
            rewindButton.style.borderRadius = "8px";
            rewindButton.style.fontSize = "0.75rem";
            rewindButton.style.cursor = "pointer";
            rewindButton.style.transition = "all 0.2s ease";

            rewindButton.addEventListener("mouseenter", () => {
                rewindButton.style.background = "rgba(255, 255, 255, 0.12)";
                rewindButton.style.color = "#ffffff";
            });

            rewindButton.addEventListener("mouseleave", () => {
                rewindButton.style.background = "rgba(255, 255, 255, 0.05)";
                rewindButton.style.color = "#b0b0b0";
            });

            rewindButton.addEventListener("click", (e) => {
                e.stopPropagation();
                performRewind(messageId);
            });

            bottomBar.appendChild(rewindButton);
        });
    } catch (err) {
        console.error("[Message Rewind] Injection Error:", err);
    }
}

/**
 * Initialize the extension immediately upon script load.
 */
(function () {
    console.log("[Message Rewind] Loaded successfully");

    // Expose globally so it can be tested from the console without ReferenceErrors
    window.injectRewindButtons = injectRewindButtons;

    const context = SillyTavern.getContext();

    // 1. Hook into SillyTavern's native event emitters if available
    if (context && context.eventSource && context.event_types) {
        context.eventSource.on(context.event_types.CHAT_CHANGED, () => setTimeout(injectRewindButtons, 100));
        context.eventSource.on(context.event_types.MESSAGE_RECEIVED, () => setTimeout(injectRewindButtons, 100));
        context.eventSource.on(context.event_types.MESSAGE_SENT, () => setTimeout(injectRewindButtons, 100));
    }

    // 2. Continuous DOM observer fallback to catch UI themes/switches
    const attachObserver = () => {
        const chatContainer = document.getElementById("chat") || document.body;
        const observer = new MutationObserver(() => {
            injectRewindButtons();
        });
        observer.observe(chatContainer, { childList: true, subtree: true });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", attachObserver);
    } else {
        attachObserver();
    }

    // 3. Staggered initial injection passes
    setTimeout(injectRewindButtons, 300);
    setTimeout(injectRewindButtons, 1000);
})();
