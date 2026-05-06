import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import Avatar from "./components/Avatar";
import Sidebar from "./components/Sidebar";

function App() {
  const [chats, setChats] = useState([{ id: 1, messages: [] }]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const isMobile = window.innerWidth < 600;
  const isTablet = window.innerWidth >= 600 && window.innerWidth < 1024;
  const [showContributions, setShowContributions] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("userId", currentUser.uid);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (!user) return; // 🔥 only load when logged in

    const id = user.uid;

    console.log("Fetching chats for:", id);

    fetch(`${import.meta.env.VITE_API_URL}/get-chats?userId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Chats from DB:", data);

        if (data.chats && data.chats.length > 0) {
          const formattedChats = data.chats.map((chat) => ({
            id: Number(chat.chatId),
            messages: chat.messages || [],
            title:
              chat.messages && chat.messages.length > 0
                ? chat.messages[0].content.slice(0, 30)
                : "New Chat",
          }));

          setChats(formattedChats);
          setActiveChatId(formattedChats[0].id);
        } else {
          setChats([{ id: 1, messages: [] }]);
          setActiveChatId(1);
        }
      })
      .catch((err) => console.error(err));
  }, [user]);
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      localStorage.setItem("userId", result.user.uid);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("userId");

    // 🔥 reset UI
    setChats([{ id: 1, messages: [] }]);
    setActiveChatId(1);
  };
  if (window.isPaused === undefined) {
    window.isPaused = false;
  }
  if (window.isSpeaking === undefined) {
    window.isSpeaking = false;
  }

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const messages = activeChat.messages;

  const sendMessage = async (text) => {
    window.speechSynthesis.cancel();
    window.isSpeaking = false;
    window.isPaused = false;
    window.stopTalking && window.stopTalking();
    const userMsg = { role: "user", content: text };
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, userMsg] }
          : chat,
      ),
    );

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          userId: user ? user.uid : null,
          email: user ? user.email : null,
          chatId: activeChatId,
        }),
      });

      const data = await res.json();

      const fullText = data.answer;

      // Step 1: add empty assistant message + set title if first message
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat;

          const isFirstMessage = chat.messages.length === 1;
          // 👆 because user message already added before this

          return {
            ...chat,
            title: isFirstMessage ? text.slice(0, 30) : chat.title,
            messages: [
              ...chat.messages,
              { role: "assistant", content: "" }, // 🔥 important
            ],
          };
        }),
      );

      // Step 2: streaming effect
      let index = 0;

      const interval = setInterval(() => {
        index++;

        setChats((prev) =>
          prev.map((chat) => {
            if (chat.id !== activeChatId) return chat;

            const updatedMsgs = [...chat.messages];

            // 🔥 update last message (assistant)
            updatedMsgs[updatedMsgs.length - 1].content = fullText.slice(
              0,
              index,
            );

            return { ...chat, messages: updatedMsgs };
          }),
        );

        // 🔊 start speaking early
        if (index === 10) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(speech);
        }

        if (index >= fullText.length) {
          clearInterval(interval);
        }
      }, 15);

      const speech = new SpeechSynthesisUtterance(fullText);
      speech.rate = 0.9;
      speech.pitch = 1;
      speech.lang = "en-IN";
      window.speechSynthesis.cancel(); // stop previous speech

      speech.onstart = () => {
        window.isSpeaking = true;
        if (window.isPaused === undefined) {
          window.isPaused = false;
        }
        if (window.avatarReady && window.startTalking) {
          window.startTalking();
        }
      };

      speech.onend = () => {
        window.isSpeaking = false;
        window.isPaused = false;
        window.stopTalking && window.stopTalking();
      };
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#1e1f24",
      }}
    >
      {/* 🔝 TOP NAVBAR */}
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          height: "50px",
          display: "flex",
          alignItems: "center",
          padding: "0 15px",
          borderBottom: "1px solid #2a2b32",
          background: "#1e1f24",
          zIndex: 30,
        }}
      >
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          style={{
            fontSize: "18px",
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          <i className="fas fa-bars"></i>
        </button>

        <span style={{ marginLeft: "15px", fontWeight: "500" }}>
          Ambedkar AI
        </span>

        <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowContributions(true)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: "#2a2b32",
              color: "white",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Contributions
          </button>

          <button
            onClick={() =>
              window.open(
                "https://docs.google.com/forms/d/e/1FAIpQLSf3FXxkMdZb-nJAyb7RElZ6C-VLVp1Z2ZZqhljqniUadMKYkg/viewform",
                "_blank",
              )
            }
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: "#2a2b32",
              color: "white",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Feedback
          </button>
        </div>
      </div>

      {/* 🔥 MAIN CONTENT ROW */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          position: "relative",
          marginTop: "50px",
        }}
      >
        {/* SIDEBAR */}
        <div
          style={{
            position: "fixed",
            top: "50px",
            left: "0",
            bottom: "0",
            width: showSidebar
              ? isMobile
                ? "80%"
                : isTablet
                  ? "200px"
                  : "240px"
              : "0px",

            transform: isMobile
              ? showSidebar
                ? "translateX(0)"
                : "translateX(-100%)"
              : "none",

            transition: "0.3s ease",
            zIndex: isMobile ? 60 : 25,
            overflow: "hidden",
            transition: "0.3s",
            borderRight: showSidebar ? "1px solid #2a2b32" : "none",
          }}
        >
          <Sidebar
            chats={chats}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            setChats={setChats}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onSelectChat={() => {
              if (isMobile) setShowSidebar(false);
            }}
          />
        </div>
        {showSidebar && isMobile && (
          <div
            onClick={() => setShowSidebar(false)}
            style={{
              position: "fixed",
              top: "50px",
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 50,
            }}
          />
        )}

        {/* AVATAR SECTION */}
        <div
          style={{
            position: isMobile || isTablet ? "fixed" : "fixed",
            right: isMobile || isTablet ? "0" : "0",
            left: isMobile || isTablet ? "0" : "auto",
            top: isMobile || isTablet ? "50px" : "60px",
            width: isMobile || isTablet ? "100%" : "320px",
            height: isMobile
              ? "220px"
              : isTablet
                ? "260px"
                : "calc(100vh - 120px)",
            display: "flex",
            flexDirection: "column",
            margin: isMobile ? "0 auto" : "0",
            alignItems: "center",
            justifyContent: isMobile || isTablet ? "center" : "flex-end",
            padding: "10px",
            zIndex: 20,
            background: isMobile || isTablet ? "#1e1f24" : "transparent",
          }}
        >
          <div
            onClick={() => {
              const synth = window.speechSynthesis;
              if (!window.isSpeaking) return;

              if (!window.isPaused) {
                synth.pause();
                window.isPaused = true;
                if (window.stopTalking) window.stopTalking();
              } else {
                synth.resume();
                window.isPaused = false;
                if (window.startTalking) window.startTalking();
              }
            }}
            style={{
              width: "100%",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Avatar />
          </div>
        </div>

        {/* CHAT SECTION */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: isMobile
              ? "240px"
              : isTablet
              ? "280px"
              : "20px",
          }}
        >
          <div
            style={{
              width: isMobile ? "100%" : "900px",
              maxWidth: isMobile ? "100%" : "85%",
              padding: isMobile ? "0 10px" : isTablet ? "0 20px" : "0",
              marginRight: isMobile || isTablet ? "0" : "120px",
              transform: isMobile
                ? "none"
                : showSidebar
                  ? "translateX(40px)"
                  : "none",
              transition: "0.3s ease",
            }}
          >
            <ChatWindow messages={messages} loading={loading} />
          </div>
        </div>
      </div>

      {/* Fade overlay above input bar to hide chat content behind input */}
      <div
        style={{
          position: "fixed",
          bottom: "0",
          left: isMobile || isTablet ? "0" : showSidebar ? "240px" : "0",
          right: "0",
          height: "120px",
          background: "linear-gradient(to top, #1e1f24 70%, transparent)",
          zIndex: 15,
          pointerEvents: "none",
        }}
      />

      {/* INPUT BAR OUTSIDE MAIN CONTENT ROW */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: isMobile
            ? "50%"
            : isTablet
              ? "50%"
              : showSidebar
                ? "calc(40% + 120px)"
                : "40%",
          transform: "translateX(-50%)",
          width: isMobile ? "95%" : isTablet ? "90%" : "900px",
          maxWidth: isMobile ? "95%" : isTablet ? "85%" : "85%",
          zIndex: 20,
          padding: isMobile ? "0 10px" : "0",
        }}
      >
        <InputBar onSend={sendMessage} />
      </div>

      {showContributions && (
        <div
          onClick={() => setShowContributions(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "600px",
              maxWidth: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              background: "#1e1f24",
              borderRadius: "16px",
              padding: "25px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              textAlign: "left",
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>Contributions</h2>

            <p
              style={{
                opacity: 0.75,
                marginBottom: "20px",
                lineHeight: "1.6",
                textAlign: "left",
              }}
            >
              Dr. B. R. Ambedkar AI Avatar <br />
              Developed as part of an internship at{" "}
              <strong>
                DIAT (Defence Institute of Advanced Technology)
              </strong>{" "}
              <br />
              Under the guidance of <strong>Prof. CRS Kumar</strong>
            </p>

            <h3 style={{ marginTop: "10px" }}>Project Team</h3>
            <p
              style={{
                fontSize: "14px",
                opacity: 0.85,
                lineHeight: "1.6",
                textAlign: "left",
              }}
            >
              Shristi Muskan, Bhumika Joshi, Ikjot Kour, Suhani Gupta, Neharika
              Bajaj, Saumya Sarngal, Janvi Sharma, Annu Mathur, Alok Kumar,
              Prashant Goyal, Akshat Singh, Jatin Kumar, Ankit Maholiya, Lucky
              Yadav, Abhay Kumar
            </p>

            <h3 style={{ marginTop: "20px" }}>About</h3>
            <p style={{ opacity: 0.85, lineHeight: "1.6", textAlign: "left" }}>
              This project is an AI-powered interactive avatar of Dr. B. R.
              Ambedkar, designed to answer user queries related to Dr. B. R.
              Ambedkar using modern AI techniques. It integrates{" "}
              <strong>React</strong>, <strong>FastAPI</strong>, and{" "}
              <strong>Three.js </strong>
              to deliver a conversational and visual experience.
            </p>

            <h3 style={{ marginTop: "20px" }}>Certificate</h3>
            <div style={{ marginTop: "10px" }}>
              <a
                href="/internship_certificate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "10px",
                  padding: "10px 16px",
                  background: "#2a2b32",
                  borderRadius: "8px",
                  color: "white",
                  textDecoration: "none",
                }}
              >
                View Certificate
              </a>
            </div>

            <div style={{ marginTop: "25px" }}>
              <button
                onClick={() => setShowContributions(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#19c37d",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
