import { useState, useRef, useEffect } from "react";
import { useRealtimeChat } from "./useRealtimeChat";
import { base44 } from "@/api/base44Client";

const colorFor = (name) => {
  const avatarColors = ["#1a1a2e","#16213e","#0f3460","#533483","#2b2d42","#8d2935","#1b4332","#b5451b"];
  let h = 0;
  for (let c of name) h = (h * 31 + c.charCodeAt(0)) % avatarColors.length;
  return avatarColors[h];
};
const initials = name => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

function Av({ name, photoUrl, size = 30 }) {
  const s = { width: size, height: size, borderRadius: "50%", flexShrink: 0 };
  if (photoUrl) return <img src={photoUrl} alt={name} style={{ ...s, objectFit: "cover" }} />;
  return (
    <div style={{ ...s, background: colorFor(name), color: "#fff", fontSize: size * 0.31, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {initials(name)}
    </div>
  );
}

function MediaBubble({ msg, isMe }) {
  const isVideo = msg.media_type === "video";
  return (
    <div style={{ maxWidth: 220, borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", overflow: "hidden", position: "relative" }}>
      {isVideo
        ? <video src={msg.media_url} controls style={{ width: "100%", maxHeight: 200, display: "block", background: "#000" }} />
        : <img src={msg.media_url} alt="shared" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
      }
      {msg.text && (
        <div style={{ padding: "7px 10px", background: isMe ? "#1a1a1a" : "#f5f5f3", fontSize: 13, color: isMe ? "#fff" : "#333", lineHeight: 1.4 }}>
          {msg.text}
        </div>
      )}
      <div style={{ position: "absolute", top: 7, right: 7, background: "rgba(0,0,0,.5)", borderRadius: 20, padding: "2px 7px", fontSize: 10, color: "#fff", backdropFilter: "blur(4px)" }}>
        {isVideo ? "🎬 video" : "🖼 photo"}
      </div>
    </div>
  );
}

// Read receipts: show avatar stack of readers (excluding sender)
function ReadReceipts({ readBy, myName, members }) {
  if (!readBy || readBy.length === 0) return null;
  const readers = readBy.filter(n => n !== myName);
  if (readers.length === 0) return null;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: -4, marginTop: 3 }}>
      {readers.slice(0, 4).map((name, i) => {
        const member = members?.find(m => m.name === name);
        return (
          <div key={i} style={{ marginLeft: i === 0 ? 0 : -5, zIndex: i }}>
            <Av name={name} photoUrl={member?.photoUrl} size={14} />
          </div>
        );
      })}
      {readers.length > 4 && (
        <div style={{ fontSize: 9, color: "#bbb", marginLeft: 4, lineHeight: "14px" }}>+{readers.length - 4}</div>
      )}
    </div>
  );
}

// Typing indicator bubble
function TypingBubble({ users }) {
  if (!users || users.length === 0) return null;
  const label = users.length === 1 ? `${users[0]} is typing` : `${users.slice(0,-1).join(", ")} and ${users[users.length-1]} are typing`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, animation: "slideUp .18s ease" }}>
      <div style={{ display: "flex", gap: 3, padding: "8px 14px", background: "#f5f5f3", borderRadius: "16px 16px 16px 4px" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#bbb", animation: `pulse 1.2s ${i*0.2}s infinite` }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#bbb", fontStyle: "italic" }}>{label}</div>
    </div>
  );
}

function MediaUploadBtn({ onUploaded, style = {}, children }) {
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      onUploaded({ url: file_url, mediaType, fileName: file.name });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <button onClick={() => ref.current?.click()} disabled={loading}
        style={{ cursor: loading ? "default" : "pointer", opacity: loading ? 0.5 : 1, ...style }}>
        {loading ? "⏳" : children}
      </button>
      <input ref={ref} type="file" accept="image/*,video/mp4,video/mov,video/quicktime"
        onChange={handleChange} style={{ display: "none" }} />
    </>
  );
}

export default function ChatPanel({ groupId, myName, members, onMediaSent }) {
  const { messages, typingUsers, loading, sendMessage, sendMediaMessage, startTyping } = useRealtimeChat(groupId, myName);
  const [input, setInput] = useState("");
  const msgEnd = useRef(null);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  const handleMedia = async ({ url, mediaType, fileName }) => {
    await sendMediaMessage({ url, mediaType });
    onMediaSent?.({ url, mediaType });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <div style={{ fontSize: 12, color: "#bbb" }}>Loading messages…</div>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.user_name === myName;
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 14, animation: "slideUp .18s ease" }}>
              {!isMe && <Av name={msg.user_name} photoUrl={members?.find(m => m.name === msg.user_name)?.photoUrl} size={30} />}
              <div style={{ maxWidth: "75%" }}>
                {!isMe && <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3, fontWeight: 500 }}>{msg.user_name}</div>}
                {msg.type === "media"
                  ? <MediaBubble msg={msg} isMe={isMe} />
                  : <div style={{ background: isMe ? "#1a1a1a" : "#f5f5f3", color: isMe ? "#fff" : "#1a1a1a", padding: "10px 14px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.4 }}>{msg.text}</div>
                }
                <div style={{ fontSize: 10, color: "#ccc", marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                  {formatTime(msg.created_date)}
                  {isMe && msg.read_by && msg.read_by.filter(n => n !== myName).length > 0 && (
                    <span style={{ marginLeft: 5, color: "#4a90d9" }}>✓✓</span>
                  )}
                </div>
                {isMe && <ReadReceipts readBy={msg.read_by} myName={myName} members={members} />}
              </div>
            </div>
          );
        })}
        <TypingBubble users={typingUsers} />
        <div ref={msgEnd} />
      </div>

      <div style={{ padding: "10px 14px 12px", borderTop: "1px solid #f0f0ee" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <MediaUploadBtn
            onUploaded={handleMedia}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "#f5f5f3", border: "none", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            📎
          </MediaUploadBtn>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); startTyping(); }}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Message the group…"
            style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1.5px solid #eee", fontSize: 14, background: "#fafaf8", color: "#1a1a1a", fontFamily: "inherit" }}
          />
          <button onClick={handleSend} style={{ width: 38, height: 38, borderRadius: "50%", background: "#1a1a1a", border: "none", cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>↑</button>
        </div>
        <div style={{ fontSize: 10, color: "#bbb", marginTop: 6, textAlign: "center" }}>📎 supports photos &amp; videos — auto-saved to Photos tab</div>
      </div>
    </div>
  );
}