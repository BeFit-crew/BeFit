// Gemini API URL 외부 설정에서 import
import { befit_AI_API_URL } from '../../assets/js/config.js';

// =============================
// 상수 및 설정
// =============================
const STORAGE_KEY = 'befit_ai_result';
const BMR_MODE = { AUTO: 'auto', MANUAL: 'manual' };

const CONVERSION_TABLES = {
    fatRate: {
        남: { 상: 30, 중상: 25, 중: 20, 중하: 15, 하: 10 },
        여: { 상: 35, 중상: 30, 중: 27, 중하: 24, 하: 20 },
        평균: { 상: 32, 중상: 27.5, 중: 23.5, 중하: 19.5, 하: 15 }
    },
    skeletalMuscleRate: {
        남: { 상: 0.45, 중상: 0.40, 중: 0.35, 중하: 0.30, 하: 0.25 },
        여: { 상: 0.40, 중상: 0.35, 중: 0.30, 중하: 0.25, 하: 0.20 },
        평균: { 상: 0.425, 중상: 0.375, 중: 0.325, 중하: 0.275, 하: 0.225 }
    },
    activityRate: {
        상: 12, 중상: 10, 중: 8, 중하: 6, 하: 4
    }
};

const BMR_FORMULA = {
    WEIGHT_COEFFICIENT: 10,
    HEIGHT_COEFFICIENT: 6.25,
    AGE_COEFFICIENT: 5,
    MALE_CONSTANT: 5,
    FEMALE_CONSTANT: -161
};

