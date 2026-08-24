/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addReply, updateReply, deleteReply, AutoReply, ResponseOption } from "../data";
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
    const [responses, setResponses] = useState<ResponseOption[]>(existingReply?.responses ?? []);
    const [replyType, setReplyType] = useState<"reply" | "text">(existingReply?.replyType ?? "reply");
    const [isRegex, setIsRegex] = useState(existingReply?.isRegex ?? false);
    const [userId, setUserId] = useState(existingReply?.userId ?? "");
    const [serverId, setServerId] = useState(existingReply?.serverId ?? "");
    const [channelId, setChannelId] = useState(existingReply?.channelId ?? "");
    const [onlyPv, setOnlyPv] = useState(existingReply?.onlyPv ?? false);
    const [onlyServer, setOnlyServer] = useState(existingReply?.onlyServer ?? false);

    const isEditing = Boolean(existingReply?.id);

    const handleSave = useCallback(async () => {
        if (!trigger.trim()) return;

        const hasResponse = response.trim() || responses.some(r => r.text.trim());
        if (!hasResponse) return;

        const replyData = {
            trigger: trigger.trim(),
            response: response.trim(),
            responses,
            replyType,
            isRegex,
            userId: userId.trim(),
            serverId: serverId.trim(),
            channelId: channelId.trim(),
            onlyPv,
            onlyServer,
        };

        if (isEditing && existingReply?.id) {
            await updateReply(existingReply.id, {
                ...replyData,
                enabled: existingReply.enabled,
            });
        } else {
            await addReply({
                ...replyData,
                enabled: true,
            });
        }
        onSave();
        modalProps.onClose();
    }, [trigger, response, responses, replyType, isRegex, userId, serverId, channelId, onlyPv, onlyServer, isEditing, existingReply, onSave, modalProps]);

    const handleDelete = useCallback(async () => {
        if (isEditing && existingReply?.id) {
            await deleteReply(existingReply.id);
            onSave();
        }
        modalProps.onClose();
    }, [isEditing, existingReply, onSave, modalProps]);

    const addResponse = useCallback(() => {
        setResponses(prev => [...prev, { text: "", weight: 1 }]);
    }, []);

    const updateResponse = useCallback((index: number, field: "text" | "weight", value: string | number) => {
        setResponses(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    }, []);

    const removeResponse = useCallback((index: number) => {
        setResponses(prev => prev.filter((_, i) => i !== index));
    }, []);

    const hasFilter = onlyPv || onlyServer || userId.trim() || serverId.trim() || channelId.trim();
    const totalWeight = responses.reduce((sum, r) => sum + r.weight, 0);

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
                    disabled: !trigger.trim() || (!response.trim() && !responses.some(r => r.text.trim())),
                },
            ]}
        >
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

            <div className="vc-autoreply-modal-section">
                <Forms.FormTitle tag="h5">Response</Forms.FormTitle>
                <TextInput
                    value={response}
                    onChange={setResponse}
                    placeholder="What to reply with..."
                />
            </div>

            <div className="vc-autoreply-modal-section">
                <div className="vc-autoreply-responses-header">
                    <Forms.FormTitle tag="h5">Responses (optional)</Forms.FormTitle>
                    <button
                        className="vc-autoreply-add-response-btn"
                        onClick={addResponse}
                    >
                        + Add
                    </button>
                </div>
                <div className="vc-autoreply-hint">
                    Add multiple responses with weights. Random selection based on weight.
                </div>

                {responses.length > 0 && (
                    <div className="vc-autoreply-responses-list">
                        {responses.map((resp, idx) => (
                            <div key={idx} className="vc-autoreply-response-item">
                                <div className="vc-autoreply-response-row">
                                    <TextInput
                                        value={resp.text}
                                        onChange={val => updateResponse(idx, "text", val)}
                                        placeholder="Response text..."
                                        className="vc-autoreply-response-input"
                                    />
                                    <div className="vc-autoreply-weight-input">
                                        <input
                                            type="number"
                                            value={resp.weight}
                                            onChange={e => updateResponse(idx, "weight", Math.max(1, parseInt(e.target.value) || 1))}
                                            min="1"
                                            className="vc-autoreply-weight-number"
                                        />
                                        <span className="vc-autoreply-weight-label">
                                            {totalWeight > 0 ? Math.round((resp.weight / totalWeight) * 100) : 0}%
                                        </span>
                                    </div>
                                    <button
                                        className="vc-autoreply-remove-btn"
                                        onClick={() => removeResponse(idx)}
                                        title="Remove"
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {responses.length > 0 && (
                    <div className="vc-autoreply-responses-summary">
                        Total weight: {totalWeight} | {responses.length} response(s)
                    </div>
                )}
            </div>

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
