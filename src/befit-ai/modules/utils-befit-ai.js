// /src/befit-ai/modules/utils-befit-ai.js

/**
 * @file BeFit AI 기능에서 사용되는 범용 유틸리티(도우미) 함수들을 모아놓은 모듈입니다.
 * @description 이 파일은 데이터 계산, 폼 유효성 검사, 데이터 형식 변환 등
 *              애플리케이션의 여러 곳에서 반복적으로 사용될 수 있는 작은 기능들을 함수 단위로 제공합니다.
 */

// [의존성] DOM 요소와 상수들을 다른 모듈에서 가져옵니다.
import DOM from './dom-befit-ai.js';
import {BMR_FORMULA, BMR_MODE, CONVERSION_TABLES} from './constants-befit-ai.js';

/**
 * 숫자 입력 필드에 대해 유효성 검사를 설정하고, 범위를 벗어날 경우 사용자에게 피드백을 줍니다.
 * @param {HTMLInputElement} input - 검사할 HTML <input> 요소.
 * @param {number} min - 허용되는 최소값.
 * @param {number} max - 허용되는 최대값.
 */
export function setupNumberInputValidation(input, min, max) {
    // 입력값이 유효한 범위 내에 있는지 확인하는 내부 함수
    function isValid(value) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    // 사용자가 입력할 때마다 실시간으로 유효성을 검사하여 시각적 피드백(CSS 클래스)을 줍니다.
    input.addEventListener('input', () => {
        const val = input.value.trim();
        if (val === '' || isNaN(Number(val))) {
            input.classList.remove('input-error'); // 비어있으면 에러 표시 제거
            return;
        }
        input.classList.toggle('input-error', !isValid(val)); // 유효하지 않으면 'input-error' 클래스 추가/제거
    });
    // 사용자가 입력 필드에서 포커스를 잃었을 때(blur), 최종적으로 값을 검사합니다.
    input.addEventListener('blur', () => {
        const val = input.value.trim();
        // 비어있거나 유효한 값이면 아무것도 하지 않음
        if (val === '' || isNaN(Number(val)) || isValid(val)) return;

        // 유효하지 않은 값이면 경고창을 띄우고, 입력값을 비운 뒤 다시 포커스를 줍니다.
        alert(`${min} 이상 ${max} 이하로 입력해 주세요.`);
        input.value = '';
        input.classList.remove('input-error');
        input.focus();
    });
}

/**
 * 두 개의 입력 필드(보통 숫자 입력과 선택 박스) 중 하나만 활성화되도록 상호 배타적인 관계를 설정합니다.
 * 예: '체지방률'을 직접 입력하면 '체지방 수준' 선택이 비활성화되고, 그 반대도 마찬가지입니다.
 * @param {HTMLInputElement} primaryInput - 주로 직접 입력하는 필드.
 * @param {HTMLSelectElement} secondarySelect - 주로 선택하는 필드.
 */
export function setupExclusiveInput(primaryInput, secondarySelect) {
    function updateState() {
        if (!primaryInput || !secondarySelect) return; // 요소가 없는 경우를 대비한 방어 코드
        // 한쪽 필드에 값이 있으면 다른 쪽 필드를 비활성화(disabled)시킵니다.
        secondarySelect.disabled = !!primaryInput.value.trim();
        primaryInput.disabled = !!secondarySelect.value;
    }

    // 각 필드에 입력이나 변경이 일어날 때마다 상태를 업데이트합니다.
    primaryInput.addEventListener('input', updateState);
    secondarySelect.addEventListener('change', updateState);
    updateState(); // 페이지 로드 시 초기 상태를 설정합니다.
}

/**
 * 사용자의 기본 정보를 바탕으로 기초대사량(BMR)을 자동으로 계산합니다. (해리스-베네딕트 공식 변형)
 */
