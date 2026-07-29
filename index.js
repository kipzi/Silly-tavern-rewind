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

/**
 * Calculates the relative luminance of an element's background color 
 * to automatically adapt the icon color for light or dark themes.
 */
function getAdaptiveColor(element) {
    let current = element;
    while (current && current !== document.body) {
        const bg = window.getComputedStyle(current).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const rgb = bg.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const r = parseInt(rgb[0], 10);
                const g = parseInt(rgb[1], 10);
                const b = parseInt(rgb[2], 10);
                // Standard perceived luminance formula
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                // If the background is bright/light, return a dark grey icon; otherwise light grey
                return luminance > 0.5 ? '#404040' : '#b0b0b0';
            }
        }
        current = current.parentElement;
    }
    return '#b0b0b0'; // Fallback default
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
            } else {
                block.appendChild(bottomBar);
            }

            const baseColor = getAdaptiveColor(block);
            const hoverColor = baseColor === '#404040' ? '#000000' : '#ffffff';

            const rewindButton = document.createElement("button");
            rewindButton.className = "rewind-btn-custom";
            rewindButton.innerHTML = '<i class="fa-solid fa-angles-left"></i>';
            rewindButton.title = "Rewind to this message";
            rewindButton.style.background = "transparent";
            rewindButton.style.border = "none";
            rewindButton.style.boxShadow = "none";
            rewindButton.style.color = baseColor;
            rewindButton.style.padding = "4px";
            rewindButton.style.fontSize = "0.85rem";
            rewindButton.style.cursor = "pointer";
            rewindButton.style.transition = "color 0.2s ease";
            rewindButton.style.marginRight = "auto";
            rewindButton.style.marginLeft = "10px";

            rewindButton.addEventListener("mouseenter", () => {
                rewindButton.style.color = hoverColor;
            });

            rewindButton.addEventListener("mouseleave", () => {
                rewindButton.style.color = baseColor;
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
