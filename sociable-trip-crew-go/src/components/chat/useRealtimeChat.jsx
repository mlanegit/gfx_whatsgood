import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export function useRealtimeChat(groupId, myName) {
  const [messages, setMessages]     = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const typingTimerRef = useRef(null);
  const myTypingRecordRef = useRef(null);

  // ── Load initial messages
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    base44.entities.ChatMessage.filter({ group_id: groupId }, "created_date", 100)
      .then(msgs => setMessages(msgs))
      .finally(() => setLoading(false));
  }, [groupId]);

  // ── Subscribe to new messages in real-time
  useEffect(() => {
    if (!groupId) return;
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.group_id !== groupId) return;
      if (event.type === "create") {
        setMessages(prev => [...prev, event.data]);
        // mark as read if it's from someone else
        if (event.data.user_name !== myName) {
          markRead(event.data);
        }
      } else if (event.type === "update") {
        setMessages(prev => prev.map(m => m.id === event.id ? event.data : m));
      }
    });
    return unsub;
  }, [groupId, myName]);

  // ── Subscribe to typing indicators
  useEffect(() => {
    if (!groupId) return;
    const unsub = base44.entities.TypingIndicator.subscribe((event) => {
      if (event.data?.group_id !== groupId) return;
      if (event.data?.user_name === myName) return;
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u !== event.data.user_name);
        if (event.data.is_typing) return [...filtered, event.data.user_name];
        return filtered;
      });
    });
    return unsub;
  }, [groupId, myName]);

  const markRead = async (msg) => {
    if (!msg.read_by?.includes(myName)) {
      await base44.entities.ChatMessage.update(msg.id, {
        read_by: [...(msg.read_by || []), myName],
      });
    }
  };

  // ── Send a text message
  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    await base44.entities.ChatMessage.create({
      group_id: groupId,
      user_name: myName,
      text,
      type: "text",
      read_by: [myName],
    });
    stopTyping();
  }, [groupId, myName]);

  // ── Send a media message
  const sendMediaMessage = useCallback(async ({ url, mediaType, caption = "" }) => {
    await base44.entities.ChatMessage.create({
      group_id: groupId,
      user_name: myName,
      text: caption,
      type: "media",
      media_url: url,
      media_type: mediaType,
      read_by: [myName],
    });
  }, [groupId, myName]);

  // ── Typing indicator logic
  const startTyping = useCallback(async () => {
    clearTimeout(typingTimerRef.current);

    if (!myTypingRecordRef.current) {
      // Create or find existing record
      const existing = await base44.entities.TypingIndicator.filter({ group_id: groupId, user_name: myName });
      if (existing.length > 0) {
        myTypingRecordRef.current = existing[0].id;
        await base44.entities.TypingIndicator.update(existing[0].id, { is_typing: true });
      } else {
        const rec = await base44.entities.TypingIndicator.create({ group_id: groupId, user_name: myName, is_typing: true });
        myTypingRecordRef.current = rec.id;
      }
    } else {
      await base44.entities.TypingIndicator.update(myTypingRecordRef.current, { is_typing: true });
    }

    typingTimerRef.current = setTimeout(stopTyping, 2500);
  }, [groupId, myName]);

  const stopTyping = useCallback(async () => {
    clearTimeout(typingTimerRef.current);
    if (myTypingRecordRef.current) {
      await base44.entities.TypingIndicator.update(myTypingRecordRef.current, { is_typing: false });
    }
  }, []);

  useEffect(() => () => { clearTimeout(typingTimerRef.current); stopTyping(); }, []);

  return { messages, typingUsers, loading, sendMessage, sendMediaMessage, startTyping };
}