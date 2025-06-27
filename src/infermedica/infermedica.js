import { API_KEY_HS } from "../../assets/js/config.js";

// Gemini 기반 건강 챗봇 스크립트
document.addEventListener("DOMContentLoaded", () => {
    loadModalHtmlHs();     // 모달 HTML 불러오기
    setupOpenButtonHs();   // 열기 버튼 연결
});

// Gemini API
async function fetchGeminiResponseHs(userMessage) {

    const SYSTEM_PROMPT = `
당신은 종합병원 의사입니다.  
사용자가 증상을 설명하면 다음 원칙에 따라 간결하고 명확하게 설명하세요.

- 감정 표현 없이, 의학적 사실(Fact)만 제시  
- 의심되는 질환, 해부학적 부위, 가능한 원인, 경과 예후를 간결히 설명  
- 일반인이 이해할 수 있는 수준의 의학 용어를 사용  
- 지금 당장 어떤것을 해야하는지 알려줘
- 필요 시 병원 내원 여부와 응급 여부를 명확히 판단  
- 문장 수는 1~2줄 이내로 제한  
- 말투는 설명 중심으로, 공감이나 위로는 생략  
- ** 나 강조 문구, 특수문자, 숫자 없이 답변

예시:
- "무릎 앞쪽 통증은 대개 슬개건염 가능성이 있습니다."
- "운동 중 발생한 갑작스런 통증은 인대 손상 또는 연골 손상일 수 있습니다."
`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY_HS}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: SYSTEM_PROMPT }] }, // 역할 부여
                    { role: "user", parts: [{ text: userMessage }] }     // 실제 질문
                ]
            }),
        }
    );

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "화장실이 급해서 다음에 다시 물어봐주세요.";
}

// 모달 HTML 동적 삽입
function loadModalHtmlHs() {
    fetch("src/infermedica/infermedica.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("beforeend", html);
            setupModalEventsHs();
        });
}

// 모달 열기 버튼 이벤트 연결
function setupOpenButtonHs() {
    const openBtn = document.querySelector(".checkHealth-btn-main");
    openBtn?.addEventListener("click", () => {
        const modal = document.getElementById("modal-hs");
        if (modal) {
            modal.classList.add("show-hs");
            document.body.style.overflow = "hidden";
        }
    });
}

// ESC 키로 닫기 이벤트 연결
function setupEscCloseHs() {
    document.addEventListener("keydown", e => {
        const modal = document.getElementById("modal-hs");
        if (e.key === "Escape" && modal?.classList.contains("show-hs")) {
            modal.classList.remove("show-hs");
            document.body.style.overflow = "";
        }
    });
}
setupEscCloseHs();

// 모달 내부 요소 이벤트 등록
function setupModalEventsHs() {
    const modal = document.getElementById("modal-hs");
    const closeBtn = document.getElementById("close-btn-hs");
    const sendBtn = document.getElementById("send-btn-hs");
    const input = document.getElementById("user-input-hs");
    const chatArea = document.getElementById("chat-messages-hs");

    closeBtn?.addEventListener("click", () => {
        modal.classList.remove("show-hs");
        document.body.style.overflow = "";
    });

    sendBtn?.addEventListener("click", () => handleSendHs(input, chatArea));
    input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendHs(input, chatArea);
        }
    });
    const greeting = "증상을 알려주시면, 관련된 의학적 정보를 제공해 드리겠습니다.";
    appendMessageHs(greeting, "bot", chatArea);
}

// 채팅 메시지 출력 함수
function appendMessageHs(text, sender, chatArea) {
    const isAtBottom =
        chatArea.scrollHeight - chatArea.scrollTop <= chatArea.clientHeight + 10;

    const wrapper = document.createElement("div");
    wrapper.classList.add("message-wrapper-hs", `${sender}-hs`);

    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble-hs", `${sender}-hs`);
    bubble.textContent = text;

    const timestamp = document.createElement("div");
    timestamp.classList.add("timestamp-hs");
    timestamp.textContent = getTimeHs();

    wrapper.appendChild(bubble);
    wrapper.appendChild(timestamp);
    chatArea.appendChild(wrapper);

    if (isAtBottom) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// 현재 시각 포맷 반환
function getTimeHs() {
    const now = new Date();
    const hour = now.getHours();
    const minute = String(now.getMinutes()).padStart(2, "0");
    const ampm = hour < 12 ? "오전" : "오후";
    const hour12 = hour % 12 || 12;
    return `${ampm} ${hour12}:${minute}`;
}

// 메시지 전송 처리
async function handleSendHs(input, chatArea) {
    const text = input.value.trim();
    if (!text) return;

    appendMessageHs(text, "user", chatArea);
    input.value = "";

    const aiReply = await fetchGeminiResponseHs(text);
    appendMessageHs(aiReply, "bot", chatArea);
}
