// /src/befit-ai/befit-ai.js

/**
 * @file BeFit AI 기능의 메인 애플리케이션 파일 (엔트리 포인트).
 * @description 이 파일은 BeFit AI 기능의 시작점입니다.
 *              여러 모듈(DOM, Utils, Storage, UI, API)들을 가져와서 조립하고,
 *              사용자의 상호작용(이벤트)을 감지하여 각 모듈의 함수를 호출합니다.
 */

// --- 1. 모듈 의존성 주입 ---
// 필요한 모든 모듈과 객체들을 가져옵니다.
// '*' as Utils 구문은 'utils-befit-ai.js' 파일에서 export된 모든 함수를 'Utils'라는 하나의 객체로 묶어서 가져옵니다.
import DOM from './modules/dom-befit-ai.js';
import * as Utils from './modules/utils-befit-ai.js';
import * as Storage from './modules/storage-befit-ai.js';
import * as UI from './modules/ui-befit-ai.js';
import * as Api from './modules/api-befit-ai.js';


// --- 2. 메인 이벤트 핸들러 ---

/**
 * 폼 제출('submit') 이벤트를 처리하는 비동기 메인 핸들러입니다.
 * 사용자가 '추천 받기' 버튼을 클릭하면 이 함수가 실행됩니다.
 * @param {Event} e - 폼 제출 이벤트 객체.
 */
async function handleFormSubmit(e) {
    // e.preventDefault(): 폼 제출 시 페이지가 새로고침되는 기본 동작을 막습니다.
    e.preventDefault();
    // UI 모듈을 통해 사용자에게 로딩 중임을 알립니다.
    UI.toggleLoading(true);

    // [데이터 수집] 폼에 입력된 모든 데이터를 key-value 형태의 객체로 편리하게 변환합니다.
    const formDataObj = Object.fromEntries(new FormData(DOM.dietForm).entries());
    // [데이터 전처리] 수집된 데이터를 AI에게 보내기 전에 유틸리티 함수로 최종 가공합니다.
    const processedData = Utils.preprocessFormData(formDataObj);

    // [유효성 검사] 데이터가 유효한지 검사합니다.
    const {errors, focusTarget} = Utils.validateForm(processedData);
    if (errors.length > 0) {
        // 오류가 있으면 사용자에게 알리고, 문제가 된 첫 번째 입력 필드로 포커스를 이동시킵니다.
        alert('다음 필수 항목을 확인해주세요:\n- ' + errors.join('\n- '));
        focusTarget?.focus(); // Optional Chaining(?.)으로 focusTarget이 null일 때의 오류를 방지합니다.
        UI.toggleLoading(false); // 로딩 화면을 숨깁니다.
        return; // 함수 실행을 중단합니다.
    }

    // [API 통신 및 결과 처리]
    try {
        // 1. API 모듈을 사용해 AI에게 보낼 프롬프트를 생성합니다.
        const prompt = Api.buildPrompt(processedData);
        // 2. 생성된 프롬프트로 API를 호출하고 응답을 기다립니다. (비동기)
        const rawResponse = await Api.callGeminiAPI(prompt);

        // 3. 응답이 없는 경우 사용자에게 알리고 중단합니다.
        if (!rawResponse) {
            UI.showModalWithContent('<p style="color:red">AI로부터 응답을 받지 못했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.</p>');
            return; // finally 블록이 실행된 후 함수 종료
        }

        // 4. 응답 텍스트에서 순수 JSON만 추출하고, 흔한 JSON 오류를 자동으로 보정합니다.
        let cleanedJsonText = Utils.extractPureJSON(rawResponse);
        cleanedJsonText = cleanedJsonText.replace(/,\s*([}\]])/g, '$1').replace(/}\s*{/g, '},{');

        // 5. 정리된 텍스트를 JavaScript 객체로 파싱합니다.
        const aiData = JSON.parse(cleanedJsonText);
        // 6. 파싱된 데이터를 UI 모듈을 통해 HTML로 렌더링합니다.
        const resultHtml = UI.renderAIResult(aiData);

        // 7. 최종 결과를 모달창에 표시하고, 로컬 스토리지에 저장합니다.
        UI.showModalWithContent(resultHtml);
        Storage.saveAiResult(aiData);

    } catch (error) {
        // try 블록 내에서 발생한 모든 종류의 에러(네트워크, 파싱 등)가 여기서 처리됩니다.
        console.error("AI 응답 처리 중 오류 발생:", error);
        // 사용자에게 친절한 오류 메시지를 모달로 보여줍니다.
        const errorMessage = `
            <p style="color:red; white-space: pre-wrap;">
                AI 응답 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.<br><br>
                <b>[오류 상세 정보]</b><br>${error.message}
            </p>`;
        UI.showModalWithContent(errorMessage);
    } finally {
        // finally 블록은 try...catch의 성공/실패 여부와 관계없이 항상 마지막에 실행됩니다.
        // 로딩 화면을 숨기는 작업은 어떤 경우에도 이루어져야 하므로 여기에 위치합니다.
        UI.toggleLoading(false);
    }
}


