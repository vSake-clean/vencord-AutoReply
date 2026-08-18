/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getReplies, toggleReply, deleteReply, AutoReply, useAutoReply } from "../data";
import { openAutoReplyModal } from "./AutoReplyModal";
import { Forms, Modal, openModal, useState, useCallback } from "@webpack/common";
import ErrorBoundary from "@components/ErrorBoundary";

interface ListModalProps {
    modalProps: {
        onClose: () => void;
    };
}

function AutoReplyListItem({ reply, onRefresh }: { reply: AutoReply; onRefresh: () => void }) {
    const handleToggle = useCallback(async () => {
        await toggleReply(reply.id);
        onRefresh();
    }, [reply.id, onRefresh]);

    const handleEdit = useCallback(() => {
        openAutoReplyModal(reply, onRefresh);
    }, [reply, onRefresh]);

    const handleDelete = useCallback(async () => {
        await deleteReply(reply.id);
        onRefresh();
    }, [reply.id, onRefresh]);

    const filters = [
        reply.userId && `User: ${reply.userId}`,
        reply.serverId && `Server: ${reply.serverId}`,
        reply.channelId && `Channel: ${reply.channelId}`,
    ].filter(Boolean);

    return (
        <div className={`vc-autoreply-list-item ${reply.enabled ? "" : "disabled"}`}>
            <div className="vc-autoreply-list-item-header">
                <div className="vc-autoreply-list-item-trigger">
                    {reply.isRegex ? <span className="vc-autoreply-regex-badge">REGEX</span> : null}
                    <span className="vc-autoreply-trigger-text">{reply.trigger}</span>
                </div>
                <div className="vc-autoreply-list-item-actions">
                    <button
                        className={`vc-autoreply-toggle-btn ${reply.enabled ? "enabled" : ""}`}
                        onClick={handleToggle}
                        title={reply.enabled ? "Disable" : "Enable"}
                    >
                        {reply.enabled ? "ON" : "OFF"}
                    </button>
                    <button
                        className="vc-autoreply-edit-btn"
                        onClick={handleEdit}
                        title="Edit"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                    </button>
                    <button
                        className="vc-autoreply-delete-btn"
                        onClick={handleDelete}
                        title="Delete"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="vc-autoreply-list-item-response">
                <span className="vc-autoreply-response-label">
                    {reply.replyType === "reply" ? "Reply:" : "Text:"}
                </span>
                <span className="vc-autoreply-response-text">{reply.response}</span>
            </div>
            {filters.length > 0 && (
                <div className="vc-autoreply-list-item-filters">
                    Filters: {filters.join(" | ")}
                </div>
            )}
        </div>
    );
}

function AutoReplyListModalInner({ modalProps }: ListModalProps) {
    const [, setRefreshKey] = useState(0);
    useAutoReply();

    const handleRefresh = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    const replies = Object.values(getReplies());
    const sortedReplies = replies.sort((a, b) => b.createdAt - a.createdAt);

    const handleAdd = useCallback(() => {
        openAutoReplyModal(undefined, handleRefresh);
    }, [handleRefresh]);

    return (
        <Modal
            {...modalProps}
            title="Auto-Reply Settings"
            actions={[
                {
                    text: "Add New",
                    variant: "primary",
                    onClick: handleAdd,
                },
            ]}
        >
            <div className="vc-autoreply-list-container">
                {sortedReplies.length === 0 ? (
                    <div className="vc-autoreply-list-empty">
                        <Forms.FormTitle tag="h5">No Auto-Replies</Forms.FormTitle>
                        <p>Click "Add New" to create your first auto-reply.</p>
                    </div>
                ) : (
                    <div className="vc-autoreply-list">
                        {sortedReplies.map(reply => (
                            <AutoReplyListItem
                                key={reply.id}
                                reply={reply}
                                onRefresh={handleRefresh}
                            />
                        ))}
                    </div>
                )}
                <div className="vc-autoreply-list-info">
                    <Forms.FormTitle tag="h5">How it works</Forms.FormTitle>
                    <p>When someone sends a message matching a trigger, your response is sent automatically. Filters restrict when the auto-reply activates.</p>
                </div>
            </div>
        </Modal>
    );
}

export function openAutoReplyListModal() {
    openModal((modalProps) => (
        <AutoReplyListModalInner modalProps={modalProps} />
    ));
}
