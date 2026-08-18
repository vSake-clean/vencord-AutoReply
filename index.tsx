/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { getEnabledReplies, matchReply, initAutoReply, useAutoReply, AutoReply } from "./data";
import { openAutoReplyListModal } from "./components/AutoReplyListModal";
import { openAutoReplyModal } from "./components/AutoReplyModal";
import { Menu, ChannelStore, UserStore, RestAPI, Constants, SnowflakeUtils } from "@webpack/common";
import definePlugin, { StartAt } from "@utils/types";
import ErrorBoundary from "@components/ErrorBoundary";
import "./styles.css";

function getCurrentUserId(): string | null {
    try {
        return UserStore?.getCurrentUser()?.id ?? null;
    } catch {
        return null;
    }
}

function getGuildIdForChannel(channelId: string): string | null {
    try {
        const channel = ChannelStore?.getChannel(channelId);
        return channel?.guild_id ?? null;
    } catch {
        return null;
    }
}

function sendReply(channelId: string, content: string, replyToMessage?: any): void {
    const body: any = {
        content,
        nonce: SnowflakeUtils.fromTimestamp(Date.now()),
        tts: false,
        type: 0,
    };

    if (replyToMessage) {
        body.message_reference = {
            message_id: replyToMessage.id,
            channel_id: channelId,
        };
    }

    RestAPI.post({
        url: Constants.Endpoints.MESSAGES(channelId),
        body,
    });
}

function onMessageCreate(event: any) {
    const { message } = event;
    if (!message) return;

    const currentUserId = getCurrentUserId();
    if (message.author?.id === currentUserId) return;

    const content = message.content;
    if (!content) return;

    const channelId = message.channel_id;
    const authorId = message.author?.id;
    const guildId = getGuildIdForChannel(channelId);

    const enabledReplies = getEnabledReplies();

    for (const reply of enabledReplies) {
        if (!matchReply(reply, content)) continue;

        if (reply.userId && reply.userId !== authorId) continue;
        if (reply.serverId && reply.serverId !== guildId) continue;
        if (reply.channelId && reply.channelId !== channelId) continue;

        const isPv = !guildId;
        if (reply.onlyPv && !isPv) continue;
        if (reply.onlyServer && isPv) continue;

        const shouldReply = reply.replyType === "reply" ? message : undefined;
        sendReply(channelId, reply.response, shouldReply);
        break;
    }
}

const UserContext: NavContextMenuPatchCallback = (children, props) => {
    const user = props.user;
    if (!user?.id) return;

    const container = findGroupChildrenByChildId("close-dm", children);
    if (!container) return;

    const idx = container.findIndex(c => c?.props?.id === "close-dm");
    if (idx === -1) return;

    container.splice(idx, 0,
        <Menu.MenuItem
            key="autoreply-group"
            id="autoreply-group"
            label="Auto-Reply"
        >
            <Menu.MenuItem
                key="autoreply-add-user"
                id="autoreply-add-user"
                label="Add Reply for This User"
                action={() => {
                    openAutoReplyModal({
                        id: "",
                        trigger: "",
                        isRegex: false,
                        response: "",
                        replyType: "reply",
                        enabled: true,
                        userId: user.id,
                        serverId: "",
                        channelId: "",
                        createdAt: 0,
                        updatedAt: 0,
                    });
                }}
            />
            <Menu.MenuItem
                key="autoreply-settings"
                id="autoreply-settings"
                label="Auto-Reply Settings"
                action={() => openAutoReplyListModal()}
            />
        </Menu.MenuItem>
    );
};

const ChannelContext: NavContextMenuPatchCallback = (children, props) => {
    const channel = props.channel;
    if (!channel?.id) return;

    const container = findGroupChildrenByChildId("copy-id", children);
    if (!container) return;

    const idx = container.findIndex(c => c?.props?.id === "copy-id");
    if (idx === -1) return;

    container.splice(idx, 0,
        <Menu.MenuItem
            key="autoreply-channel"
            id="autoreply-channel"
            label="Add Auto-Reply for This Channel"
            action={() => {
                openAutoReplyModal({
                    id: "",
                    trigger: "",
                    isRegex: false,
                    response: "",
                    replyType: "reply",
                    enabled: true,
                    userId: "",
                    serverId: "",
                    channelId: channel.id,
                    createdAt: 0,
                    updatedAt: 0,
                });
            }}
        />
    );
};

const GuildContext: NavContextMenuPatchCallback = (children, props) => {
    const guild = props.guild;
    if (!guild?.id) return;

    const container = findGroupChildrenByChildId("copy-id", children);
    if (!container) return;

    const idx = container.findIndex(c => c?.props?.id === "copy-id");
    if (idx === -1) return;

    container.splice(idx, 0,
        <Menu.MenuItem
            key="autoreply-guild"
            id="autoreply-guild"
            label="Add Auto-Reply for This Server"
            action={() => {
                openAutoReplyModal({
                    id: "",
                    trigger: "",
                    isRegex: false,
                    response: "",
                    replyType: "reply",
                    enabled: true,
                    userId: "",
                    serverId: guild.id,
                    channelId: "",
                    createdAt: 0,
                    updatedAt: 0,
                });
            }}
        />
    );
};

export default definePlugin({
    name: "AutoReply",
    authors: [{ name: "CipherOS", id: 0n }],
    description: "Automatically reply to messages matching triggers. Configure per user, server, or channel.",
    tags: ["auto-reply", "automation", "response"],

    contextMenus: {
        "user-context": UserContext,
        "channel-context": ChannelContext,
        "guild-context": GuildContext,
    },

    flux: {
        MESSAGE_CREATE: onMessageCreate,
    },

    useAutoReply,

    startAt: StartAt.WebpackReady,
    start() {
        initAutoReply();
        console.log("[AutoReply] Plugin started!");
    },

    stop() {
        console.log("[AutoReply] Plugin stopped!");
    },
});
