// /src/befit-ai/modules/ui-befit-ai.js

/**
 * @file BeFit AI 기능의 사용자 인터페이스(UI)를 생성하고 제어하는 모든 로직을 담당하는 모듈입니다.
 * @description 이 파일은 서버로부터 받은 데이터(JSON)를 사용자가 보기 좋은 HTML로 변환(렌더링)하고,
 *              로딩 화면이나 모달 창 같은 동적인 UI 요소들을 관리합니다.
 */

// [의존성] 다른 모듈에서 정의된 DOM 요소와 스토리지 관련 함수들을 가져옵니다.
import DOM from './dom-befit-ai.js';
import {getBefitAiResult, updateShowSavedResultBtnVisibility} from './storage-befit-ai.js';

/**
 * AI가 생성한 JSON 데이터를 동적인 HTML 문자열로 변환(렌더링)합니다.
 * 이 함수는 순수하게 데이터를 받아 HTML을 반환하는 역할만 수행하며, 실제 DOM 조작은 하지 않습니다.
 * @param {object} data - 파싱된 AI 응답 객체.
 * @returns {string} - 화면에 표시될 최종 HTML 문자열.
 */
export function renderAIResult(data) {
    // [데이터 가공] AI가 '60분'과 같은 문자열로 응답할 경우를 대비해, 숫자만 추출하여 일관된 형식으로 만듭니다.
    let workoutTimeDisplay = data.workoutTime;
    if (typeof workoutTimeDisplay === 'string') {
        const match = workoutTimeDisplay.match(/\d+/); // 정규표현식으로 첫 번째 숫자 그룹을 찾음
        if (match) {
            workoutTimeDisplay = `${match[0]}분`;
        }
    } else {
        // '||' 연산자: data.workoutTime이 null, undefined, 0 등 falsy 값일 경우 '미설정'을 기본값으로 사용합니다.
        workoutTimeDisplay = `${data.workoutTime || '미설정'}분`;
    }

    // [HTML 템플릿] 템플릿 리터럴(``)을 사용하여 분석 및 요약 섹션의 HTML 구조를 만듭니다.
    const analysisHtml = `
        <div class="analysis-section">
            <h2><i class="fas fa-chart-pie"></i> BeFit AI 분석 및 요약</h2>
            <p>${data.analysis.expectedChange}</p>
            <ul>
                <li><strong>총 목표 기간:</strong> ${data.user.days}일</li>
                <li><strong>하루 권장 운동 시간:</strong> ${workoutTimeDisplay}</li>
                <li><strong>목표 체중:</strong> ${data.analysis.goalWeight || '미설정'} kg</li>
                <li><strong>목표 체지방률:</strong> ${data.analysis.goalFatRate || '미설정'} %</li>
                <li><strong>목표 골격근량:</strong> ${data.analysis.goalSkeletalMuscle || '미설정'} kg</li>
            </ul>
        </div>`;

    // [배열 순회 및 변환] .map() 메소드를 사용하여 식단과 운동 계획 배열을 순회하며 각 항목을 <tr> HTML 태그로 변환합니다.
    const planHtml = data.diet.map((dayPlan, index) => {
        const trainingPlan = data.training[index]; // 식단과 운동 계획은 같은 순서(index)를 가집니다.

        const dietList = dayPlan.meals.map(meal => `
            <tr>
                <td>${meal.type}</td>
                <td>${Array.isArray(meal.menu) ? meal.menu.join(', ') : meal.menu}</td>
                <td>${meal.kcal} kcal</td>
            </tr>`).join(''); // .join('')으로 모든 <tr> 문자열을 하나로 합칩니다.

        const trainingList = trainingPlan.routine.map(exercise => `
            <tr>
                <td>${exercise.part}</td>
                <td>${exercise.exercise}</td>
                <td>${exercise.set}</td>
            </tr>`).join('');

        // 각 날짜의 계획은 <details> 태그를 사용하여 접고 펼 수 있는 아코디언 형태로 만듭니다.
        // 첫 번째 날짜(index === 0)의 계획만 기본적으로 펼쳐진 상태('open')로 보여줍니다.
        return `
            <details class="day-plan" ${index === 0 ? 'open' : ''}>
                <summary><h3><i class="fas fa-calendar-day"></i> Day ${dayPlan.day}</h3></summary>
                <div class="plan-content">
                    <h4><i class="fas fa-utensils"></i> 식단</h4>
                    <table>
                        <thead><tr><th>구분</th><th>메뉴</th><th>칼로리</th></tr></thead>
                        <tbody>${dietList}</tbody>
                    </table>
                    <h4><i class="fas fa-dumbbell"></i> 운동</h4>
                    <table>
                        <thead><tr><th>부위</th><th>운동</th><th>세트</th></tr></thead>
                        <tbody>${trainingList}</tbody>
                    </table>
                </div>
            </details>`;
    }).join('');

    // 최종적으로 분석 HTML과 계획 HTML을 합쳐서 전체 결과물 HTML을 반환합니다.
    return `<div class="ai-result-container">${analysisHtml}<hr>${planHtml}</div>`;
}

