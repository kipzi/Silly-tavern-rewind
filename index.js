const extensionName = "st-message-rewind";
const DEFAULT_SETTINGS = { requireConfirmation: true };

async function performRewind(messageIndex) {
    try {
        const context = SillyTavern.getContext();
        const chat = context.chat;

        if (messageIndex < 0 || messageIndex >= chat.length) return;

        const settings = (context.extensionSettings && context.extensionSettings[extensionName]) || DEFAULT_SETTINGS;

        if (settings.requireConfirmation) {
            const snippet = chat[messageIndex].mes ? chat[messageIndex].mes.slice(0, 80) : "";
            
            const confirmed = await new Promise((resolve) => {
                const overlay = document.createElement("div");
                overlay.style.position = "fixed";
                overlay.style.top = "0";
                overlay.style.left = "0";
                overlay.style.width = "100vw";
                overlay.style.height = "100vh";
                overlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
                overlay.style.backdropFilter = "blur(4px)";
                overlay.style.zIndex = "999999";
                overlay.style.display = "flex";
                overlay.style.alignItems = "center";
                overlay.style.justifyContent = "center";
                overlay.style.opacity = "0";
                overlay.style.transition = "opacity 0.25s ease";

                const modal = document.createElement("div");
                modal.style.background = "var(--SmartThemeBlurTintColor, rgba(20, 20, 20, 0.85))";
                modal.style.border = "1px solid rgba(255, 255, 255, 0.1)";
                modal.style.borderRadius = "12px";
                modal.style.padding = "24px";
                modal.style.maxWidth = "400px";
                modal.style.width = "90%";
                modal.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
                modal.style.color = "var(--SmartThemeBodyColor, #e0e0e0)";
                modal.style.fontFamily = "inherit";
                modal.style.transform = "scale(0.95)";
                modal.style.transition = "transform 0.25s ease";

                modal.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; color: var(--SmartThemeHeaderColor, #fff);">
                        <i class="fa-solid fa-angles-left" style="font-size: 1.1rem; opacity: 0.8;"></i>
                        <h3 style="margin: 0; font-size: 1.1rem; font-weight: 600;">Rewind Chat</h3>
                    </div>
                    <p style="margin: 0 0 16px 0; font-size: 0.9rem; opacity: 0.85; line-height: 1.4;">
                        Are you sure you want to rewind to this message? All subsequent messages will be removed.
                    </p>
                    <div style="background: rgba(0, 0, 0, 0.2); border-left: 3px solid rgba(255, 255, 255, 0.3); padding: 10px 12px; border-radius: 4px; font-size: 0.850rem; font-style: italic; margin-bottom: 20px; max-height: 80px; overflow: hidden; opacity: 0.9;">
                        "${snippet}${snippet.length >= 80 ? '...' : ''}"
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button id="rewind-cancel-btn" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); color: inherit; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: background 0.2s;">Cancel</button>
                        <button id="rewind-confirm-btn" style="background: var(--SmartThemeAccentColor, #4a6fa5); border: none; color: #fff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: opacity 0.2s;">Rewind</button>
                    </div>
                `;

                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                requestAnimationFrame(() => {
                    overlay.style.opacity = "1";
                    modal.style.transform = "scale(1)";
                });

                const closeModal = (result) => {
                    overlay.style.opacity = "0";
                    modal.style.transform = "scale(0.95)";
                    setTimeout(() => {
                        overlay.remove();
                        resolve(result);
                    }, 250);
                };

                modal.querySelector("#rewind-cancel-btn").addEventListener("click", () => closeModal(false));
                modal.querySelector("#rewind-confirm-btn").addEventListener("click", () => closeModal(true));
                overlay.addEventListener("click", (e) => {
                    if (e.target === overlay) closeModal(false);
                });
            });

            if (!confirmed) return;
        }

        chat.splice(messageIndex + 1);
        await context.saveChat();
        context.printMessages();
    } catch (err) {
        console.error("[Message Rewind] Error:", err);
    }
}

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
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                return luminance > 0.5 ? '#404040' : '#b0b0b0';
            }
        }
        current = current.parentElement;
    }
    return '#b0b0b0';
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

            // Look inside the message block for SillyTavern's native footer action area
            let bottomBar = block.querySelector(".mes_actions");
            if (!bottomBar) {
                bottomBar = document.createElement("div");
                bottomBar.className = "mes_actions";
                bottomBar.style.display = "flex";
                bottomBar.style.alignItems = "center";
                bottomBar.style.gap = "8px";
                bottomBar.style.marginTop = "8px";
                block.appendChild(bottomBar);
            }

            // Force flex properties so it aligns left with no center interference
            bottomBar.style.setProperty("display", "flex", "important");
            bottomBar.style.setProperty("justify-content", "flex-start", "important");
            bottomBar.style.setProperty("flex-direction", "row", "important");

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
            
            // Hardcode order to absolute first so it sits on the extreme left of the action bar
            rewindButton.style.order = "-9999";
            rewindButton.style.marginLeft = "0px";
            rewindButton.style.marginRight = "auto";

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

            bottomBar.prepend(rewindButton);
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
