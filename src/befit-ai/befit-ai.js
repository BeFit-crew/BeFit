// ✅ Gemini API 키와 요청 URL 정의
const API_KEY = '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// ✅ DOM 요소 참조
const form = document.getElementById('dietForm');
const resultDiv = document.getElementById('result'); // 결과 출력 영역
const bmrSelect = document.getElementById('bmrMode'); // BMR 입력 방식 셀렉트 박스
const bmrManual = form.bmrManual; // 수동 입력 BMR 필드
const bmrAuto = form.bmrAuto; // 자동 계산된 BMR 필드
const autoGroup = document.getElementById('bmr-auto-group'); // 자동 BMR 필드 영역
const manualGroup = document.getElementById('bmr-manual-group'); // 수동 BMR 필드 영역
const errorBox = document.getElementById('errorBox'); // 오류 메시지 표시 영역
const loading = document.getElementById('loading'); // 로딩 인디케이터 영역

// ✅ 하나 입력되면 다른 하나는 비활성화되는 쌍 입력 구성 함수
function setupExclusiveInput(primaryInput, secondarySelect) {
    primaryInput.addEventListener('input', () => {
        if (primaryInput.value) {
            secondarySelect.disabled = true;
            secondarySelect.value = ''; // 셀렉트 초기화
        } else {
            secondarySelect.disabled = false;
        }
    });

    secondarySelect.addEventListener('change', () => {
        if (secondarySelect.value !== '') {
            primaryInput.disabled = true;
            primaryInput.value = ''; // 입력 초기화
        } else {
            primaryInput.disabled = false;
        }
    });
}

// ✅ 체지방량 ↔ 체지방 수준, 근육량 ↔ 근육 수준, 활동 칼로리 ↔ 활동 수준 쌍 연결
setupExclusiveInput(form.fatMass, form.fatLevel);
setupExclusiveInput(form.muscleMass, form.muscleLevel);
setupExclusiveInput(form.activityCal, form.activityLevel);

// ✅ 자동 BMR 계산 함수 (Mifflin-St Jeor 공식 기반)
const calculateBMR = () => {
    const gender = form.gender.value;
    const age = +form.age.value;
    const height = +form.height.value;
    const weight = +form.weight.value;
    if (!age || !height || !weight) return;
    let bmr = 0;
    if (gender === '남') {
        bmr = 66.47 + 13.75 * weight + 5.003 * height - 6.755 * age;
    } else if (gender === '여') {
        bmr = 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;
    } else {
        const male = 66.47 + 13.75 * weight + 5.003 * height - 6.755 * age;
        const female = 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;
        bmr = (male + female) / 2;
    }
    bmrAuto.value = Math.round(bmr);
};

// ✅ BMR 입력 방식 변경 시 보여줄 필드 전환
bmrSelect.addEventListener('change', () => {
    const isAuto = bmrSelect.value === 'auto';
    autoGroup.style.display = isAuto ? 'block' : 'none';
    manualGroup.style.display = isAuto ? 'none' : 'block';
    bmrManual.required = !isAuto;
    bmrAuto.required = isAuto;
    if (isAuto) calculateBMR();
});

// ✅ 자동 계산 조건 값이 변경되면 실시간 BMR 계산
['gender', 'age', 'height', 'weight'].forEach(name => {
    form[name].addEventListener('input', calculateBMR);
});

