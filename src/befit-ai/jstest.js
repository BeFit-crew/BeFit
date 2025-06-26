// Gemini API URL 외부 설정에서 import
import { befit_AI_API_URL } from '../../assets/js/config.js';

// =============================
// 상수 및 설정
// =============================
const STORAGE_KEY = 'befit_ai_result_json'; // JSON 데이터를 저장할 키
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
    submitBtn: document.querySelector('.submit-btn-befit-ai'),

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
    if (!input) return;

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
            hideWarning();
            return;
        }
        if (!isValid(val)) {
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
            input.value = '';
            hideWarning();
            input.focus();
        }
    });
}

/**
 * 숫자 입력 필드와 선택 필드 중 하나만 입력 가능하도록 설정
 * @param {HTMLInputElement} primaryInput
 * @param {HTMLSelectElement} secondarySelect
 */
function setupExclusiveInput(primaryInput, secondarySelect) {
    if (!primaryInput || !secondarySelect) return;
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
    if (DOM.bmrMode.value !== 'auto') return;

    const gender = DOM.gender.value;
    const age = Number(DOM.dietForm.elements.age.value);
    const height = Number(DOM.dietForm.elements.height.value);
    const weight = Number(DOM.dietForm.elements.weight.value);

    if (!age || !height || !weight) {
        DOM.bmrAuto.value = '';
        return;
    }

    const baseBMR = BMR_FORMULA.WEIGHT_COEFFICIENT * weight
        + BMR_FORMULA.HEIGHT_COEFFICIENT * height
        - BMR_FORMULA.AGE_COEFFICIENT * age;

    let bmr;
    if (gender === '남') {
        bmr = baseBMR + BMR_FORMULA.MALE_CONSTANT;
    } else if (gender === '여') {
        bmr = baseBMR + BMR_FORMULA.FEMALE_CONSTANT;
    } else {
        bmr = (baseBMR * 2 + BMR_FORMULA.MALE_CONSTANT + BMR_FORMULA.FEMALE_CONSTANT) / 2;
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
            return CONVERSION_TABLES.fatRate[genderKey]?.[level] ?? null;
        case 'muscle':
            const muscleRate = CONVERSION_TABLES.skeletalMuscleRate[genderKey]?.[level];
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
    if (isAuto) {
        calculateBMR();
    }
}

/**
 * 저장된 AI 결과 존재 여부에 따라 'AI 결과 다시 보기' 버튼의 표시 상태를 토글
 */
function updateShowSavedResultBtnVisibility() {
    DOM.showSavedResultBtn.style.display = localStorage.getItem(STORAGE_KEY) ? 'inline-block' : 'none';
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
            if (!focusTarget) focusTarget = DOM.dietForm.elements[field.name];
        }
    }

    const bmrCheck = data.bmrMode === BMR_MODE.MANUAL ? data.bmrManual : data.bmrAuto;
    if (!bmrCheck || +bmrCheck <= 0) {
        errors.push(data.bmrMode === BMR_MODE.MANUAL ? '기초대사량(BMR)' : '자동 계산된 BMR');
        if (!focusTarget) focusTarget = data.bmrMode === BMR_MODE.MANUAL ? DOM.bmrManual : DOM.bmrAuto;
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
    const processed = { ...data }; // 원본 수정을 피하기 위해 복사
    processed.preferences ||= '없음';

    if (!processed.fatRate && processed.fatLevel) processed.fatRate = convertLevelToValue(processed.fatLevel, 'fat', gender);
    if (!processed.skeletalMuscleMass && processed.muscleLevel) processed.skeletalMuscleMass = convertLevelToValue(processed.muscleLevel, 'muscle', gender, weight);
    if (!processed.activityCal && processed.activityLevel) processed.activityCal = convertLevelToValue(processed.activityLevel, 'activity', gender, weight);
    if (!processed.targetFatRate && processed.targetFatLevel) processed.targetFatRate = convertLevelToValue(processed.targetFatLevel, 'fat', gender);
    if (!processed.targetSkeletalMuscleMass && processed.targetSkeletalMuscleMassLevel) processed.targetSkeletalMuscleMass = convertLevelToValue(processed.targetSkeletalMuscleMassLevel, 'muscle', gender, weight);

    return processed;
}

// =============================
// 핵심 로직 (JSON 처리 위주)
// =============================

/**
 * AI 프롬프트 생성 (JSON 형식 요청)
 * @param {Object} data - 전처리된 사용자 데이터
 * @returns {string} - AI에게 보낼 프롬프트
 */
