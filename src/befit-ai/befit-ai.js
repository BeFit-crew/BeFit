// Gemini API URL을 외부 설정 파일에서 import
import {befit_AI_API_URL} from '../../assets/js/config.js';

// =============================
// DOM 요소 정리 - 폼, 결과 영역, 입력 그룹 등을 변수로 지정해 사용 편의성 확보
// =============================
const $dietForm = document.getElementById('dietForm-befit-ai');
const $result = document.getElementById('result-befit-ai');
const $bmrMode = document.getElementById('bmrMode-befit-ai');
const $gender = document.getElementById('gender-befit-ai');
const $bmrAutoGroup = document.getElementById('bmr-auto-group-befit-ai');
const $bmrManualGroup = document.getElementById('bmr-manual-group-befit-ai');
const $errorBox = document.getElementById('errorBox-befit-ai');
const $loading = document.getElementById('loading-befit-ai');
const $modal = document.getElementById('aiModal');
const $modalOverlay = document.getElementById('modalOverlay');
const $closeModal = document.getElementById('closeModal');
const $targetFat = document.getElementById('targetFat-befit-ai');
const $targetFatLevel = document.getElementById('targetFatLevel-befit-ai');
const $targetMuscle = document.getElementById('targetMuscle-befit-ai');
const $targetMuscleLevel = document.getElementById('targetMuscleLevel-befit-ai');
const $modalBody = document.getElementById('modalBody');
const $bmrManual = $dietForm.bmrManual;
const $bmrAuto = $dietForm.bmrAuto;

// =============================
// 유틸리티 함수
// =============================

/**
 * 특정 입력값과 선택값 중 하나만 입력 가능하도록 설정하는 함수
 * 숫자 입력이 감지되면 드롭다운 비활성화, 드롭다운이 선택되면 숫자 입력 비활성화
 */
function setupExclusiveInput($primaryInput, $secondarySelect) {
    function updateState() {
        // 입력값이 있으면 select 비활성화, 없으면 활성화
        $secondarySelect.disabled = !!$primaryInput.value.trim();
        // 선택값이 있으면 input 비활성화, 없으면 활성화
        $primaryInput.disabled = !!$secondarySelect.value;
    }

    $primaryInput.addEventListener('input', updateState);
    $secondarySelect.addEventListener('change', updateState);

    // 초기 상태 반영
    updateState();
}

/**
 * 기초대사량(BMR) 자동 계산 함수
 * 성별에 따라 다르게 계산되며, 미입력 시 평균 계산
 */
function calculateBMR() {
    const gender = $gender.value;
    const age = +$dietForm.age.value;
    const height = +$dietForm.height.value;
    const weight = +$dietForm.weight.value;

    if (!age || !height || !weight) return;

    const maleBMR = 10 * weight + 6.25 * height - 5 * age + 5;
    const femaleBMR = 10 * weight + 6.25 * height - 5 * age - 161;

    let bmr;
    if (gender === '남') {
        bmr = maleBMR;
    } else if (gender === '여') {
        bmr = femaleBMR;
    } else {
        // '비공개' 또는 선택하지 않았을 경우
        bmr = (maleBMR + femaleBMR) / 2;
    }

    $bmrAuto.value = Math.round(bmr);
}

function convertLevelToValue(level, type, gender = '비공개', weight = 0, height = 0, age = 0) {
    const fatTable = {
        남: {상: 25, 중상: 22, 중: 18, 중하: 15, 하: 12},
        여: {상: 30, 중상: 27, 중: 24, 중하: 20, 하: 17},
        평균: {상: 27.5, 중상: 24.5, 중: 21, 중하: 17.5, 하: 14.5}
    };

    const muscleRateTable = {
        남: {상: 0.45, 중상: 0.40, 중: 0.35, 중하: 0.30, 하: 0.25},
        여: {상: 0.40, 중상: 0.35, 중: 0.30, 중하: 0.25, 하: 0.20},
        평균: {상: 0.425, 중상: 0.375, 중: 0.325, 중하: 0.275, 하: 0.225}
    };

    const activityFactorTable = {
        상: 1.725,
        중상: 1.55,
        중: 1.375,
        중하: 1.2,
        하: 1.1
    };

    const fatRef = fatTable[gender] || fatTable['평균'];
    const muscleRef = muscleRateTable[gender] || muscleRateTable['평균'];
    const activityFactor = activityFactorTable[level];

    switch (type) {
        case 'fat':
            // 체지방률 → 체지방량(kg)
            return weight && fatRef[level] ? Math.round(weight * fatRef[level] / 100) : null;

        case 'muscle':
            // 근육률 * 체중 = 근육량
            return weight && muscleRef[level] ? Math.round(weight * muscleRef[level]) : null;

        case 'activity':
            if (!weight || !height || !age || !activityFactor) return null;
            const maleBMR = 10 * weight + 6.25 * height - 5 * age + 5;
            const femaleBMR = 10 * weight + 6.25 * height - 5 * age - 161;
            const bmr = gender === '남' ? maleBMR
                : gender === '여' ? femaleBMR
                    : (maleBMR + femaleBMR) / 2;
            return Math.round(bmr * activityFactor);

        default:
            return null;
    }
}