// =============================
// DOM 요소 객체 관리
// =============================
const DOM = {
    dietForm: document.getElementById('dietForm-befit-ai'),
    result: document.getElementById('result-befit-ai'),
    errorBox: document.getElementById('errorBox-befit-ai'),
    loading: document.getElementById('loading-befit-ai'),

    bmrMode: document.getElementById('bmrMode-befit-ai'),
    bmrAutoGroup: document.getElementById('bmr-auto-group-befit-ai'),
    bmrManualGroup: document.getElementById('bmr-manual-group-befit-ai'),
    bmrAuto: document.getElementById('bmr-auto-befit-ai'),
    bmrManual: document.getElementById('bmrManual-befit-ai'),

    gender: document.getElementById('gender-befit-ai'),

    targetFatRate: document.getElementById('targetFatRate-befit-ai'),
    targetFatLevel: document.getElementById('targetFatLevel-befit-ai'),
    targetSkeletalMuscleMass: document.getElementById('targetSkeletalMuscleMass-befit-ai'),
    targetSkeletalMuscleMassLevel: document.getElementById('targetSkeletalMuscleMassLevel-befit-ai'),

    showSavedResultBtn: document.getElementById('showSavedResultBtn'),

    modal: document.getElementById('aiModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    closeModal: document.getElementById('closeModal'),
    modalBody: document.getElementById('modalBody')
};

// =============================
// 유틸리티 함수들
// =============================

/**
 * 숫자 입력 필드에 대해 실시간 입력과 포커스 아웃 시 유효성 검사 및 경고 처리
 * @param {HTMLInputElement} input - 검사할 입력 필드
 * @param {number} min - 최소 허용값
 * @param {number} max - 최대 허용값
 */
function setupNumberInputValidation(input, min, max) {
    function isValid(value) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    function showWarning() {
        alert(`입력 값은 ${min} 이상 ${max} 이하여야 합니다.`);
        input.classList.add('input-error');
    }

    function hideWarning() {
        input.classList.remove('input-error');
    }

    input.addEventListener('input', () => {
        const val = input.value.trim();
        if (val === '' || isNaN(Number(val))) {
            // 입력이 비었거나 숫자가 아닌 경우 경고 숨김
            hideWarning();
            return;
        }
        if (!isValid(val)) {
            // 아직 경고를 띄우진 않고 스타일만 표시해도 됨
            input.classList.add('input-error');
        } else {
            hideWarning();
        }
    });

    input.addEventListener('blur', () => {
        const val = input.value.trim();
        if (val === '' || isNaN(Number(val)) || isValid(val)) {
            hideWarning();
        } else {
            alert(`입력 값은 ${min} 이상 ${max} 이하여야 합니다.`);
            input.value = '';  // 잘못된 값은 초기화
            hideWarning();     // 스타일도 초기화
            input.focus();     // 포커스는 원하면 다시 줄 수 있음
        }
    });
}

/**
 * 입력 값이 최소값과 최대값 범위를 벗어나는지 검사
 * @param {HTMLInputElement} input - 검사할 숫자 입력 필드
 * @param {number} min - 허용하는 최소값
 * @param {number} max - 허용하는 최대값
 * @returns {boolean} - 범위 내면 true, 벗어나면 false 반환
 */
function validateInputRange(input, min, max) {
    const value = Number(input.value);
    if (isNaN(value)) return false;
    return value >= min && value <= max;
}

/**
 * 모든 숫자 입력 필드에 입력 시 실시간 범위 검사 이벤트 등록
 * @returns {void}
 */
function attachRangeValidation() {
    const inputs = DOM.dietForm.querySelectorAll('input[type="number"]');

    inputs.forEach(input => {
        const min = Number(input.min);
        const max = Number(input.max);

        input.addEventListener('input', () => {
            if (!validateInputRange(input, min, max)) {
                showWarningModal(`입력 값이 ${min} 이상 ${max} 이하여야 합니다.`);
                input.classList.add('input-error');
            } else {
                hideWarningModal();
                input.classList.remove('input-error');
            }
        });
    });
}

/**
 * 경고 메시지를 모달로 보여줌
 * @param {string} message - 사용자에게 보여줄 경고 문구
 */
function showWarningModal(message) {
    // DOM.modalBody가 기존 AI 결과 모달이라면
    // 별도의 경고 모달 DOM 요소가 있으면 그걸 띄우거나 alert 대체 사용 가능
    alert(message); // 임시로 alert 사용
}

/**
 * 경고 모달 숨기기 (필요 시)
 */
function hideWarningModal() {
    // 별도의 경고 모달 닫는 코드 위치
    // alert() 사용 시 불필요
}


/**
 * 숫자 입력 필드와 선택 필드 중 하나만 입력 가능하도록 설정
 * @param {HTMLInputElement} primaryInput
 * @param {HTMLSelectElement} secondarySelect
 */
function setupExclusiveInput(primaryInput, secondarySelect) {
    function updateState() {
        secondarySelect.disabled = !!primaryInput.value.trim();
        primaryInput.disabled = !!secondarySelect.value;
    }
    primaryInput.addEventListener('input', updateState);
    secondarySelect.addEventListener('change', updateState);
    updateState();
}

/**
 * BMR 자동 계산 (Harris-Benedict 공식 변형)
 */
function calculateBMR() {
    const gender = DOM.gender.value;
    const age = Number(DOM.dietForm.age.value);
    const height = Number(DOM.dietForm.height.value);
    const weight = Number(DOM.dietForm.weight.value);

    if (!age || !height || !weight) return;

    const baseBMR = BMR_FORMULA.WEIGHT_COEFFICIENT * weight
        + BMR_FORMULA.HEIGHT_COEFFICIENT * height
        - BMR_FORMULA.AGE_COEFFICIENT * age;

    let bmr;
    if (gender === '남') {
        bmr = baseBMR + BMR_FORMULA.MALE_CONSTANT;
    } else if (gender === '여') {
        bmr = baseBMR + BMR_FORMULA.FEMALE_CONSTANT;
    } else {
        bmr = (baseBMR + BMR_FORMULA.MALE_CONSTANT + baseBMR + BMR_FORMULA.FEMALE_CONSTANT) / 2;
    }
    DOM.bmrAuto.value = Math.round(bmr);
}

/**
 * 레벨을 값으로 변환
 * @param {string} level
 * @param {string} type
 * @param {string} gender
 * @param {number} weight
 * @returns {number|null}
 */
function convertLevelToValue(level, type, gender = '비공개', weight = 0) {
    const genderKey = CONVERSION_TABLES.fatRate[gender] ? gender : '평균';
    switch (type) {
        case 'fat':
            return CONVERSION_TABLES.fatRate[genderKey][level] ?? null;
        case 'muscle':
            const muscleRate = CONVERSION_TABLES.skeletalMuscleRate[genderKey][level];
            return weight && muscleRate ? Math.round(weight * muscleRate) : null;
        case 'activity':
            const activityRate = CONVERSION_TABLES.activityRate[level];
            return weight && activityRate ? Math.round(weight * activityRate) : null;
        default:
            return null;
    }
}

/**
 * BMR 모드 토글
 */
function toggleBMRMode() {
    const isAuto = DOM.bmrMode.value === BMR_MODE.AUTO;
    DOM.bmrAutoGroup.style.display = isAuto ? 'block' : 'none';
    DOM.bmrManualGroup.style.display = isAuto ? 'none' : 'block';
    DOM.bmrAuto.required = isAuto;
    DOM.bmrManual.required = !isAuto;
    if (isAuto) calculateBMR();
}

/**
 * 저장된 AI 결과 존재 여부에 따라 'AI 결과 다시 보기' 버튼의 표시 상태를 토글합니다.
 */
function updateShowSavedResultBtnVisibility() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        DOM.showSavedResultBtn.style.display = 'inline-block';
    } else {
        DOM.showSavedResultBtn.style.display = 'none';
    }
}

