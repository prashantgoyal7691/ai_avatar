import { useState } from "react";

function InputBar({ onSend }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div
      style={{
        display: "flex",
        padding: "14px",
        background: "#2a2b32",
        borderRadius: "16px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask Dr. Ambedkar..."
        style={{
          flex: 1,
          padding: "12px",
          background: "transparent",
          color: "white",
          borderRadius: "8px",
          border: "none",
          outline: "none",
          fontSize: "14px",
        }}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />

      <button
        onClick={handleSend}
        style={{
          marginLeft: "10px",
          padding: "10px 15px",
          borderRadius: "8px",
          border: "none",
          background: "#19c37d",
          color: "white",
          cursor: "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
}

export default InputBar;