/**
 * 수동/자동 BMR 모드 전환 함수
 * 모드에 따라 보여지는 입력 필드와 필수값 설정 변경
 */
function toggleBMRMode() {
    const isAuto = $bmrMode.value === 'auto';
    $bmrAutoGroup.style.display = isAuto ? 'block' : 'none';
    $bmrManualGroup.style.display = isAuto ? 'none' : 'block';

    // 값 초기화 추가
    $bmrAuto.value = isAuto ? $bmrAuto.value : '';
    $bmrManual.value = !isAuto ? $bmrManual.value : '';

    $bmrAuto.required = isAuto;
    $bmrManual.required = !isAuto;

    if (isAuto) calculateBMR();
}


/**
 * 전체 폼의 필수 입력값 유효성 검사
 * - 빠진 항목이 있으면 오류 리스트 반환
 */
function validateForm(data) {
    const errors = [];
    let $focusTarget = null;

    const requiredFields = [
        {name: 'age', label: '나이'},
        {name: 'height', label: '키'},
        {name: 'weight', label: '몸무게'},
        {name: 'days', label: '목표 일수'}
    ];

    requiredFields.forEach(field => {
        if (!data[field.name] || +data[field.name] <= 0) {
            errors.push(field.label);
            $focusTarget ||= $dietForm[field.name];
        }
    });

    const bmrCheck = data.bmrMode === 'manual' ? data.bmrManual : data.bmrAuto;
    if (!bmrCheck || +bmrCheck <= 0) {
        errors.push(data.bmrMode === 'manual' ? '기초대사량(BMR)' : '자동 계산된 BMR');
        $focusTarget ||= data.bmrMode === 'manual' ? $dietForm.bmrManual : $dietForm.bmrAuto;
    }

    if (!data.fatMass && !data.fatLevel) errors.push('체지방량 또는 체지방 수준');
    if (!data.muscleMass && !data.muscleLevel) errors.push('근육량 또는 근육 수준');
    if (!data.activityCal && !data.activityLevel) errors.push('활동 칼로리 또는 활동 수준');

    return {errors, $focusTarget};
}

/**
 * Gemini API에 전송할 prompt를 사용자의 입력을 바탕으로 생성
 * 요구사항, 사용자 정보, 출력 포맷 포함
 */
function buildPrompt(data) {
    const gender = data.gender || '입력하지 않음';
    const weight = Number(data.weight);
    const fatRate = Number(data.fatRate);
    const fatMass = weight && fatRate ? (weight * fatRate / 100).toFixed(1) : null;

    const targetWeight = Number(data.targetWeight);
    const targetFatRate = Number(data.targetFatRate);
    const targetFatMass = targetWeight && targetFatRate ? (targetWeight * targetFatRate / 100).toFixed(1) : null;

    // 설명 구문 분기 (💡 fatMass, targetFatMass는 체지방률 × 체중으로 계산)
    const fatMassText = (fatMass && fatRate)
        ? `${fatMass}kg (체지방률 ${fatRate}% × 체중 ${weight}kg)`
        : (fatRate ? `체지방률 ${fatRate}% (체중 정보 없음)` : '미입력');

    const muscleMassText = data.muscleMass
        ? `${data.muscleMass}kg (${data.muscleLevel ? `수준 '${data.muscleLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.muscleLevel || '미입력');

    const activityText = data.activityCal
        ? `${data.activityCal}kcal (${data.activityLevel ? `수준 '${data.activityLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.activityLevel || '미입력');

    const targetFatText = (targetFatMass && targetFatRate)
        ? `${targetFatMass}kg (목표 체지방률 ${targetFatRate}% × 목표 체중 ${targetWeight}kg)`
        : (targetFatRate ? `목표 체지방률 ${targetFatRate}% (목표 체중 정보 없음)` : '미입력');

    const targetMuscleText = data.targetMuscle
        ? `${data.targetMuscle}kg (${data.targetMuscleLevel ? `수준 '${data.targetMuscleLevel}' 기준 자동 계산` : '직접 입력'})`
        : (data.targetMuscleLevel || '미입력');

    return `
당신은 전문 트레이너이자 영양사입니다.
다음 사용자 정보를 바탕으로 **건강한 7일 식단 계획**, **운동 전략**, **목표 분석**, **예상 체중 변화**를 HTML 카드 UI 형식으로 작성해주세요.

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
- 성별: ${gender}
- 나이: ${data.age}
- 키: ${data.height}cm
- 몸무게: ${data.weight}kg
- 체지방률: ${data.fatRate || '미입력'}%
- 근육량: ${muscleMassText}
- 활동 칼로리: ${activityText}
- 기초대사량: ${data.bmrMode === 'auto' ? data.bmrAuto : data.bmrManual}kcal
- 목표 체중: ${data.targetWeight}kg
- 목표 체지방률: ${data.targetFatRate || '미입력'}%
- 목표 근육량: ${targetMuscleText}
- 목표 일수: ${data.days}일
- 건강 특이사항: ${data.limitations || '없음'}
- 음식 알러지: ${data.foodAllergies || '없음'}
- 제외할 음식: ${data.restrictedFoods || '없음'}
- 먹고 싶은 음식: ${data.preferences || '없음'}
- 선호 운동: ${data.preferredWorkout || '없음'}
    `.trim();
}