/**
 * 폼 유효성 검사
 * @param {Object} data
 * @returns {{errors:string[], focusTarget:HTMLElement|null}}
 */
function validateForm(data) {
    const errors = [];
    let focusTarget = null;
    const requiredFields = [
        { name: 'age', label: '나이' },
        { name: 'height', label: '키' },
        { name: 'weight', label: '몸무게' },
        { name: 'days', label: '목표 일수' }
    ];
    for (const field of requiredFields) {
        if (!data[field.name] || +data[field.name] <= 0) {
            errors.push(field.label);
            if (!focusTarget) focusTarget = DOM.dietForm[field.name];
        }
    }
    const bmrVal = data.bmrMode === BMR_MODE.MANUAL ? data.bmrManual : data.bmrAuto;
    if (!bmrVal || +bmrVal <= 0) {
        errors.push(data.bmrMode === BMR_MODE.MANUAL ? '기초대사량(BMR)' : '자동 계산된 BMR');
        if (!focusTarget) focusTarget = data.bmrMode === BMR_MODE.MANUAL ? DOM.dietForm.bmrManual : DOM.dietForm.bmrAuto;
    }
    if (!data.fatRate && !data.fatLevel) errors.push('체지방률 또는 체지방 수준');
    if (!data.skeletalMuscleMass && !data.muscleLevel) errors.push('골격근량 또는 골격근 수준');
    if (!data.activityCal && !data.activityLevel) errors.push('활동 칼로리 또는 활동 수준');
    return { errors, focusTarget };
}

/**
 * 폼 데이터 전처리 (레벨→값 변환)
 * @param {Object} data
 * @returns {Object} processed data
 */
function preprocessFormData(data) {
    const gender = data.gender;
    const weight = Number(data.weight);
    data.preferences ||= '없음';
    if (!data.fatRate && data.fatLevel) data.fatRate = convertLevelToValue(data.fatLevel, 'fat', gender);
    if (!data.skeletalMuscleMass && data.muscleLevel) data.skeletalMuscleMass = convertLevelToValue(data.muscleLevel, 'muscle', gender, weight);
    if (!data.activityCal && data.activityLevel) data.activityCal = convertLevelToValue(data.activityLevel, 'activity', gender, weight);
    if (!data.targetFatRate && data.targetFatLevel) data.targetFatRate = convertLevelToValue(data.targetFatLevel, 'fat', gender);
    if (!data.targetSkeletalMuscleMass && data.targetSkeletalMuscleMassLevel) data.targetSkeletalMuscleMass = convertLevelToValue(data.targetSkeletalMuscleMassLevel, 'muscle', gender, weight);
    return data;
}

/**
 * AI 프롬프트 생성
 * @param {Object} data
 * @returns {string}
 */
