/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addReply, updateReply, deleteReply, AutoReply } from "../data";
import { Forms, Modal, openModal, TextInput, useState, useRef, useCallback } from "@webpack/common";
import ErrorBoundary from "@components/ErrorBoundary";

interface ModalProps {
    modalProps: {
        onClose: () => void;
    };
    existingReply?: AutoReply;
    onSave: () => void;
}

function AutoReplyModalInner({ modalProps, existingReply, onSave }: ModalProps) {
    const [trigger, setTrigger] = useState(existingReply?.trigger ?? "");
    const [response, setResponse] = useState(existingReply?.response ?? "");
    const [replyType, setReplyType] = useState<"reply" | "text">(existingReply?.replyType ?? "reply");
    const [isRegex, setIsRegex] = useState(existingReply?.isRegex ?? false);
    const [userId, setUserId] = useState(existingReply?.userId ?? "");
    const [serverId, setServerId] = useState(existingReply?.serverId ?? "");
    const [channelId, setChannelId] = useState(existingReply?.channelId ?? "");
    const [onlyPv, setOnlyPv] = useState(existingReply?.onlyPv ?? false);
    const [onlyServer, setOnlyServer] = useState(existingReply?.onlyServer ?? false);

    const isEditing = Boolean(existingReply?.id);

    const handleSave = useCallback(async () => {
        if (!trigger.trim() || !response.trim()) return;

        if (isEditing && existingReply?.id) {
            await updateReply(existingReply.id, {
                trigger: trigger.trim(),
                response: response.trim(),
                replyType,
                isRegex,
                userId: userId.trim(),
                serverId: serverId.trim(),
                channelId: channelId.trim(),
                onlyPv,
                onlyServer,
                enabled: existingReply.enabled,
            });
        } else {
            await addReply({
                trigger: trigger.trim(),
                response: response.trim(),
                replyType,
                isRegex,
                enabled: true,
                userId: userId.trim(),
                serverId: serverId.trim(),
                channelId: channelId.trim(),
                onlyPv,
                onlyServer,
            });
        }
        onSave();
        modalProps.onClose();
    }, [trigger, response, replyType, isRegex, userId, serverId, channelId, onlyPv, onlyServer, isEditing, existingReply, onSave, modalProps]);

    const handleDelete = useCallback(async () => {
        if (isEditing && existingReply?.id) {
            await deleteReply(existingReply.id);
            onSave();
        }
        modalProps.onClose();
    }, [isEditing, existingReply, onSave, modalProps]);

    const hasFilter = onlyPv || onlyServer || userId.trim() || serverId.trim() || channelId.trim();

    return (
        <Modal
            {...modalProps}
            title={isEditing ? "Edit Auto-Reply" : "New Auto-Reply"}
            actions={[
                isEditing
                    ? {
                        text: "Delete",
                        variant: "danger",
                        onClick: handleDelete,
                    }
                    : {
                        text: "Cancel",
                        variant: "secondary",
                        onClick: modalProps.onClose,
                    },
                {
                    text: "Save",
                    variant: "primary",
                    onClick: handleSave,
                    disabled: !trigger.trim() || !response.trim(),
                },
            ]}
        >
            {/* Trigger Section */}
            <div className="vc-autoreply-modal-section">
                <Forms.FormTitle tag="h5">Trigger</Forms.FormTitle>
                <TextInput
                    value={trigger}
                    onChange={setTrigger}
                    placeholder={isRegex ? "e.g. ^hello\\s+world" : "e.g. hello"}
                    autoFocus
                />
                <div className="vc-autoreply-checkbox-row">
                    <label className="vc-autoreply-checkbox-label">
                        <input
                            type="checkbox"
                            checked={isRegex}
                            onChange={e => setIsRegex(e.target.checked)}
                            className="vc-autoreply-checkbox"
                        />
                        <span>Use regex pattern</span>
                    </label>
                </div>
                <div className="vc-autoreply-hint">
                    {isRegex
                        ? "Regex is case-insensitive. Match anywhere in the message."
                        : "Case-insensitive partial match in message content."}
                </div>
            </div>

            {/* Response Section */}
            <div className="vc-autoreply-modal-section">
                <Forms.FormTitle tag="h5">Response</Forms.FormTitle>
                <TextInput
                    value={response}
                    onChange={setResponse}
                    placeholder="What to reply with..."
                />
            </div>

            {/* Reply Type Section */}
            <div className="vc-autoreply-modal-section">
                <Forms.FormTitle tag="h5">Reply Type</Forms.FormTitle>
                <div className="vc-autoreply-radio-group">
                    <label className="vc-autoreply-radio-label">
                        <input
                            type="radio"
                            name="replyType"
                            value="reply"
                            checked={replyType === "reply"}
                            onChange={() => setReplyType("reply")}
                            className="vc-autoreply-radio"
                        />
                        <span>Reply (with reference)</span>
                    </label>
                    <label className="vc-autoreply-radio-label">
                        <input
                            type="radio"
                            name="replyType"
                            value="text"
                            checked={replyType === "text"}
                            onChange={() => setReplyType("text")}
                            className="vc-autoreply-radio"
                        />
                        <span>Text (just send message)</span>
                    </label>
                </div>
            </div>

            {/* Filters Section */}
            <div className="vc-autoreply-modal-section">
                <Forms.FormTitle tag="h5">Filters (optional)</Forms.FormTitle>
                <div className="vc-autoreply-hint">
                    Leave empty to respond to everyone. Fill in to restrict.
                </div>

                <div className="vc-autoreply-checkbox-row">
                    <label className="vc-autoreply-checkbox-label">
                        <input
                            type="checkbox"
                            checked={onlyPv}
                            onChange={e => {
                                setOnlyPv(e.target.checked);
                                if (e.target.checked) setOnlyServer(false);
                            }}
                            className="vc-autoreply-checkbox"
                        />
                        <span>Only PV (DM)</span>
                    </label>
                </div>

                <div className="vc-autoreply-checkbox-row">
                    <label className="vc-autoreply-checkbox-label">
                        <input
                            type="checkbox"
                            checked={onlyServer}
                            onChange={e => {
                                setOnlyServer(e.target.checked);
                                if (e.target.checked) setOnlyPv(false);
                            }}
                            className="vc-autoreply-checkbox"
                        />
                        <span>Only Server</span>
                    </label>
                </div>

                <div className="vc-autoreply-filter-group">
                    <Forms.FormTitle tag="h5">User ID</Forms.FormTitle>
                    <TextInput
                        value={userId}
                        onChange={setUserId}
                        placeholder="Only respond to this user (ID)"
                    />
                </div>

                <div className="vc-autoreply-filter-group">
                    <Forms.FormTitle tag="h5">Server ID</Forms.FormTitle>
                    <TextInput
                        value={serverId}
                        onChange={setServerId}
                        placeholder="Only respond in this server (ID)"
                    />
                </div>

                <div className="vc-autoreply-filter-group">
                    <Forms.FormTitle tag="h5">Channel ID</Forms.FormTitle>
                    <TextInput
                        value={channelId}
                        onChange={setChannelId}
                        placeholder="Only respond in this channel (ID)"
                    />
                </div>

                {hasFilter && (
                    <div className="vc-autoreply-filter-summary">
                        Active filters: {[
                            onlyPv && "PV Only",
                            onlyServer && "Server Only",
                            userId.trim() && "User",
                            serverId.trim() && "Server ID",
                            channelId.trim() && "Channel",
                        ].filter(Boolean).join(", ")}
                    </div>
                )}
            </div>
        </Modal>
    );
}

export function openAutoReplyModal(existingReply?: AutoReply, onSave?: () => void) {
    openModal((modalProps) => (
        <AutoReplyModalInner
            modalProps={modalProps}
            existingReply={existingReply}
            onSave={onSave ?? (() => {})}
        />
    ));
}