// --- 3. 초기화 함수 ---

/**
 * 페이지에 필요한 모든 이벤트 리스너를 등록하고 초기 설정을 수행합니다.
 */
function initEventListeners() {
    // 각 숫자 입력 필드에 대한 유효성 검사 설정을 배열로 정의하고, 순회하며 적용합니다.
    const validations = [
        {input: DOM.dietForm.age, min: 10, max: 125},
        {input: DOM.dietForm.height, min: 50, max: 280},
        {input: DOM.dietForm.weight, min: 5, max: 610},
        {input: DOM.dietForm.bmrManual, min: 800, max: 8000},
        {input: DOM.dietForm.fatRate, min: 0.1, max: 70},
        {input: DOM.dietForm.skeletalMuscleMass, min: 1, max: 100},
        {input: DOM.dietForm.activityCal, min: 1, max: 5000},
        {input: DOM.dietForm.targetWeight, min: 5, max: 610},
        {input: DOM.targetFatRate, min: 0.1, max: 70},
        {input: DOM.targetSkeletalMuscleMass, min: 1, max: 100},
        {input: DOM.dietForm.days, min: 7, max: 365}
    ];
    validations.forEach(({input, min, max}) => {
        if (input) Utils.setupNumberInputValidation(input, min, max);
    });

    // 상호 배타적인 입력 필드들을 설정합니다.
    Utils.setupExclusiveInput(DOM.dietForm.fatRate, DOM.dietForm.fatLevel);
    Utils.setupExclusiveInput(DOM.dietForm.skeletalMuscleMass, DOM.dietForm.muscleLevel);
    Utils.setupExclusiveInput(DOM.dietForm.activityCal, DOM.dietForm.activityLevel);
    Utils.setupExclusiveInput(DOM.targetFatRate, DOM.targetFatLevel);
    Utils.setupExclusiveInput(DOM.targetSkeletalMuscleMass, DOM.targetSkeletalMuscleMassLevel);

    // 주요 UI 요소에 이벤트 핸들러를 연결합니다.
    DOM.bmrMode.addEventListener('change', Utils.toggleBMRMode);
    ['gender', 'age', 'height', 'weight'].forEach(field => {
        if (DOM.dietForm[field]) {
            DOM.dietForm[field].addEventListener('input', Utils.calculateBMR);
        }
    });
    DOM.dietForm.addEventListener('submit', handleFormSubmit);

    // 모달 창과 '다시 보기' 버튼에 대한 클릭 이벤트를 설정합니다.
    DOM.modalOverlay.addEventListener('click', () => DOM.modal.classList.add('hidden'));
    DOM.closeModal.addEventListener('click', () => DOM.modal.classList.add('hidden'));
    DOM.showSavedResultBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 버튼이 a 태그일 경우를 대비해 기본 동작 방지
        UI.showSavedResult();
    });
}

/**
 * 애플리케이션의 시작점(Entry Point)입니다.
 * 이 함수가 호출되면서 전체 애플리케이션이 동작하기 시작합니다.
 */
function main() {
    // [방어적 코딩] 이 스크립트가 BeFit AI 폼이 없는 다른 페이지에 실수로 포함되더라도 오류를 발생시키지 않고 조용히 종료되도록 합니다.
    if (!DOM.dietForm) {
        return;
    }

    // 1. 모든 이벤트 리스너를 등록합니다.
    initEventListeners();
    // 2. 페이지 로드 시, 현재 설정에 맞는 초기 BMR 모드를 화면에 표시합니다.
    Utils.toggleBMRMode();
    // 3. 페이지 로드 시, 저장된 결과가 있는지 확인하여 '다시 보기' 버튼의 표시 여부를 결정합니다.
    Storage.updateShowSavedResultBtnVisibility();
}


// --- 4. 애플리케이션 실행 ---

// 페이지가 로드되고 스크립트가 실행될 때, main 함수를 호출하여 애플리케이션을 시작합니다.
main();


// --- 5. 모듈 외부 공개 ---

// 다른 JS 파일(예: 다른 페이지의 스크립트)에서 BeFit AI의 결과를 가져다 쓸 수 있도록, getBefitAiResult 함수를 모듈의 export 대상으로 지정합니다.
export {getBefitAiResult} from './modules/storage-befit-ai.js';