export function calculateBMR() {
    const gender = DOM.gender.value;
    const age = Number(DOM.dietForm.age.value);
    const height = Number(DOM.dietForm.height.value);
    const weight = Number(DOM.dietForm.weight.value);

    // 필수 정보가 모두 입력되지 않았으면 계산을 중단하고 자동 계산 필드를 비웁니다.
    if (!age || !height || !weight) {
        DOM.bmrAuto.value = '';
        return;
    }

    // BMR_FORMULA 상수에 정의된 계수들을 사용하여 공통 부분을 계산합니다.
    const baseBMR = BMR_FORMULA.WEIGHT_COEFFICIENT * weight
        + BMR_FORMULA.HEIGHT_COEFFICIENT * height
        - BMR_FORMULA.AGE_COEFFICIENT * age;

    let bmr;
    if (gender === '남') {
        // 남성 상수를 더합니다.
        bmr = baseBMR + BMR_FORMULA.MALE_CONSTANT;
    } else if (gender === '여') {
        // 여성 상수를 더합니다.
        bmr = baseBMR + BMR_FORMULA.FEMALE_CONSTANT;
    } else { // 성별 '비공개' 선택 시, 남/녀 평균값을 사용합니다.
        bmr = (baseBMR + BMR_FORMULA.MALE_CONSTANT + baseBMR + BMR_FORMULA.FEMALE_CONSTANT) / 2;
    }

    // 계산된 최종 BMR 값을 소수점 없이 반올림하여 자동계산 입력 필드에 표시합니다.
    // 이때, BMR이 음수가 되는 것을 방지하기 위해 Math.max(0, ...)를 사용하여 최솟값을 0으로 강제합니다.
    DOM.bmrAuto.value = Math.round(Math.max(0, bmr));
}

/**
 * 사용자가 선택한 추상적인 '수준'('상', '중', '하' 등)을 실제 수치로 변환합니다.
 * @param {string} level - 사용자가 선택한 수준 (예: '상').
 * @param {string} type - 변환할 데이터의 종류 (예: 'fat', 'muscle', 'activity').
 * @param {string} [gender='비공개'] - 성별 (기본값 '비공개').
 * @param {number} [weight=0] - 체중 (기본값 0, 근육량/활동량 계산 시 필요).
 * @returns {number|null} - 변환된 수치 또는 변환 실패 시 null.
 */
