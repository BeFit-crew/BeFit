
document.addEventListener("DOMContentLoaded", () => {
    loadModalHtmlHs();
    setupOpenButtonHs();
});

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

// ESC 키로 닫기
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

// 모달 내부 이벤트 등록
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
}

// 메시지 출력 함수
function appendMessageHs(text, sender, chatArea) {
    // 현재 아래를 보고 있는지 여부
    const isAtBottom =
        chatArea.scrollHeight - chatArea.scrollTop <= chatArea.clientHeight + 10;

    // 메시지 DOM 생성
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

    // 하단에 있을 경우에만 자동 스크롤
    if (isAtBottom) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// 현재 시각 구하기
function getTimeHs() {
    const now = new Date();
    const hour = now.getHours();
    const minute = String(now.getMinutes()).padStart(2, "0");
    const ampm = hour < 12 ? "오전" : "오후";
    const hour12 = hour % 12 || 12;
    return `${ampm} ${hour12}:${minute}`;
}

// 전송 핸들링
function handleSendHs(input, chatArea) {
    const text = input.value.trim();
    if (!text) return;
    appendMessageHs(text, "user", chatArea);
    input.value = "";
    setTimeout(() => {
        appendMessageHs("AI 답변 출력 예시입니다 ", "bot", chatArea);
    }, 500);
}
