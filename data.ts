/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { useForceUpdater } from "@utils/react";

export const DS_KEY = "AutoReply_data";

export interface ResponseOption {
    text: string;
    weight: number;
}

export interface AutoReply {
    id: string;
    trigger: string;
    isRegex: boolean;
    response: string;
    responses: ResponseOption[];
    replyType: "reply" | "text";
    enabled: boolean;
    userId: string;
    serverId: string;
    channelId: string;
    onlyPv: boolean;
    onlyServer: boolean;
    createdAt: number;
    updatedAt: number;
}

export type AutoRepliesData = Record<string, AutoReply>;

let cachedReplies: AutoRepliesData = {};
let forceUpdateReplies: (() => void) | undefined;

export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function loadReplies(): Promise<AutoRepliesData> {
    cachedReplies = (await DataStore.get<AutoRepliesData>(DS_KEY)) ?? {};
    return cachedReplies;
}

export async function saveReplies(replies: AutoRepliesData): Promise<void> {
    cachedReplies = replies;
    await DataStore.set(DS_KEY, replies);
    forceUpdateReplies?.();
}

export function useAutoReply() {
    forceUpdateReplies = useForceUpdater();
}

export function initAutoReply() {
    loadReplies().then(() => forceUpdateReplies?.());
}

export function getReplies(): AutoRepliesData {
    return cachedReplies;
}

export function getReply(id: string): AutoReply | undefined {
    return cachedReplies[id];
}

export async function addReply(reply: Omit<AutoReply, "id" | "createdAt" | "updatedAt">): Promise<AutoReply> {
    const now = Date.now();
    const newReply: AutoReply = {
        ...reply,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
    };
    cachedReplies[newReply.id] = newReply;
    await saveReplies(cachedReplies);
    return newReply;
}

export async function updateReply(id: string, updates: Partial<Omit<AutoReply, "id" | "createdAt">>): Promise<void> {
    if (!cachedReplies[id]) return;
    cachedReplies[id] = {
        ...cachedReplies[id],
        ...updates,
        updatedAt: Date.now(),
    };
    await saveReplies(cachedReplies);
}

export async function deleteReply(id: string): Promise<void> {
    delete cachedReplies[id];
    await saveReplies(cachedReplies);
}

export async function toggleReply(id: string): Promise<void> {
    if (!cachedReplies[id]) return;
    cachedReplies[id].enabled = !cachedReplies[id].enabled;
    cachedReplies[id].updatedAt = Date.now();
    await saveReplies(cachedReplies);
}

export function getEnabledReplies(): AutoReply[] {
    return Object.values(cachedReplies).filter(r => r.enabled);
}

export function matchReply(reply: AutoReply, messageContent: string): boolean {
    if (!reply.enabled) return false;
    if (!messageContent) return false;

    if (reply.isRegex) {
        try {
            const regex = new RegExp(reply.trigger, "i");
            return regex.test(messageContent);
        } catch {
            return false;
        }
    }

    return messageContent.toLowerCase().includes(reply.trigger.toLowerCase());
}

export function selectResponse(reply: AutoReply): string {
    if (reply.responses && reply.responses.length > 0) {
        const totalWeight = reply.responses.reduce((sum, r) => sum + r.weight, 0);
        if (totalWeight <= 0) return reply.response;

        let random = Math.random() * totalWeight;
        for (const option of reply.responses) {
            random -= option.weight;
            if (random <= 0) return option.text;
        }
        return reply.responses[reply.responses.length - 1].text;
    }
    return reply.response;
}