/**
 * '다시 보기' 버튼 클릭 시, 로컬 스토리지에 저장된 AI 결과를 가져와 모달에 표시합니다.
 */
export function showSavedResult() {
    // storage 모듈의 함수를 사용하여 저장된 데이터를 가져옵니다.
    const savedData = getBefitAiResult();
    if (!savedData) {
        alert('저장된 AI 결과가 없습니다.');
        return;
    }
    // [예외 처리] 저장된 데이터가 있더라도 렌더링 과정에서 오류가 발생할 수 있으므로 try...catch로 감쌉니다.
    try {
        const resultHtml = renderAIResult(savedData);
        showModalWithContent(resultHtml);
    } catch (error) {
        console.error("저장된 결과 렌더링 오류:", error);
        alert('저장된 결과를 표시하는 중 오류가 발생했습니다.');
        // [자동 복구] 렌더링에 실패한 데이터는 손상되었을 가능성이 높으므로, 로컬 스토리지에서 제거합니다.
        localStorage.removeItem('befit_ai_result'); // 직접 스토리지 키를 사용 (storage 모듈 함수 호출 시 무한 루프 위험 방지)
        updateShowSavedResultBtnVisibility();
    }
}

/**
 * API 요청 시작/종료 시 로딩 화면을 표시하거나 숨깁니다.
 * @param {boolean} isLoading - 로딩 상태 여부. true이면 로딩 화면을 표시, false이면 숨깁니다.
 */
export function toggleLoading(isLoading) {
    if (DOM.loading) {
        DOM.loading.style.display = isLoading ? 'block' : 'none';
    }
    // 로딩이 시작될 때, 이전 결과나 에러 메시지가 남아있지 않도록 해당 영역을 깨끗하게 비웁니다.
    if (isLoading) {
        if (DOM.result) DOM.result.innerHTML = '';
        if (DOM.errorBox) DOM.errorBox.innerHTML = '';
        // 로딩 화면이 사용자에게 보이도록 해당 위치로 스크롤을 부드럽게 이동시킵니다.
        DOM.loading?.scrollIntoView({behavior: 'smooth'});
    }
}

/**
 * 전달받은 HTML 컨텐츠를 모달창 내부에 삽입하고, 모달을 화면에 표시합니다.
 * @param {string} htmlContent - 모달에 표시할 HTML 문자열.
 */
export function showModalWithContent(htmlContent) {
    // [방어적 코딩] 모달 관련 DOM 요소가 존재하는지 확인하여 예기치 않은 오류를 방지합니다.
    if (DOM.modal && DOM.modalBody) {
        DOM.modalBody.innerHTML = htmlContent; // 모달의 내용(body)을 채웁니다.
        DOM.modal.classList.remove('hidden');  // CSS의 'hidden' 클래스를 제거하여 모달을 화면에 나타나게 합니다.
    }
}