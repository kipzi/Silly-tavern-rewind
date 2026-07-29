# Message Rewind Button — SillyTavern Extension

A lightweight SillyTavern extension that adds a rewind icon to every message in the chat. Clicking the icon instantly rewinds the conversation to that point by deleting all messages that came after it.

This makes it easy to:
- branch a scene
- undo unwanted generations
- restart a conversation from a specific moment
- clean up long chats without manually deleting messages

The extension is designed to be minimal, unobtrusive, and theme‑adaptive.

## Features

### 🔄 Rewind Button on Every Message
Adds a small FA‑solid rewind icon (`fa-angles-left`) to the bottom-left action bar of each message.  
Clicking it rewinds the chat to that message.

### 🧼 Clean, Minimal UI
The button is:
- icon‑only  
- transparent background  
- no borders  
- theme‑adaptive color  
- hover‑brightening  
- positioned flush-left in the message action bar  

It blends naturally with SillyTavern’s UI and works across all themes.

### 🛡️ Optional Confirmation Modal
Before deleting messages, the extension can show a glass‑blur confirmation dialog with:
- a preview of the message you’re rewinding to  
- Cancel / Confirm buttons  
- smooth fade‑in / fade‑out animation  

This prevents accidental rewinds.

### ⚙️ Settings Drawer
Inside the SillyTavern Extensions panel, the extension adds a settings drawer:
- Require confirmation (toggle)  
- Short description of what the extension does  

Settings persist automatically.

### 🧠 Theme‑Adaptive Icon Color
The icon automatically adjusts its color based on the background luminance of the message card, ensuring visibility on both light and dark themes.

### ⚡ Fast & Safe
Rewind operations use SillyTavern’s native:
- `chat.splice()`
- `saveChat()`
- `printMessages()`

This ensures safe truncation without corrupting chat history.

## How It Works

1. A MutationObserver watches the chat container.  
2. When new messages appear, the extension injects a rewind icon into the `.mes_actions` toolbar.  
3. Clicking the icon triggers `performRewind(messageIndex)`.  
4. If confirmation is enabled, a modal appears.  
5. After confirmation, all messages after the selected one are removed.  
6. The chat is saved and re-rendered.

## Why Use This Extension?

SillyTavern’s built‑in delete tools are functional but slow for branching or pruning long chats.  
This extension gives you a single‑click rewind that feels natural and fast, especially when writing:
- branching narratives  
- roleplay scenes  
- iterative story drafts  
- complex character interactions  

It’s built to stay out of your way while giving you precise control over the timeline of your chat.

## Compatibility

- Works with all SillyTavern themes  
- Works with all message types (user, character, system)  
- Works with local and remote models  
- No dependencies beyond FontAwesome (already included in ST)
