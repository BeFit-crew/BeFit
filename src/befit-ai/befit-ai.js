// Gemini API URL 외부 설정에서 import
import config from '../../assets/js/config.js';

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
        // [수정] 목표일수 max 값을 30일로 제한 (과도한 요청 방지)
        { name: 'days', label: '목표 일수', max: 30 }
    ];
    for (const field of requiredFields) {
        const value = +data[field.name];
        if (!value || value <= 0) {
            errors.push(field.label);
            if (!focusTarget) focusTarget = DOM.dietForm[field.name];
        }
        // [추가] 최대값 검사 로직 추가
        if (field.max && value > field.max) {
            errors.push(`${field.label} (최대 ${field.max}일)`);
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
    const planDays = Math.min(data.days, 7);

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
    const targetMuscleText = data.targetSkeletalMuscleMass
        ? `${data.targetSkeletalMuscleMass}kg (${data.targetSkeletalMuscleMassLevel ? `수준 '${data.targetSkeletalMuscleMassLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.targetSkeletalMuscleMassLevel || '미입력');

    const workoutFrequencyText = data.preferredWorkoutTime || "주 7회";
    const workoutTimeNumber = data.preferredWorkoutTime ? (data.preferredWorkoutTime.match(/\d+/)?.[0] || 60) : 60;

    // [수정] return 바로 뒤에 백틱(`)이 오도록 수정
    return `당신은 전문 트레이너이자 영양사입니다.

다음 사용자 정보를 바탕으로,
- 건강 식단(diet)
- 운동 루틴(training)
- 목표 및 변화 분석(analysis)
- 하루 평균 운동 소요 시간(workoutTime)

을 반드시 아래 **JSON** 구조로만 응답하세요.

**[계획 생성 중요 규칙]**
- 사용자가 반복해서 수행할 수 있는 **${planDays}일치** 대표 계획을 생성합니다.
- 사용자의 희망 운동 빈도(**${workoutFrequencyText}**)를 반드시 준수하여 운동일을 배정하세요.
- 운동이 없는 날은 **"휴식"**으로 명확히 표시해야 합니다.

**JSON 구조 예시**
{
  "user": {
    "gender": "${data.gender || '입력하지 않음'}",
    "age": ${data.age},
    "height": ${data.height},
    "weight": ${data.weight},
    "fatRate": ${data.fatRate || null},
    "skeletalMuscleMass": ${data.skeletalMuscleMass || null},
    "activityCal": ${data.activityCal || null},
    "bmr": ${data.bmrMode === 'auto' ? data.bmrAuto : data.bmrManual},
    "targetWeight": ${data.targetWeight || null},
    "targetFatRate": ${data.targetFatRate || null},
    "targetSkeletalMuscleMass": ${data.targetSkeletalMuscleMass || null},
    "days": ${data.days},
    "limitations": "${data.limitations || '없음'}",
    "foodAllergies": "${data.foodAllergies || '없음'}",
    "restrictedFoods": "${data.restrictedFoods || '없음'}",
    "preferences": "${data.preferences || '없음'}",
    "preferredWorkout": "${data.preferredWorkout || '없음'}",
    "preferredWorkoutTime": "${workoutFrequencyText}"
  },
  "diet": [
    {
      "day": 1,
      "meals": [ { "type": "아침", "menu": ["닭가슴살"], "kcal": 400 } ]
    }
  ],
  "training": [
    {
      "day": 1,
      "routine": [ { "part": "가슴", "exercise": "벤치프레스", "set": "3 x 10" } ]
    },
    {
      "day": 2,
      "routine": [ { "part": "휴식", "exercise": "충분한 수면과 스트레칭", "set": "휴식" } ]
    }
  ],
  "analysis": {
    "goalWeight": null,
    "goalFatRate": null,
    "goalSkeletalMuscle": null,
    "expectedChange": "목표 달성 요약"
  },
  "workoutTime": ${workoutTimeNumber}
}

[사용자 정보]
- 성별: ${data.gender || '입력하지 않음'}
- 나이: ${data.age}
- 키: ${data.height}cm
- 몸무게: ${data.weight}kg
- 체지방률: ${fatMassText}
- 골격근량: ${muscleMassText}
- 활동 칼로리: ${activityText}
- 기초대사량: ${data.bmrMode === 'auto' ? data.bmrAuto : data.bmrManual}kcal
- 목표 체중: ${data.targetWeight || '미입력'}kg
- 목표 체지방률: ${targetFatText}
- 목표 골격근량: ${targetMuscleText}
- 목표 일수: ${data.days}일
- 건강 특이사항: ${data.limitations || '없음'}
- 음식 알러지: ${data.foodAllergies || '없음'}
- 제외할 음식: ${data.restrictedFoods || '없음'}
- 먹고 싶은 음식: ${data.preferences || '없음'}
- 선호 운동: ${data.preferredWorkout || '없음'}
- 운동 희망 시간 및 빈도: ${workoutFrequencyText}

**[최종 지시]**
- 반드시 day1부터 day${planDays}까지 모두 채운 JSON 배열로 응답하세요.
- **운동이 없는 날의 routine**은 \`[{"part": "휴식", "exercise": "가벼운 산책 또는 스트레칭", "set": "휴식"}]\` 과 같이 명확하게 '휴식'으로 채워주세요.
- 마크다운, 설명문, 코드블록(\`\`\`) 없이 순수 JSON만 반환하세요.

[위 사용자 정보와 구조로 ${planDays}일치 식단·운동·분석·운동시간을 한국어로 상세히 채워주세요]`;
}

/**
 * Gemini API 호출
 * @param {string} prompt
 * @returns {Promise<string|null>}
 */
async function callGeminiAPI(prompt) {
    const response = await fetch(config.AI_API_URL, {
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
 * AI 응답 텍스트에서 순수 JSON 텍스트만 추출합니다.
 * 응답이 마크다운 코드 블록(` ```json ... ``` `)으로 감싸여 있거나,
 * 불완전하게 잘렸을 경우를 대비합니다.
 * @param {string} rawText - AI로부터 받은 원본 텍스트
 * @returns {string} - 추출된 JSON 텍스트
 */
function extractPureJSON(rawText) {
    // `json` 이라는 단어가 포함된 코드 블록을 찾으려고 시도
    let match = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return match[1].trim();
    }

    // 일반 코드 블록을 찾으려고 시도
    match = rawText.match(/```\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return match[1].trim();
    }

    // 코드 블록이 없다면, 첫 '{' 와 마지막 '}' 사이의 내용을 추출
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return rawText.substring(firstBrace, lastBrace + 1);
    }

    // 아무것도 찾지 못하면 원본 텍스트 반환
    return rawText;
}



/**
 * AI 응답 JSON 데이터를 사용자가 보기 좋은 HTML로 변환합니다.
 * @param {object} data - 파싱된 AI 응답 객체
 * @returns {string} - 렌더링된 HTML 문자열
 */
function renderAIResult(data) {
    // [수정] workoutTime이 문자열일 경우 숫자만 추출
    let workoutTimeDisplay = data.workoutTime;
    if (typeof workoutTimeDisplay === 'string') {
        const match = workoutTimeDisplay.match(/\d+/); // 문자열에서 첫 번째 숫자 그룹을 찾음
        if (match) {
            workoutTimeDisplay = `${match[0]}분`;
        }
    } else {
        workoutTimeDisplay = `${data.workoutTime || '미설정'}분`;
    }

    // 사용자 정보 및 분석 섹션
    const analysisHtml = `
        <div class="analysis-section">
            <h2>📊 AI 분석 및 요약</h2>
            <p>${data.analysis.expectedChange}</p>
            <ul>
                <li><strong>총 목표 기간:</strong> ${data.user.days}일</li>
                <li><strong>하루 권장 운동 시간:</strong> ${workoutTimeDisplay}</li>
                <li><strong>목표 체중:</strong> ${data.analysis.goalWeight || '미설정'} kg</li>
                <li><strong>목표 체지방률:</strong> ${data.analysis.goalFatRate || '미설정'} %</li>
                <li><strong>목표 골격근량:</strong> ${data.analysis.goalSkeletalMuscle || '미설정'} kg</li>
            </ul>
        </div>
    `;

    // 식단 및 운동 계획 섹션
    const planHtml = data.diet.map((dayPlan, index) => {
        const trainingPlan = data.training[index];
        const dietList = dayPlan.meals.map(meal => `
            <tr>
                <td>${meal.type}</td>
                <td>${Array.isArray(meal.menu) ? meal.menu.join(', ') : meal.menu}</td>
                <td>${meal.kcal} kcal</td>
            </tr>
        `).join('');

        const trainingList = trainingPlan.routine.map(exercise => `
            <tr>
                <td>${exercise.part}</td>
                <td>${exercise.exercise}</td>
                <td>${exercise.set}</td>
            </tr>
        `).join('');

        return `
            <details class="day-plan" ${index === 0 ? 'open' : ''}>
                <summary>
                    <h3>📅 Day ${dayPlan.day}</h3>
                </summary>
                <div class="plan-content">
                    <h4>🥗 식단</h4>
                    <table>
                        <thead><tr><th>구분</th><th>메뉴</th><th>칼로리</th></tr></thead>
                        <tbody>${dietList}</tbody>
                    </table>
                    <h4>💪 운동</h4>
                    <table>
                        <thead><tr><th>부위</th><th>운동</th><th>세트</th></tr></thead>
<tbody>${trainingList}</tbody>
                    </table>
                </div>
            </details>
        `;
    }).join('');

    return `<div class="ai-result-container">${analysisHtml}<hr>${planHtml}</div>`;
}


/**
 * 로컬 스토리지에서 저장된 AI 결과를 모달에 표시
 */
function showSavedResult() {
    const savedJsonString = localStorage.getItem(STORAGE_KEY); // [수정] JSON 문자열을 가져옴
    if (!savedJsonString) {
        alert('저장된 AI 결과가 없습니다.');
        return;
    }

    try {
        // [수정] JSON을 파싱하고 렌더링 함수를 통해 HTML로 변환
        const savedData = JSON.parse(savedJsonString);
        DOM.modalBody.innerHTML = renderAIResult(savedData);
        DOM.modal.classList.remove('hidden');
    } catch (error) {
        alert('저장된 결과를 불러오는 중 오류가 발생했습니다.');
        console.error("저장된 JSON 파싱 오류:", error);
        // 오류 발생 시 저장된 데이터 삭제도 고려
        localStorage.removeItem(STORAGE_KEY);
        updateShowSavedResultBtnVisibility();
    }
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

    DOM.loading.scrollIntoView({ behavior: 'smooth' });

    const formDataObj = Object.fromEntries(new FormData(DOM.dietForm).entries());
    const rawData = preprocessFormData(formDataObj);

    const { errors, focusTarget } = validateForm(rawData);

    if (errors.length > 0) {
        alert('다음 필수 항목을 확인해주세요:\n- ' + errors.join('\n- '));
        focusTarget?.focus();
        DOM.loading.style.display = 'none';
        return;
    }

    try {
        const prompt = buildPrompt(rawData);
        const rawResponse = await callGeminiAPI(prompt);

        if (rawResponse) {
            let aiData;
            try {
                let cleanedJsonText = extractPureJSON(rawResponse);

                // [추가] JSON 파싱 전, 흔한 오류 자동 수정
                // 1. 객체나 배열의 마지막 요소 뒤에 불필요한 쉼표(trailing comma) 제거
                cleanedJsonText = cleanedJsonText.replace(/,\s*([}\]])/g, '$1');
                // 2. 닫는 괄호( } 또는 ] ) 바로 앞에 와야 할 쉼표가 누락된 경우 추가
                // 예: { "a": 1 } { "b": 2 } -> { "a": 1 }, { "b": 2 }
                cleanedJsonText = cleanedJsonText.replace(/}\s*{/g, '},{');

                aiData = JSON.parse(cleanedJsonText);
            } catch (parseErr) {
                console.error("JSON 파싱 오류:", parseErr);
                console.error("AI 원본 응답:", rawResponse);
                DOM.modalBody.innerHTML = `<p style="color:red; white-space: pre-wrap;">AI가 유효한 형식으로 응답하지 않았습니다. 잠시 후 다시 시도해주세요.<br><br><b>[오류 상세]</b><br>${parseErr.message}<br><br><b>[AI 응답 원문]</b><br>${rawResponse}</p>`;
                DOM.modal.classList.remove('hidden');
                DOM.loading.style.display = 'none';
                return;
            }

            DOM.modalBody.innerHTML = renderAIResult(aiData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(aiData));
            DOM.modal.classList.remove('hidden');
            updateShowSavedResultBtnVisibility();
        } else {
            DOM.modalBody.innerHTML = '<p style="color:red">AI로부터 응답을 받지 못했습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.</p>';
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
 */
function initEventListeners() {
    const validations = [
        { input: DOM.dietForm.age, min: 10, max: 125 },
        { input: DOM.dietForm.height, min: 50, max: 280 },
        { input: DOM.dietForm.weight, min: 5, max: 610 },
        { input: DOM.dietForm.fatRate, min: 0.1, max: 70 },
        { input: DOM.dietForm.skeletalMuscleMass, min: 1, max: 100 },
        { input: DOM.dietForm.activityCal, min: 0, max: 5000 },
        { input: DOM.targetFatRate, min: 0.1, max: 70 },
        { input: DOM.targetSkeletalMuscleMass, min: 1, max: 100 },
        // [수정] 목표일수 최대값을 30으로 설정하여 과도한 요청 방지
        { input: DOM.dietForm.days, min: 1, max: 30 },
        { input: DOM.dietForm.bmrManual, min: 800, max: 10000 }
    ];

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
            // [수정] 저장된 데이터가 유효한 JSON인지 확인하고 객체로 출력
            console.log('✨ 저장된 AI 결과 (파싱된 객체):', JSON.parse(saved));
        } catch {
            console.log('✨ 저장된 AI 결과 (잘못된 형식):', saved);
        }
    }
}

/**
 * 애플리케이션 메인 함수
 */
function main() {
    if (!DOM.dietForm) {
        return;
    }
    toggleBMRMode();
    initEventListeners();
    checkSavedResult();
    updateShowSavedResultBtnVisibility();
}

main();

/**
 * * 로컬 스토리지에 저장된 BeFit AI 결과(JSON)를 객체로 반환하는 공유 함수입니다.
 *  *
 *  * - 전역(window) 또는 모듈에서 import하여 사용할 수 있습니다.
 *  * - 저장된 값이 JSON 형식이면 객체로 반환하고, 없거나 파싱에 실패하면 null을 반환합니다.
 *  * - 데이터가 손상(파싱 실패)된 경우 콘솔에 오류를 출력합니다.
 */
export function getBefitAiResult() {
    const STORAGE_KEY = 'befit_ai_result'; // 이 상수는 befit-ai.js 상단에 이미 선언되어 있어야 합니다.
    const savedDataString = localStorage.getItem(STORAGE_KEY);

    if (savedDataString) {
        try {
            // 성공적으로 데이터를 파싱하면 객체를 반환
            return JSON.parse(savedDataString);
        } catch (e) {
            console.error("공유 데이터 파싱 실패:", e);
            // 데이터가 손상되었으면 null 반환
            return null;
        }
    }
    // 저장된 데이터가 없으면 null 반환
    return null;
}