function buildPrompt(data) {
    const fatMassText = data.fatRate
        ? `${data.fatRate}% (${data.fatLevel ? `수준 '${data.fatLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.fatLevel || '미입력');
    const muscleMassText = data.skeletalMuscleMass
        ? `${data.skeletalMuscleMass}kg (${data.muscleLevel ? `수준 '${data.muscleLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.muscleLevel || '미입력');
    const activityText = data.activityCal
        ? `${data.activityCal}kcal (${data.activityLevel ? `수준 '${data.activityLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.activityLevel || '미입력');
    const targetFatText = data.targetFatRate
        ? `${data.targetFatRate}% (${data.targetFatLevel ? `수준 '${data.targetFatLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.targetFatLevel || '미입력');
    const targetMuscleText = data.targetSkeletalMuscle
        ? `${data.targetSkeletalMuscle}kg (${data.targetMuscleLevel ? `수준 '${data.targetMuscleLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.targetMuscleLevel || '미입력');
    return `
당신은 전문 트레이너이자 영양사입니다.
다음 사용자 정보를 바탕으로 **건강한 일주일 식단 계획**, **운동 전략**, **추천 운동 시간**, **목표 분석**, **예상 체중 변화**를 HTML 카드 UI 형식으로 작성해주세요.

**주의사항**
- 반드시 HTML 태그만 사용하세요. (예: <div>, <section>, <h3>, <p>)
- 코드 블럭(\`\`\`)이나 마크다운, 설명 텍스트는 사용하지 마세요.
- 결과는 전체 div 태그 안에 구성된 구조로 만들어 주세요.
- 스타일은 inline CSS 없이 class 속성으로만 지정하세요.

**클래스** 지정 규칙:
- 전체 wrapper: class="ai-result-wrapper"
- 모든 section: class="ai-section"
- 사용자 정보 요약: class="ai-user"
- 식단 계획: class="ai-diet"
- 운동 전략: class="ai-training"
- 목표 분석 및 체중 변화: class="ai-analysis"

[사용자 정보]
- 성별: ${data.gender || '입력하지 않음'}
- 나이: ${data.age}
- 키: ${data.height}cm
- 몸무게: ${data.weight}kg
- 체지방률: ${fatMassText}
- 골격근량: ${muscleMassText}
- 활동 칼로리: ${activityText}
- 기초대사량: ${data.bmrMode === 'auto' ? data.bmrAuto : data.bmrManual}kcal
- 목표 체중: ${data.targetWeight}kg
- 목표 체지방률: ${targetFatText}
- 목표 골격근량: ${targetMuscleText}
- 목표 일수: ${data.days}일
- 건강 특이사항: ${data.limitations || '없음'}
- 음식 알러지: ${data.foodAllergies || '없음'}
- 제외할 음식: ${data.restrictedFoods || '없음'}
- 먹고 싶은 음식: ${data.preferences || '없음'}
- 선호 운동: ${data.preferredWorkout || '없음'}
- 운동 희망 시간: ${data.preferredWorkoutTime || '없음'}

요구 사항:
- \`<div class='ai-diet'>\` 안에 식단을 작성
- \`<div class='ai-training'>\` 안에 운동 루틴을 작성
- **\`<p class='ai-workout-time'>\` 안에 운동 소요 시간만 작성**

응답은 HTML로 작성하고, 위 구조를 반드시 지켜주세요.
`;
}

/**
 * Gemini API 호출
 * @param {string} prompt
 * @returns {Promise<string|null>}
 */
async function callGeminiAPI(prompt) {
    const response = await fetch(befit_AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
    });
    if (!response.ok) throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);

    const json = await response.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

/**
 * API 응답 처리 및 모달 표시 (원본 전체 저장)
 * @param {string} rawResponse
 * @param {HTMLElement} $modalBody
 */
function processApiResponse(rawResponse, $modalBody) {
    let htmlContent = rawResponse;

    if (htmlContent.startsWith('```')) {
        htmlContent = htmlContent.replace(/^```(html|json)?\n/, '').replace(/```$/, '');
    }

    $modalBody.innerHTML = htmlContent;

    localStorage.setItem(STORAGE_KEY, htmlContent);
}

/**
 * 로컬 스토리지에서 저장된 AI 결과를 모달에 표시 (원본 전체 불러오기)
 */
function showSavedResult() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        alert('저장된 AI 결과가 없습니다.');
        return;
    }

    DOM.modalBody.innerHTML = saved;
    DOM.modal.classList.remove('hidden');
}


