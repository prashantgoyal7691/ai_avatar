import React from "react";
function Sidebar({
  chats,
  activeChatId,
  setActiveChatId,
  setChats,
  user,
  onLogin,
  onLogout,
  onSelectChat, // 👈 add this
}) {
  const [menu, setMenu] = React.useState(null);
  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      style={{
        width: "240px",
        height: "100%",
        overflowY: "auto",
        background: "linear-gradient(180deg, #1e1f24 0%, #18191d 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        padding: "14px",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          marginBottom: "14px",
          fontSize: "18px",
          fontWeight: "600",
          letterSpacing: "0.3px",
          opacity: 0.9,
        }}
      >
        Ambedkar AI
      </h3>

      <button
        onClick={(e) => {
          e.preventDefault();
          const newId = Date.now();
          setChats([...chats, { id: newId, messages: [], title: "New Chat" }]);
          setActiveChatId(newId);
        }}
        style={{
          padding: "12px",
          borderRadius: "12px",
          border: "none",
          background: "#19c37d",
          color: "white",
          marginBottom: "16px",
          cursor: "pointer",
          fontWeight: "500",
          transition: "0.2s ease",
        }}
        onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
        onMouseLeave={(e) => (e.target.style.opacity = 1)}
      >
        + New Chat
      </button>

      <div style={{ flex: 1, overflowY: "auto", paddingTop: "5px" }}>
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => {
              setActiveChatId(chat.id);
              if (onSelectChat) onSelectChat(); // 👈 trigger close
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu({
                x: e.clientX,
                y: e.clientY,
                chatId: chat.id,
              });
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const timer = setTimeout(() => {
                setMenu({
                  x: touch.clientX,
                  y: touch.clientY,
                  chatId: chat.id,
                });
              }, 600);
              e.currentTarget.dataset.longPressTimer = timer;
            }}
            onTouchEnd={(e) => {
              clearTimeout(e.currentTarget.dataset.longPressTimer);
            }}
            style={{
              padding: "12px",
              borderRadius: "10px",
              background:
                chat.id === activeChatId
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
              marginBottom: "6px",
              cursor: "pointer",
              transition: "0.2s ease",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {chat.title || `Chat ${chat.id}`}
          </div>
        ))}
      </div>
      {menu && (
        <div
          style={{
            position: "fixed",
            top: menu.y,
            left: menu.x,
            background: "#2a2b32",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            zIndex: 50,
          }}
          onMouseLeave={() => setMenu(null)}
        >
          {menu.type === "user" ? (
            <div>
              {/* 🔥 Email */}
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "13px",
                  opacity: 0.7,
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  marginBottom: "6px",
                }}
              >
                {user?.email}
              </div>

              {/* 🔥 Logout */}
              <div
                onClick={() => {
                  onLogout();
                  setMenu(null);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  color: "#ff4d4f",
                }}
              >
                Logout
              </div>
            </div>
          ) : (
            <div
              onClick={async () => {
                const chatId = menu.chatId;

                // 🔥 Call backend delete
                if (user) {
                  try {
                    await fetch(`${import.meta.env.VITE_API_URL}/delete-chat`, {
                      method: "DELETE",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        userId: user.uid,
                        chatId: chatId,
                      }),
                    });
                  } catch (err) {
                    console.error(err);
                  }
                }

                // 🔥 UI delete (existing logic)
                const updatedChats = chats.filter((c) => c.id !== chatId);

                if (updatedChats.length === 0) {
                  const newChat = { id: 1, messages: [] };
                  setChats([newChat]);
                  setActiveChatId(1);
                } else {
                  setChats(updatedChats);
                  setActiveChatId(updatedChats[0].id);
                }

                setMenu(null);
              }}
            >
              Delete Chat
            </div>
          )}
        </div>
      )}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "12px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {user ? (
          <div
            onClick={() =>
              setMenu({
                type: "user",
                x: 30,
                y: window.innerHeight - 120,
              })
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#2a2b32",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {user.displayName ? user.displayName[0] : "U"}
            </div>

            <div style={{ fontSize: "14px" }}>{user.displayName || "User"}</div>
          </div>
        ) : (
          <div
            onClick={onLogin}
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "#19c37d",
              textAlign: "center",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Login
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