function buildPrompt(data) {
    const userInfoText = `
- 성별: ${data.gender || '입력하지 않음'}
- 나이: ${data.age}
- 키: ${data.height}cm
- 몸무게: ${data.weight}kg
- 체지방률: ${data.fatRate ? data.fatRate + '%' : (data.fatLevel || '미입력')}
- 골격근량: ${data.skeletalMuscleMass ? data.skeletalMuscleMass + 'kg' : (data.muscleLevel || '미입력')}
- 활동 칼로리: ${data.activityCal ? data.activityCal + 'kcal' : (data.activityLevel || '미입력')}
- 기초대사량: ${data.bmrMode === 'auto' ? data.bmrAuto : data.bmrManual}kcal
- 목표 체중: ${data.targetWeight || '미입력'}kg
- 목표 체지방률: ${data.targetFatRate ? data.targetFatRate + '%' : (data.targetFatLevel || '미입력')}
- 목표 골격근량: ${data.targetSkeletalMuscleMass ? data.targetSkeletalMuscleMass + 'kg' : (data.targetSkeletalMuscleMassLevel || '미입력')}
- 목표 기간: ${data.days}일
- 건강 특이사항: ${data.limitations || '없음'}
- 음식 알러지: ${data.foodAllergies || '없음'}
- 제외할 음식: ${data.restrictedFoods || '없음'}
- 먹고 싶은 음식: ${data.preferences || '없음'}
- 선호 운동: ${data.preferredWorkout || '없음'}
- 운동 희망 시간: ${data.preferredWorkoutTime || '없음'}`;

    return `
당신은 전문 트레이너이자 영양사입니다. 다음 사용자 정보를 바탕으로, 건강한 식단과 운동 계획을 **반드시 아래와 같은 JSON 형식으로만 응답해주세요.**
다른 설명이나 HTML, 마크다운(\`\`\`)은 절대 포함하지 마세요. 코드 블록 안에 순수한 JSON만 포함해주세요.

[사용자 정보]
${userInfoText}

**응답 JSON 형식:**
\`\`\`json
{
  "summary": {
    "title": "당신을 위한 맞춤 건강 플랜 요약",
    "goalAnalysis": "사용자의 목표와 신체 정보를 분석한 총평입니다.",
    "expectedChange": "계획을 잘 따랐을 때 예상되는 긍정적인 신체 변화에 대한 설명입니다."
  },
  "planForDays": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "diet": { "breakfast": "오트밀, 견과류", "lunch": "닭가슴살 샐러드", "dinner": "현미밥과 두부조림", "snack": "그릭요거트" },
      "training": { "name": "전신 근력 운동", "description": "주요 근육 그룹을 모두 사용하여 칼로리 소모를 극대화합니다.", "exercises": ["스쿼트", "푸시업", "플랭크"], "estimatedTime": 45, "timeUnit": "분" }
    }
  ]
}
\`\`\`
`;
}

/**
 * Gemini API 호출 및 응답 텍스트 정제
 * @param {string} prompt
 * @returns {Promise<string|null>}
 */
async function callGeminiAPI(prompt) {
    const response = await fetch(befit_AI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    });
    if (!response.ok) throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    const json = await response.json();
    let text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;

    if (text && text.startsWith('```json')) {
        text = text.replace(/^```json\n/, '').replace(/```$/, '');
    }
    return text;
}

/**
 * JSON 데이터를 받아 모달에 표시할 HTML을 생성
 * @param {object} data - AI가 생성한 JSON 객체
 * @returns {string} - 생성된 HTML 문자열
 */
