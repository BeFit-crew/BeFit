import { API_KEY_HS } from "../../assets/js/config.js";
import { getBefitAiResult } from "../../src/befit-ai/befit-ai.js";

// =============================
// 상수 및 설정
// =============================
const SYSTEM_PROMPT = `
당신은 종합병원 의사입니다.

환자는 "{limitation}"과 같은 건강상 제한사항이 있습니다.
환자의 나이는 "{age}"살, 키는 "{height}"cm 입니다.
환자는 "{foodAllergies}"에 알레르기가 있습니다.
이 점을 고려해 증상에 대해 분석하고 조언해주세요.

- 감정 표현 없이, 의학적 사실(Fact)만 제시  
- 의심되는 질환, 해부학적 부위, 가능한 원인, 경과 예후를 간결히 설명  
- 일반인이 이해할 수 있는 수준의 의학 용어를 사용  
- 지금 당장 어떤 것을 해야 하는지 알려줘  
- 병원 내원 여부와 응급 여부를 명확히 판단  
- 문장 수는 1~2줄 이내로 제한  
- 말투는 설명 중심으로, 공감이나 위로는 생략  
- **, 강조 문구, 특수문자, 숫자 없이 답변
`.trim();

// 페이지 로드시 실행
document.addEventListener("DOMContentLoaded", () => {
    loadModalHtmlHs();
    setupOpenButtonHs();
    setupEscCloseHs();
});

// Gemini API 호출
async function fetchGeminiResponseHs(userMessage) {
    const aiData = getBefitAiResult();
    const { limitations, foodAllergies, height, age } = aiData?.user || {};

    const prompt = SYSTEM_PROMPT
        .replace("{limitation}", limitations || "제한사항 없음")
        .replace("{age}", age || "알 수 없음")
        .replace("{height}", height || "알 수 없음")
        .replace("{foodAllergies}", foodAllergies || "없음");

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY_HS}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: prompt }] },
                    { role: "user", parts: [{ text: userMessage }] }
                ]
            }),
        }
    );

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 다시 입력해 주세요.";
}

// 모달 HTML 동적 삽입
function loadModalHtmlHs() {
    const isInSubFolder = window.location.pathname.includes('/src/');
    const htmlPath = isInSubFolder
        ? '../infermedica/infermedica.html'
        : 'src/infermedica/infermedica.html';

    fetch(htmlPath)
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("beforeend", html);
            setupModalEventsHs();
        })
        .catch(err => console.error("모달 HTML 불러오기 실패:", err));
}

// 버튼/ESC 키 이벤트 연결
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

function setupEscCloseHs() {
    document.addEventListener("keydown", e => {
        const modal = document.getElementById("modal-hs");
        if (e.key === "Escape" && modal?.classList.contains("show-hs")) {
            modal.classList.remove("show-hs");
            document.body.style.overflow = "";
        }
    });
}

// 초기 안내 메시지 출력
function showInitialMessagesHs(chatArea, { limitations, foodAllergies }) {
    if (foodAllergies) {
        appendMessageHs(`저장된 음식 알레르기는 '${foodAllergies}'`, "bot", chatArea);
    }
    if (limitations) {
        appendMessageHs(`건강 제한사항은 '${limitations}'가 있습니다. 이 점을 고려해 상담을 진행하겠습니다.`, "bot", chatArea);
    } else {
        appendMessageHs("현재 저장된 건강 제한사항이 없습니다. 당뇨, 고혈압, 알레르기 등이 있다면 입력해주세요.", "bot", chatArea);
    }
    appendMessageHs("증상을 입력하시면 분석을 도와드릴게요.", "bot", chatArea);
}

// 모달 내부 이벤트 연결
async function setupModalEventsHs() {
    const aiData = getBefitAiResult();
    const { limitations, foodAllergies } = aiData?.user || {};

    const modal = document.getElementById("modal-hs");
    const closeBtn = document.getElementById("close-btn-hs");
    const sendBtn = document.getElementById("send-btn-hs");
    const input = document.getElementById("user-input-hs");
    const chatArea = document.getElementById("chat-messages-hs");

    showInitialMessagesHs(chatArea, { limitations, foodAllergies });

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
}

// 채팅 메시지 출력
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

// 현재 시각 포맷
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