/**
 * 폼 제출 핸들러
 * @param {Event} e
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    DOM.loading.style.display = 'block';
    DOM.errorBox.innerHTML = '';
    DOM.result.innerHTML = '';

    // 로딩 표시 후 화면 스크롤 자연스럽게 이동 (아래로)
    DOM.loading.scrollIntoView({ behavior: 'smooth' });

    // ① FormData 객체에서 값만 추출해서 전달
    const formDataObj = Object.fromEntries(new FormData(DOM.dietForm).entries());
    const rawData = preprocessFormData(formDataObj);

    const { errors, focusTarget } = validateForm(rawData);

    if (errors.length > 0) {
        alert('작성되지 않은 항목이 있습니다:\n- ' + errors.join('\n- '));
        focusTarget?.focus();
        DOM.loading.style.display = 'none';
        return;
    }

    try {
        const prompt = buildPrompt(rawData);
        const rawResponse = await callGeminiAPI(prompt);

        if (rawResponse) {
            processApiResponse(rawResponse, DOM.modalBody);
            DOM.modal.classList.remove('hidden');
            updateShowSavedResultBtnVisibility();
        } else {
            DOM.modalBody.innerHTML = '<p style="color:red">AI로부터 응답을 받지 못했습니다. 다시 시도해주세요.</p>';
            DOM.modal.classList.remove('hidden');
            updateShowSavedResultBtnVisibility();
        }
    } catch (error) {
        DOM.result.innerHTML = `<p style="color:red">오류가 발생했습니다: ${error.message}</p>`;
        console.error(error);
    } finally {
        DOM.loading.style.display = 'none';
    }
}


/**
 * 이벤트 리스너 초기화
 * - 각 입력 필드 및 버튼에 필요한 이벤트 리스너를 등록합니다.
 */
function initEventListeners() {
    // 유효성 검사할 필드와 범위 정보 배열로 정의
    const validations = [
        { input: DOM.dietForm.age, min: 10, max: 125 },
        { input: DOM.dietForm.height, min: 50, max: 280 },
        { input: DOM.dietForm.weight, min: 5, max: 610 },
        { input: DOM.dietForm.fatRate, min: 0.1, max: 70 },
        { input: DOM.dietForm.skeletalMuscleMass, min: 1, max: 100 },
        { input: DOM.dietForm.activityCal, min: 0, max: 5000 },
        { input: DOM.targetFatRate, min: 0.1, max: 70 },
        { input: DOM.targetSkeletalMuscleMass, min: 1, max: 100 },
        { input: DOM.dietForm.days, min: 1, max: 365 },
        { input: DOM.dietForm.bmrManual, min: 800, max: 10000 }
    ];

    // 배열 반복하며 유효성 검사 등록
    validations.forEach(({ input, min, max }) => {
        if (input) setupNumberInputValidation(input, min, max);
    });

    setupExclusiveInput(DOM.dietForm.fatRate, DOM.dietForm.fatLevel);
    setupExclusiveInput(DOM.dietForm.skeletalMuscleMass, DOM.dietForm.muscleLevel);
    setupExclusiveInput(DOM.dietForm.activityCal, DOM.dietForm.activityLevel);
    setupExclusiveInput(DOM.targetFatRate, DOM.targetFatLevel);
    setupExclusiveInput(DOM.targetSkeletalMuscleMass, DOM.targetSkeletalMuscleMassLevel);

    DOM.bmrMode.addEventListener('change', toggleBMRMode);

    ['gender', 'age', 'height', 'weight'].forEach(field => {
        DOM.dietForm[field].addEventListener('input', calculateBMR);
    });

    DOM.dietForm.addEventListener('submit', handleFormSubmit);

    DOM.modalOverlay.addEventListener('click', () => DOM.modal.classList.add('hidden'));
    DOM.closeModal.addEventListener('click', () => DOM.modal.classList.add('hidden'));
    DOM.showSavedResultBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 폼 제출 막기
        showSavedResult();
    });
}


/**
 * 저장된 데이터 확인 (디버깅용)
 */
function checkSavedResult() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        console.log('✨ 저장된 AI 결과 원본 HTML:', saved);
    }
}

/**
 * 애플리케이션 메인 함수
 */
function main() {
    toggleBMRMode();
    initEventListeners();
    checkSavedResult();
    updateShowSavedResultBtnVisibility();
}

main();
