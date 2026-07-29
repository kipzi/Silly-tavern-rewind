const extensionName = "st-message-rewind";
const DEFAULT_SETTINGS = { requireConfirmation: true };

/* -----------------------------
   REWIND LOGIC
----------------------------- */
async function performRewind(messageIndex) {
    try {
        const context = SillyTavern.getContext();
        const chat = context.chat;

        if (messageIndex < 0 || messageIndex >= chat.length) return;

        const settings =
            (context.extensionSettings && context.extensionSettings[extensionName]) ||
            DEFAULT_SETTINGS;

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

/* -----------------------------
   BUTTON INJECTION
----------------------------- */
function injectRewindButtons() {
    try {
        const messageBlocks = document.querySelectorAll(".mes");

        messageBlocks.forEach((block) => {
            if (block.querySelector(".rewind-btn-custom")) return;

            const messageIdStr =
                block.getAttribute("mesid") || block.getAttribute("data-mesid");
            if (!messageIdStr) return;

            const messageId = parseInt(messageIdStr, 10);
            if (isNaN(messageId)) return;

            let bottomBar = block.querySelector(".mes-bottom-toolbar");
            if (!bottomBar) {
                bottomBar = document.createElement("div");
                bottomBar.className = "mes-bottom-toolbar";

                bottomBar.style.display = "flex";
                bottomBar.style.justifyContent = "flex-end";
                bottomBar.style.alignItems = "center";
                bottomBar.style.gap = "6px";
                bottomBar.style.marginTop = "8px";
                bottomBar.style.paddingTop = "6px";
                bottomBar.style.borderTop = "1px solid rgba(255, 255, 255, 0.05)";
                bottomBar.style.order = "999";

                block.appendChild(bottomBar);
            }

            const rewindButton = document.createElement("button");
            rewindButton.className = "rewind-btn-custom";
            rewindButton.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';

            rewindButton.style.background = "transparent";
            rewindButton.style.border = "none";
            rewindButton.style.color = "rgba(255, 255, 255, 0.7)";
            rewindButton.style.fontSize = "1rem";
            rewindButton.style.cursor = "pointer";
            rewindButton.style.padding = "2px 4px";
            rewindButton.style.transition = "color 0.2s ease";

            rewindButton.addEventListener("mouseenter", () => {
                rewindButton.style.color = "#ffffff";
            });

            rewindButton.addEventListener("mouseleave", () => {
                rewindButton.style.color = "rgba(255, 255, 255, 0.7)";
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

/* -----------------------------
   SETTINGS PANEL
----------------------------- */
function registerSettings() {
    const context = SillyTavern.getContext();

    SillyTavern.addExtensionSettings(extensionName, {
        name: "Message Rewind Settings",
        description: "Adds a rewind icon to each message to truncate chat history.",
        settings: `
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Message Rewind Settings</b>
                    <div class="inline-drawer-icon fa-solid fa-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content" style="display: block;">
                    <div class="flex-container flexFlowColumn">
                        <label class="checkbox_label" style="margin: 10px 0; cursor: pointer;">
                            <input type="checkbox" id="rewind_confirm_toggle" />
                            <span>Require confirmation dialog before deleting messages</span>
                        </label>
                        <small style="color: rgba(255, 255, 255, 0.5);">
                            Adds a rewind icon to the bottom of every message card.
                        </small>
                    </div>
                </div>
            </div>
        `,
        onload() {
            const settings =
                context.extensionSettings[extensionName] || DEFAULT_SETTINGS;

            const toggle = document.getElementById("rewind_confirm_toggle");
            toggle.checked = settings.requireConfirmation;

            toggle.addEventListener("change", (e) => {
                context.extensionSettings[extensionName].requireConfirmation =
                    e.target.checked;
            });
        },
    });
}

/* -----------------------------
   INITIALIZATION
----------------------------- */
jQuery(async () => {
    console.log("[Message Rewind] Loaded");

    registerSettings();

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