// ✅ 제출 시 실행될 전체 로직
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    loading.style.display = 'block';
    errorBox.innerHTML = '';
    resultDiv.innerHTML = '';
    const data = Object.fromEntries(new FormData(form).entries());
    const errorMessages = [];
    let firstInvalidField = null;

    if (typeof data.preferences !== 'string') data.preferences = '없음';
    if (!data.age || +data.age <= 0) {
        errorMessages.push('나이');
        firstInvalidField = firstInvalidField || form.age;
    }
    if (!data.height || +data.height <= 0) {
        errorMessages.push('키');
        firstInvalidField = firstInvalidField || form.height;
    }
    if (!data.weight || +data.weight <= 0) {
        errorMessages.push('몸무게');
        firstInvalidField = firstInvalidField || form.weight;
    }
    if (data.bmrMode === 'manual') {
        if (!data.bmrManual || +data.bmrManual <= 0) {
            errorMessages.push('기초대사량(BMR)');
            firstInvalidField = firstInvalidField || form.bmrManual;
        }
    } else {
        if (!data.bmrAuto || +data.bmrAuto <= 0) {
            errorMessages.push('자동 계산된 BMR');
            firstInvalidField = firstInvalidField || form.bmrAuto;
        }
    }
    if (!data.fatMass && !data.fatLevel) errorMessages.push('체지방량 또는 체지방 수준');
    if (!data.muscleMass && !data.muscleLevel) errorMessages.push('근육량 또는 근육 수준');
    if (!data.activityCal && !data.activityLevel) errorMessages.push('활동 칼로리 또는 활동 수준');
    if (!data.days || +data.days <= 0) {
        errorMessages.push('목표 일수');
        firstInvalidField = firstInvalidField || form.days;
    }

    if (errorMessages.length > 0) {
        alert('작성되지 않은 항목이 있습니다:\n- ' + errorMessages.join('\n- '));
        if (firstInvalidField) firstInvalidField.focus();
        return;
    }

    // ✅ GPT 프롬프트 생성
    const prompt =
        `당신은 전문 트레이너이자 영양사입니다. 사용자의 건강 정보와 목표를 바탕으로 식단과 전략을 JSON 구조와 HTML 카드 뷰 형식으로 작성해주세요.\n` +
        `요청사항:\n1. 하루 3끼 식단 + 레시피\n2. HTML 카드뷰 또는 JSON\n3. 전략 분석 포함\n4. 주당 체중 변화량 포함\n5. 7일 이상이면 반복 안내\n6. 요약 + 자세히 보기\n7. 목표에 따른 자동 전략\n8. 먹고 싶은 음식 반영\n9. HTML 카드 형식으로만 출력\n10. 체중 변화 예측 문구 포함\n\n` +
        `[사용자 정보]\n` +
        `성별: ${data.gender || '입력하지 않음'}\n나이: ${data.age}\n키: ${data.height}cm\n몸무게: ${data.weight}kg\n` +
        `체지방량: ${data.fatMass || data.fatLevel}\n근육량: ${data.muscleMass || data.muscleLevel}\n` +
        `기초대사량: ${data.bmrMode === 'auto' ? data.bmrAuto : data.bmrManual}kcal\n` +
        `활동 칼로리: ${data.activityCal || data.activityLevel}\n` +
        `목표 체중: ${data.targetWeight}kg, 목표 체지방: ${data.targetFat}kg, 목표 근육: ${data.targetMuscle}kg\n` +
        `목표 일수: ${data.days}일\n` +
        `먹고 싶은 음식: ${data.preferences || '없음'}\n` +
        `※ 반드시 HTML 태그(div, section 등)만 사용하고 코드블럭(\`\`\`)이나 설명 텍스트는 금지하세요.`;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({contents: [{role: 'user', parts: [{text: prompt}]}]})
        });

        const json = await res.json();
        let raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '결과 없음';

        // ✅ 코드블럭 마크다운 제거
        if (raw.startsWith('```')) raw = raw.replace(/^```(html|json)?\n/, '').replace(/```$/, '');

        // ✅ HTML 응답 처리
        if (raw.includes('<div') || raw.includes('<section')) {
            resultDiv.innerHTML = raw;
        } else if (raw.trim().startsWith('{') && raw.trim().endsWith('}')) {
            try {
                const parsed = JSON.parse(raw);
                renderCard(parsed);
            } catch (e) {
                resultDiv.innerHTML = `<pre>${raw}</pre>`;
            }
        } else {
            resultDiv.innerHTML = `<pre>${raw}</pre>`;
        }
    } catch (err) {
        console.error('에러 내용:', err);
        resultDiv.innerHTML = '<p style="color:red">오류가 발생했습니다. 다시 시도해주세요.</p>';
    } finally {
        loading.style.display = 'none';
    }

    // ✅ JSON 객체를 카드뷰 HTML로 렌더링
    function renderCard(data) {
        const container = document.createElement('div');
        container.style.cssText = `
            background-color: #fff;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 0 8px rgba(0,0,0,0.1);
            margin-top: 30px;
            line-height: 1.6;
        `;

        if (data.goalAnalysis) {
            const section = document.createElement('section');
            section.innerHTML = `<h3>🎯 목표 분석 및 전략</h3><p>${data.goalAnalysis}</p>`;
            container.appendChild(section);
        }
        if (data.plan7days) {
            const section = document.createElement('section');
            section.innerHTML = `<h3>📅 7일 식단 (예)</h3><p>${data.plan7days}</p>`;
            container.appendChild(section);
        }
        if (data.weightChange) {
            const section = document.createElement('section');
            section.innerHTML = `<h3>📉 예상 체중 변화</h3><p>${data.weightChange}</p>`;
            container.appendChild(section);
        }

        const toggle = document.createElement('button');
        toggle.textContent = '📋 자세히 보기';
        toggle.style.cssText = `
            margin-top: 20px;
            background-color: #4caf50;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
        `;
        const pre = document.createElement('pre');
        pre.style.cssText = 'margin-top: 10px; display: none; white-space: pre-wrap; font-size: 0.85rem; background:#f6f6f6; padding:10px; border-radius:6px; overflow-x:auto;';
        pre.textContent = JSON.stringify(data, null, 2);

        toggle.addEventListener('click', () => {
            pre.style.display = pre.style.display === 'none' ? 'block' : 'none';
        });

        container.appendChild(toggle);
        container.appendChild(pre);

        resultDiv.innerHTML = '';
        resultDiv.appendChild(container);
    }
});