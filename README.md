# AutoReply

A [Vencord](https://github.com/Vencord/Vencord) userplugin that automatically replies to messages matching configurable triggers. Supports per-user, per-server, and per-channel filters.

## Features

- Auto-reply to messages matching text triggers or regex patterns
- Reply as Discord reply (with reference) or plain text
- Filter by user ID, server ID, or channel ID
- Multiple auto-replies with independent enable/disable
- Quick-add from user right-click context menu
- Quick-add from channel right-click context menu
- Settings modal to manage all auto-replies
- Case-insensitive matching
- Stored locally (client-side only)

## Installation

### Manual (Vencord UserPlugin)

1. Navigate to your Vencord userplugins directory:
   - **Windows:** `%APPDATA%/Vencord/userplugins/`
   - **Linux:** `~/.config/Vencord/userplugins/`
   - **macOS:** `~/Library/Application Support/Vencord/userplugins/`

2. Clone this repository into that directory:
   ```bash
   cd ~/.config/Vencord/userplugins/
   git clone https://github.com/vSake-clean/vencord-AutoReply.git AutoReply
   ```

3. Restart Discord (or Vesktop).

4. Go to **Vencord Settings - Plugins** and enable **AutoReply**.

### Vesktop (Custom Vencord Build)

If you use Vesktop with a custom Vencord directory:

1. Clone into your Vencord source's `src/userplugins/` folder:
   ```bash
   cd ~/vencord-custom/vencord-src/src/userplugins/
   git clone https://github.com/vSake-clean/vencord-AutoReply.git AutoReply
   ```

2. Rebuild Vencord:
   ```bash
   cd ~/vencord-custom/vencord-src
   pnpm build
   ```

3. Copy build output to your Vesktop custom Vencord dir:
   ```bash
   cp dist/vencordDesktop{Main,Preload,Renderer}.{js,css} ~/.config/vesktop/customVencord/
   ```

4. Restart Vesktop.

## Usage

- **Open settings:** Right-click any user or channel and select "Auto-Reply" or "Add Auto-Reply"
- **Add auto-reply:** Click "Add New" in the settings modal
- **Quick-add for user:** Right-click a user -> Auto-Reply -> Add Reply for This User
- **Quick-add for channel:** Right-click a channel -> Add Auto-Reply for This Channel
- **Toggle:** Click ON/OFF button next to any auto-reply
- **Edit:** Click the pencil icon to modify an auto-reply
- **Delete:** Click the trash icon to remove an auto-reply

### Trigger Types

- **Text:** Case-insensitive partial match (e.g., "hello" matches "Hello World!")
- **Regex:** Case-insensitive regex pattern (e.g., `^hey\s+\w+` matches "Hey there")

### Reply Types

- **Reply:** Sends as a Discord reply with reference to the original message
- **Text:** Sends as a plain message (no reference)

### Filters

All filters are optional. Leave empty to respond to everyone.

- **User ID:** Only respond to messages from this specific user
- **Server ID:** Only respond in this specific server
- **Channel ID:** Only respond in this specific channel

## Files

| File | Description |
|------|-------------|
| `index.tsx` | Main plugin - flux handler, context menus |
| `data.ts` | Data layer - DataStore persistence, matching logic |
| `styles.css` | Modal and list styles |
| `components/AutoReplyModal.tsx` | Modal for creating/editing auto-replies |
| `components/AutoReplyListModal.tsx` | Settings modal listing all auto-replies |

## Requirements

- [Vencord](https://github.com/Vencord/Vencord) (latest)

## License

GPL-3.0-or-later