function createResultHtmlFromJson(data) {
    if (!data || !data.summary || !data.planForDays) {
        return '<p style="color:red;">AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.</p>';
    }

    const summaryHtml = `
        <section class="ai-section">
            <h3>${data.summary.title || 'AI 맞춤 플랜 요약'}</h3>
            <p><strong>목표 분석:</strong> ${data.summary.goalAnalysis}</p>
            <p><strong>예상 변화:</strong> ${data.summary.expectedChange}</p>
        </section>
    `;

    const planHtml = data.planForDays.map(dayPlan => `
        <div class="day-plan-card" style="border: 1px solid #eee; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h4>Day ${dayPlan.day} ${dayPlan.date ? `(${dayPlan.date})` : ''}</h4>
            <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px;">
                <div class="diet-plan" style="flex: 1; min-width: 250px;">
                    <h5>🍽️ 식단</h5>
                    <ul style="padding-left: 20px; margin-top: 8px; list-style-type: disc;">
                        <li><strong>아침:</strong> ${dayPlan.diet.breakfast}</li>
                        <li><strong>점심:</strong> ${dayPlan.diet.lunch}</li>
                        <li><strong>저녁:</strong> ${dayPlan.diet.dinner}</li>
                        ${dayPlan.diet.snack ? `<li><strong>간식:</strong> ${dayPlan.diet.snack}</li>` : ''}
                    </ul>
                </div>
                <div class="training-plan" style="flex: 1; min-width: 250px;">
                    <h5>💪 운동 (${dayPlan.training.estimatedTime} ${dayPlan.training.timeUnit})</h5>
                    <p style="margin-top: 8px;"><strong>${dayPlan.training.name}:</strong> ${dayPlan.training.description}</p>
                    <ul style="padding-left: 20px; margin-top: 8px; list-style-type: disc;">
                        ${dayPlan.training.exercises.map(ex => `<li>${ex}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `).join('');

    return `<div class="ai-result-wrapper">${summaryHtml}${planHtml}</div>`;
}

/**
 * 로컬 스토리지에서 JSON 데이터를 불러와서 모달에 표시
 */
function showSavedResult() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
        alert('저장된 AI 결과가 없습니다.');
        return;
    }
    try {
        const jsonData = JSON.parse(savedData);
        const htmlContent = createResultHtmlFromJson(jsonData);
        DOM.modalBody.innerHTML = htmlContent;
        DOM.modal.classList.remove('hidden');
    } catch (e) {
        alert('저장된 데이터를 불러오는 데 실패했습니다.');
        console.error("저장된 데이터 파싱 오류:", e);
    }
}

/**
 * 폼 제출 핸들러
 * @param {Event} e
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    DOM.loading.style.display = 'block';
    DOM.submitBtn.disabled = true;
    DOM.errorBox.innerHTML = '';
    DOM.result.innerHTML = '';
    DOM.loading.scrollIntoView({ behavior: 'smooth' });

    const formDataObj = Object.fromEntries(new FormData(DOM.dietForm).entries());
    const processedData = preprocessFormData(formDataObj);
    const { errors, focusTarget } = validateForm(processedData);

    if (errors.length > 0) {
        alert('작성되지 않은 항목이 있습니다:\n- ' + errors.join('\n- '));
        focusTarget?.focus();
        DOM.loading.style.display = 'none';
        DOM.submitBtn.disabled = false;
        return;
    }

    try {
        const prompt = buildPrompt(processedData);
        const responseText = await callGeminiAPI(prompt);

        if (responseText) {
            const resultData = JSON.parse(responseText);
            const resultHtml = createResultHtmlFromJson(resultData);

            DOM.modalBody.innerHTML = resultHtml;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(resultData));

            DOM.modal.classList.remove('hidden');
            updateShowSavedResultBtnVisibility();
        } else {
            throw new Error('AI로부터 응답을 받지 못했습니다.');
        }
    } catch (error) {
        DOM.errorBox.textContent = `오류가 발생했습니다: ${error.message}`;
        DOM.errorBox.classList.remove('hidden');
        console.error(error);
    } finally {
        DOM.loading.style.display = 'none';
        DOM.submitBtn.disabled = false;
    }
}

/**
 * 이벤트 리스너 초기화
 */
function initEventListeners() {
    const validations = [
        { input: DOM.dietForm.elements.age, min: 10, max: 125 },
        { input: DOM.dietForm.elements.height, min: 50, max: 280 },
        { input: DOM.dietForm.elements.weight, min: 5, max: 610 },
        { input: DOM.dietForm.elements.fatRate, min: 0.1, max: 70 },
        { input: DOM.dietForm.elements.skeletalMuscleMass, min: 1, max: 100 },
        { input: DOM.dietForm.elements.activityCal, min: 0, max: 5000 },
        { input: DOM.targetFatRate, min: 0.1, max: 70 },
        { input: DOM.targetSkeletalMuscleMass, min: 1, max: 100 },
        { input: DOM.dietForm.elements.days, min: 1, max: 365 },
        { input: DOM.bmrManual, min: 800, max: 10000 }
    ];
    validations.forEach(({ input, min, max }) => setupNumberInputValidation(input, min, max));

    setupExclusiveInput(DOM.dietForm.elements.fatRate, DOM.dietForm.elements.fatLevel);
    setupExclusiveInput(DOM.dietForm.elements.skeletalMuscleMass, DOM.dietForm.elements.muscleLevel);
    setupExclusiveInput(DOM.dietForm.elements.activityCal, DOM.dietForm.elements.activityLevel);
    setupExclusiveInput(DOM.targetFatRate, DOM.targetFatLevel);
    setupExclusiveInput(DOM.targetSkeletalMuscleMass, DOM.targetSkeletalMuscleMassLevel);

    DOM.bmrMode.addEventListener('change', toggleBMRMode);
    ['gender', 'age', 'height', 'weight'].forEach(fieldName => {
        const element = DOM.dietForm.elements[fieldName];
        if (element) {
            element.addEventListener('input', calculateBMR);
        }
    });

    DOM.dietForm.addEventListener('submit', handleFormSubmit);
    DOM.modalOverlay.addEventListener('click', () => DOM.modal.classList.add('hidden'));
    DOM.closeModal.addEventListener('click', () => DOM.modal.classList.add('hidden'));
    DOM.showSavedResultBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showSavedResult();
    });
}

/**
 * 저장된 데이터 확인 (디버깅용)
 */
function checkSavedResult() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            console.log('✨ 저장된 AI 결과 (JSON 객체):', JSON.parse(saved));
        } catch(e) {
            console.error('✨ 저장된 데이터가 있으나 JSON 파싱에 실패했습니다:', saved);
        }
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