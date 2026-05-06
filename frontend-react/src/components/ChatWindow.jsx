import { useEffect, useRef } from "react";

function ChatWindow({ messages, loading }) {
  const bottomRef = useRef();
  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, loading]);
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "30px 40px",
        paddingBottom: "140px",
        background: "transparent",
        color: "white",
        maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
      }}
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              background: msg.role === "user" ? "#19c37d" : "#2a2b32",
              color: "white",
              padding: "12px 16px",
              borderRadius: "12px",
              maxWidth: "60%", // 🔥 IMPORTANT FIX
              wordWrap: "break-word", // 🔥 TEXT WRAP
              lineHeight: "1.5",
              fontSize: "15px",
            }}
          >
            {msg.content}
          </div>
        </div>
      ))}

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginTop: "10px",
          }}
        >
          <div
            style={{
              background: "#444654",
              color: "white",
              padding: "10px",
              borderRadius: "10px",
            }}
          >
            Dr. Ambedkar is thinking...
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
    
  );
}

export default ChatWindow;