export function convertLevelToValue(level, type, gender = '비공개', weight = 0) {
    // 성별이 '남' 또는 '여'가 아니면 '평균' 테이블을 사용합니다.
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
 * BMR 입력 방식을 '자동 계산'과 '직접 입력' 사이에서 전환(toggle)합니다.
 */
export function toggleBMRMode() {
    const isAuto = DOM.bmrMode.value === BMR_MODE.AUTO;
    // 선택된 모드에 따라 해당 입력 필드 그룹을 보여주거나 숨깁니다.
    DOM.bmrAutoGroup.style.display = isAuto ? 'block' : 'none';
    DOM.bmrManualGroup.style.display = isAuto ? 'none' : 'block';
    // 폼 제출 시 유효성 검사를 위해, 현재 활성화된 필드에만 'required' 속성을 부여합니다.
    DOM.bmrAuto.required = isAuto;
    DOM.bmrManual.required = !isAuto;
    // '자동 계산' 모드로 전환되면 즉시 BMR을 계산하여 보여줍니다.
    if (isAuto) calculateBMR();
}

/**
 * 사용자가 폼을 제출하기 전에 모든 필수 입력값이 제대로 채워졌는지 검사합니다.
 * @param {Object} data - 사용자가 폼에 입력한 데이터 객체.
 * @returns {{errors: string[], focusTarget: HTMLElement|null}} - 오류 메시지 배열과 포커스를 줘야 할 첫 번째 오류 필드.
 */
export function validateForm(data) {
    const errors = [];
    let focusTarget = null;
    // 검사할 필수 필드 목록을 정의합니다.
    const requiredFields = [
        {name: 'age', label: '나이'},
        {name: 'height', label: '키'},
        {name: 'weight', label: '몸무게'},
        {name: 'days', label: '목표 일수', max: 365} // 최대값 검사도 함께 정의
    ];
    for (const field of requiredFields) {
        const value = +data[field.name]; // 문자열을 숫자로 변환
        if (!value || value <= 0) {
            errors.push(field.label);
            if (!focusTarget) focusTarget = DOM.dietForm[field.name]; // 첫 번째 오류 필드를 저장
        }
        if (field.max && value > field.max) {
            errors.push(`${field.label} (최대 ${field.max}일)`);
            if (!focusTarget) focusTarget = DOM.dietForm[field.name];
        }
    }
    // BMR 값도 검사합니다.
    const bmrVal = data.bmrMode === BMR_MODE.MANUAL ? data.bmrManual : data.bmrAuto;
    if (!bmrVal || +bmrVal <= 0) {
        errors.push(data.bmrMode === BMR_MODE.MANUAL ? '기초대사량(BMR)' : '자동 계산된 BMR');
        if (!focusTarget) focusTarget = data.bmrMode === BMR_MODE.MANUAL ? DOM.dietForm.bmrManual : DOM.dietForm.bmrAuto;
    }
    // 체성분/활동 정보는 둘 중 하나만 입력하면 되므로, 둘 다 비어있는 경우만 에러로 처리합니다.
    if (!data.fatRate && !data.fatLevel) errors.push('체지방률 또는 체지방 수준');
    if (!data.skeletalMuscleMass && !data.muscleLevel) errors.push('골격근량 또는 골격근 수준');
    if (!data.activityCal && !data.activityLevel) errors.push('활동 칼로리 또는 활동 수준');

    return {errors, focusTarget};
}

/**
 * AI에게 데이터를 보내기 전에, '수준'으로 입력된 값들을 실제 수치로 변환하는 등 데이터를 최종 가공(전처리)합니다.
 * @param {Object} data - 사용자가 폼에서 가져온 원본 데이터.
 * @returns {Object} - AI에게 보내기 좋게 가공된 데이터.
 */
export function preprocessFormData(data) {
    const gender = data.gender;
    const weight = Number(data.weight);
    data.preferences ||= '없음'; // 먹고 싶은 음식이 비어있으면 '없음'으로 기본값 설정

    // 각 항목에 대해, 직접 입력값이 없고 수준 선택값만 있을 경우, 수치로 변환하여 채워줍니다.
    if (!data.fatRate && data.fatLevel) data.fatRate = convertLevelToValue(data.fatLevel, 'fat', gender);
    if (!data.skeletalMuscleMass && data.muscleLevel) data.skeletalMuscleMass = convertLevelToValue(data.muscleLevel, 'muscle', gender, weight);
    if (!data.activityCal && data.activityLevel) data.activityCal = convertLevelToValue(data.activityLevel, 'activity', gender, weight);
    if (!data.targetFatRate && data.targetFatLevel) data.targetFatRate = convertLevelToValue(data.targetFatLevel, 'fat', gender);
    if (!data.targetSkeletalMuscleMass && data.targetSkeletalMuscleMassLevel) data.targetSkeletalMuscleMass = convertLevelToValue(data.targetSkeletalMuscleMassLevel, 'muscle', gender, weight);

    return data;
}

/**
 * AI가 응답한 원본 텍스트에서 순수한 JSON 데이터 부분만 추출합니다.
 * AI는 가끔 JSON 데이터를 마크다운 코드 블록(```json ... ```)으로 감싸거나, 불필요한 설명을 덧붙이는 경우가 있기 때문입니다.
 * @param {string} rawText - AI로부터 받은 원본 응답 텍스트.
 * @returns {string} - 깔끔하게 정리된 JSON 형식의 문자열.
 */
export function extractPureJSON(rawText) {
    // 1. ```json ... ``` 형식의 코드 블록을 찾습니다.
    let match = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return match[1].trim();
    }
    // 2. ``` ... ``` 형식의 일반 코드 블록을 찾습니다.
    match = rawText.match(/```\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return match[1].trim();
    }
    // 3. 코드 블록이 없다면, 텍스트에서 첫 '{' 와 마지막 '}' 사이의 내용을 추출합니다.
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return rawText.substring(firstBrace, lastBrace + 1);
    }
    // 4. 아무 패턴도 찾지 못하면, 일단 원본 텍스트를 그대로 반환합니다.
    return rawText;
}