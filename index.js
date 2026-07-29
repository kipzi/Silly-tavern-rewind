console.log("[Message Rewind] Loaded");
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
            const snippet = chat[messageIndex].mes.slice(0, 40);
            const confirmed = window.confirm(
                `Rewind to this message?\n\n"${snippet}"\n\nMessages after this point will be removed.`
            );
            if (!confirmed) return;
        }

        chat.splice(messageIndex + 1);
        await saveChat();
    } catch (err) {
        console.error("[Message Rewind] Error:", err);
    }
}

function injectRewindButtons() {
    try {
        const messageBlocks = document.querySelectorAll(".mes_block");

        messageBlocks.forEach((block) => {
            if (block.querySelector(".rewind-btn-custom")) return;

            // Find the ID from the sibling .mesIDDisplay
            const idElement = block.parentElement.querySelector(".mesIDDisplay");
            if (!idElement) return;

            const messageId = parseInt(idElement.textContent.replace("#", ""), 10);
            if (isNaN(messageId)) return;

            // Create bottom toolbar if missing
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

jQuery(async () => {
    console.log("[Message Rewind] Extension initialized.");

    const chatContainer = document.getElementById("chat");

    if (chatContainer) {
        const observer = new MutationObserver(() => {
            setTimeout(injectRewindButtons, 0);
        });

        observer.observe(chatContainer, { childList: true, subtree: true });
    }

    setTimeout(injectRewindButtons, 800);
});