/**
 * Gemini 응답 JSON을 시각적으로 HTML 카드 형식으로 출력
 */
function renderCard(data) {
    const $container = document.createElement('div');
    $container.style.cssText = `
        background: #ffffff;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 0 12px rgba(0,0,0,0.08);
        margin-top: 40px;
        font-family: 'Noto Sans KR', sans-serif;
        color: #333;
        line-height: 1.8;
        font-size: 16px;
    `;

    const createSection = (title, html) => {
        const $section = document.createElement('section');
        $section.style.marginBottom = '32px';
        $section.innerHTML = `<h3 style="font-size: 20px; color: #222; border-left: 6px solid #4caf50; padding-left: 12px; margin-bottom: 16px;">${title}</h3>${html}`;
        return $section;
    };

    if (data.user_info) {
        const u = data.user_info;
        const html = `
            <ul style="padding-left: 0; list-style: none;">
                <li><strong>성별:</strong> ${u.gender} / <strong>나이:</strong> ${u.age}</li>
                <li><strong>키:</strong> ${u.height}cm / <strong>체중:</strong> ${u.weight}kg</li>
                <li><strong>체지방:</strong> ${u.body_fat}kg / <strong>근육량:</strong> ${u.muscle_mass}kg</li>
                <li><strong>BMR:</strong> ${u.bmr}kcal / <strong>활동 칼로리:</strong> ${u.activity_calories}kcal</li>
                <li><strong>목표 체중:</strong> ${u.target_weight}kg / <strong>체지방:</strong> ${u.target_body_fat}kg / <strong>근육:</strong> ${u.target_muscle}kg</li>
                <li><strong>목표 기간:</strong> ${u.target_days}일</li>
                <li><strong>건강 특이사항:</strong> ${u.health_concerns || '없음'}</li>
                <li><strong>음식 알러지:</strong> ${u.food_allergies || '없음'}</li>
                <li><strong>제외 음식:</strong> ${u.excluded_foods || '없음'}</li>
                <li><strong>먹고 싶은 음식:</strong> ${u.desired_foods || '없음'}</li>
                <li><strong>희망 운동:</strong> ${u.desired_exercise || '없음'}</li>
            </ul>
        `;
        $container.appendChild(createSection('🧍 사용자 정보 요약', html));
    }

    // 식단 계획, 운동 전략 등도 동일하게 처리 (생략)

    return $container;
}

function initFormEvents() {
    setupExclusiveInput($dietForm.fatMass, $dietForm.fatLevel);
    setupExclusiveInput($dietForm.muscleMass, $dietForm.muscleLevel);
    setupExclusiveInput($dietForm.activityCal, $dietForm.activityLevel);
    setupExclusiveInput($targetFat, $targetFatLevel);
    setupExclusiveInput($targetMuscle, $targetMuscleLevel);

    $bmrMode.addEventListener('change', toggleBMRMode);
    ['gender', 'age', 'height', 'weight'].forEach(name => {
        $dietForm[name].addEventListener('input', calculateBMR);
    });


}

// 모달 배경 클릭 시 닫기
$modalOverlay.addEventListener('click', () => {
    $modal.classList.add('hidden');
});

// 닫기 버튼 클릭 시 닫기
$closeModal.addEventListener('click', () => {
    $modal.classList.add('hidden');
});

toggleBMRMode();
initFormEvents();
