const extensionName = "st-message-rewind";
const DEFAULT_SETTINGS = { requireConfirmation: true };

async function performRewind(messageIndex) {
    try {
        const context = SillyTavern.getContext();
        const chat = context.chat;

        if (messageIndex < 0 || messageIndex >= chat.length) return;

        const settings = (context.extensionSettings && context.extensionSettings[extensionName]) || DEFAULT_SETTINGS;

        if (settings.requireConfirmation) {
            const snippet = chat[messageIndex].mes.slice(0, 40);
            const confirmed = window.confirm(
                `Rewind to this message?\n\n"${snippet}"\n\nMessages after this point will be removed.`
            );
            if (!confirmed) return;
        }

        chat.splice(messageIndex + 1);
        await context.saveChat();
        context.printMessages();
    } catch (err) {
        console.error("[Message Rewind] Error:", err);
    }
}

function injectRewindButtons() {
    try {
        const messageBlocks = document.querySelectorAll(".mes");

        messageBlocks.forEach((block) => {
            if (block.querySelector(".rewind-btn-custom")) return;

            const messageIdStr = block.getAttribute("mesid") || block.getAttribute("data-mesid");
            if (messageIdStr === null) return;
            const messageId = parseInt(messageIdStr, 10);
            if (isNaN(messageId)) return;

            // Use justify-content: flex-start to align the toolbar to the left side
            let bottomBar = block.querySelector(".mes-bottom-toolbar");
            if (!bottomBar) {
                bottomBar = document.createElement("div");
                bottomBar.className = "mes-bottom-toolbar";
                bottomBar.style.display = "flex";
                bottomBar.style.justifyContent = "flex-start";
                bottomBar.style.alignItems = "center";
                bottomBar.style.gap = "8px";
                bottomBar.style.marginTop = "10px";
                bottomBar.style.paddingTop = "6px";
                bottomBar.style.borderTop = "1px solid rgba(255, 255, 255, 0.05)";
                bottomBar.style.width = "100%";
                bottomBar.style.position = "relative";
                block.appendChild(bottomBar);
            } else {
                bottomBar.style.justifyContent = "flex-start";
                block.appendChild(bottomBar);
            }

            const rewindButton = document.createElement("button");
            rewindButton.className = "rewind-btn-custom";
            rewindButton.innerHTML = '<i class="fa-solid fa-angles-left"></i>';
            rewindButton.title = "Rewind to this message";
            rewindButton.style.background = "transparent";
            rewindButton.style.border = "none";
            rewindButton.style.boxShadow = "none";
            rewindButton.style.color = "#b0b0b0";
            rewindButton.style.padding = "4px";
            rewindButton.style.fontSize = "0.85rem";
            rewindButton.style.cursor = "pointer";
            rewindButton.style.transition = "color 0.2s ease";

            rewindButton.addEventListener("mouseenter", () => {
                rewindButton.style.color = "#ffffff";
            });

            rewindButton.addEventListener("mouseleave", () => {
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

jQuery(async () => {
    console.log("[Message Rewind] Loaded");

    function tryAttachObserver() {
        const chatContainer = document.getElementById("chat");
        if (!chatContainer) {
            setTimeout(tryAttachObserver, 300);
            return;
        }

        const observer = new MutationObserver(() => {
            setTimeout(injectRewindButtons, 0);
        });

        observer.observe(chatContainer, { childList: true, subtree: true });

        setTimeout(injectRewindButtons, 300);
    }

    tryAttachObserver();
});
