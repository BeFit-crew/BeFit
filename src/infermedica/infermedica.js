import {API_KEY_HS} from "../../assets/js/config.js";
import {getBefitAiResult} from '../../src/befit-ai/befit-ai.js';

// Gemini 기반 건강 챗봇 스크립트
document.addEventListener("DOMContentLoaded", () => {
    loadModalHtmlHs();
    setupOpenButtonHs();
    setupEscCloseHs();
});

// Gemini API
async function fetchGeminiResponseHs(userMessage) {
    const aiData = getBefitAiResult();
    const limitation = aiData?.user?.limitations;
    const foodAllergies = aiData?.user?.foodAllergies;
    const restrictedFoods = aiData?.user?.restrictedFoods;
    const height = aiData?.user?.height;
    const age = aiData?.user?.age;

    const SYSTEM_PROMPT = `
당신은 종합병원 의사입니다.

환자는 "${limitation}"과 같은 건강상 제한사항이 있습니다.
환자의 나이는 "${age}"살, 키는 "${height}"cm 입니다.
환자는 "${foodAllergies}"에 알레르기가 있고 "${restrictedFoods}"를 못먹습니다.
이 점을 고려해 증상에 대해 분석하고 조언해주세요.

- 감정 표현 없이, 의학적 사실(Fact)만 제시  
- 의심되는 질환, 해부학적 부위, 가능한 원인, 경과 예후를 간결히 설명  
- 일반인이 이해할 수 있는 수준의 의학 용어를 사용  
- 지금 당장 어떤것을 해야하는지 알려줘  
- 병원 내원 여부와 응급 여부를 명확히 판단  
- 문장 수는 1~2줄 이내로 제한  
- 말투는 설명 중심으로, 공감이나 위로는 생략  
- **, 강조 문구, 특수문자, 숫자 없이 답변
`.trim();

    const $responseHs = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY_HS}`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [
                    {role: "user", parts: [{text: SYSTEM_PROMPT}]},
                    {role: "user", parts: [{text: userMessage}]}
                ]
            }),
        }
    );

    const $resultHs = await $responseHs.json();
    return $resultHs.candidates?.[0]?.content?.parts?.[0]?.text || "화장실이 급해서 다음에 다시 물어봐주세요.";
}

// 모달 HTML 동적 삽입
function loadModalHtmlHs() {
    // 현재 HTML 경로 확인해서 상대 경로 자동 조정
    const $isInSubFolderHs = window.location.pathname.includes('/src/');
    const $htmlPathHs = $isInSubFolderHs
        ? '../infermedica/infermedica.html'
        : 'src/infermedica/infermedica.html';

    fetch($htmlPathHs)
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("beforeend", html);
            setupModalEventsHs(); // 모달이 추가된 뒤 실행해야 함
        })
        .catch(err => {
            console.error("모달 HTML 불러오기 실패:", err);
        });
}


// 모달 열기 버튼 이벤트 연결
function setupOpenButtonHs() {
    const $openBtnHs = document.querySelector(".checkHealth-btn-main");
    $openBtnHs?.addEventListener("click", () => {
        const $modalHs = document.getElementById("modal-hs");
        if ($modalHs) {
            $modalHs.classList.add("show-hs");
            document.body.style.overflow = "hidden";
        }
    });
}

// ESC 키로 닫기 이벤트 연결
function setupEscCloseHs() {
    document.addEventListener("keydown", e => {
        const $modalHs = document.getElementById("modal-hs");
        if (e.key === "Escape" && $modalHs?.classList.contains("show-hs")) {
            $modalHs.classList.remove("show-hs");
            document.body.style.overflow = "";
        }
    });
}

setupEscCloseHs();

// 모달 내부 요소 이벤트 등록
async function setupModalEventsHs() {
    const aiData = getBefitAiResult();
    const limitation = aiData?.user?.limitations;
    const foodAllergies = aiData?.user?.foodAllergies;
    const restrictedFoods = aiData?.user?.restrictedFoods;

    const $modalHs = document.getElementById("modal-hs");
    const $closeBtnHs = document.getElementById("close-btn-hs");
    const $sendBtnHs = document.getElementById("send-btn-hs");
    const $inputHs = document.getElementById("user-input-hs");
    const $chatAreaHs = document.getElementById("chat-messages-hs");

    // 제한사항 안내 메시지 출력
    if (foodAllergies) {
        appendMessageHs(`저장된 음식 알레르기는 '${foodAllergies}'`, "bot", $chatAreaHs);
    }
    if (limitation) {
        appendMessageHs(`건강 제한사항은 '${limitation}'가 있습니다. 이 점을 고려해 상담을 진행하겠습니다.`, "bot", $chatAreaHs);
    } else {
        appendMessageHs("현재 저장된 건강 제한사항이 없습니다. 당뇨, 고혈압, 알레르기 등이 있다면 입력해주세요.", "bot", $chatAreaHs);
    }

    // 증상 정보 있으면 자동 응답
    appendMessageHs("증상을 입력하시면 분석을 도와드릴게요.", "bot", $chatAreaHs);


    // 모달 닫기, 전송 버튼 등 이벤트 연결
    $closeBtnHs?.addEventListener("click", () => {
        $modalHs.classList.remove("show-hs");
        document.body.style.overflow = "";
    });

    $sendBtnHs?.addEventListener("click", () => handleSendHs($inputHs, $chatAreaHs));
    $inputHs?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSendHs($inputHs, $chatAreaHs);
        }
    });
}

// 채팅 메시지 출력 함수
function appendMessageHs(text, sender, chatArea) {
    const $isAtBottomHs =
        chatArea.scrollHeight - chatArea.scrollTop <= chatArea.clientHeight + 10;

    const $wrapperHs = document.createElement("div");
    $wrapperHs.classList.add("message-wrapper-hs", `${sender}-hs`);

    const $bubbleHs = document.createElement("div");
    $bubbleHs.classList.add("chat-bubble-hs", `${sender}-hs`);
    $bubbleHs.textContent = text;

    const $timestampHs = document.createElement("div");
    $timestampHs.classList.add("timestamp-hs");
    $timestampHs.textContent = getTimeHs();

    $wrapperHs.appendChild($bubbleHs);
    $wrapperHs.appendChild($timestampHs);
    chatArea.appendChild($wrapperHs);

    if ($isAtBottomHs) {
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
