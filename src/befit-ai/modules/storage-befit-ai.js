// /src/befit-ai/modules/storage-befit-ai.js

/**
 * @file BeFit AI 기능의 데이터를 브라우저의 로컬 스토리지(Local Storage)에 저장하고 불러오는 역할을 전담하는 모듈입니다.
 * @description 사용자가 이전에 받은 AI 분석 결과를 브라우저를 닫았다가 다시 열어도 볼 수 있게 데이터 영속성을 제공합니다.
 *              이를 통해 매번 API를 호출할 필요 없이 이전에 생성된 결과를 즉시 확인할 수 있습니다.
 */

// [의존성] 다른 모듈에서 정의된 상수와 DOM 요소를 가져옵니다.
import {STORAGE_KEY} from './constants-befit-ai.js'; // 로컬 스토리지 키
import DOM from './dom-befit-ai.js'; // '다시 보기' 버튼 제어를 위한 DOM 객체

/**
 * AI 분석 결과를 로컬 스토리지에 안전하게 저장하고, '다시 보기' 버튼의 상태를 업데이트합니다.
 * @param {object} data - 저장할 AI 결과 객체.
 */
export function saveAiResult(data) {
    // [방어적 코딩] 저장할 데이터가 유효하지 않으면(null 또는 undefined), 아무 작업도 하지 않고 함수를 즉시 종료합니다.
    if (!data) return;

    // localStorage는 제한된 용량을 가지며, 드물게 JSON 변환에 실패할 수 있으므로 try...catch로 예외 상황을 안전하게 처리합니다.
    try {
        // JavaScript 객체는 로컬 스토리지에 직접 저장할 수 없으므로, JSON 문자열 형태로 변환합니다.
        const jsonString = JSON.stringify(data);
        // 상수로 관리되는 키를 사용하여 로컬 스토리지에 데이터를 저장합니다.
        localStorage.setItem(STORAGE_KEY, jsonString);
    } catch (e) {
        // JSON 변환 또는 저장 과정에서 오류 발생 시, 개발자가 문제를 인지할 수 있도록 콘솔에 에러를 기록합니다.
        console.error("AI 결과 저장 실패:", e);
    }

    // 데이터 저장 작업이 끝난 후, '다시 보기' 버튼이 화면에 나타나도록 상태를 업데이트합니다.
    updateShowSavedResultBtnVisibility();
}

/**
 * 로컬 스토리지에서 저장된 AI 결과를 가져옵니다. 데이터가 손상된 경우 자동으로 정리합니다.
 * @returns {object|null} - 성공 시 파싱된 AI 결과 객체를, 데이터가 없거나 손상된 경우 null을 반환합니다.
 */
export function getBefitAiResult() {
    // 먼저 로컬 스토리지에서 저장된 데이터를 문자열 형태로 가져옵니다.
    const savedDataString = localStorage.getItem(STORAGE_KEY);

    // 저장된 데이터가 없으면(null), 즉시 null을 반환하여 데이터가 없음을 명확히 알립니다.
    if (!savedDataString) {
        return null;
    }

    // 저장된 문자열이 유효한 JSON 형식이 아닐 경우, JSON.parse()는 에러를 발생시킵니다.
    // 이 에러를 try...catch 구문으로 잡아내어 애플리케이션 전체가 멈추는 것을 방지합니다.
    try {
        // 가져온 JSON 문자열을 다시 사용 가능한 JavaScript 객체로 변환(파싱)하여 반환합니다.
        return JSON.parse(savedDataString);
    } catch (e) {
        // [자동 복구 로직] 데이터 파싱에 실패한 경우
        console.error("저장된 AI 결과 파싱 실패:", e);
        // 1. 손상된 데이터가 계속 문제를 일으키지 않도록 로컬 스토리지에서 해당 항목을 깨끗하게 제거합니다.
        localStorage.removeItem(STORAGE_KEY);
        // 2. 데이터가 제거되었으므로, '다시 보기' 버튼도 화면에서 사라지도록 상태를 업데이트합니다.
        updateShowSavedResultBtnVisibility();
        // 3. 데이터를 가져오는 데 실패했으므로 최종적으로 null을 반환합니다.
        return null;
    }
}

/**
 * 로컬 스토리지에 저장된 결과가 있는지 확인하여 '다시 보기' 버튼의 표시 여부를 결정합니다.
 * 이 함수는 페이지 로드 시, 그리고 데이터가 저장되거나 삭제될 때 호출됩니다.
 */
export function updateShowSavedResultBtnVisibility() {
    // [방어적 코딩] 페이지에 '다시 보기' 버튼이 실제로 존재하는지 먼저 확인하여, 오류를 방지합니다.
    if (DOM.showSavedResultBtn) {
        // '!!' 연산자: localStorage.getItem의 반환값(데이터 문자열 또는 null)을 true 또는 false의 명확한 boolean 값으로 변환합니다.
        const hasResult = !!localStorage.getItem(STORAGE_KEY);
        // 삼항 연산자: hasResult 값에 따라 버튼의 display 스타일을 'inline-block'(보이게) 또는 'none'(숨기게)으로 설정합니다.
        DOM.showSavedResultBtn.style.display = hasResult ? 'inline-block' : 'none';
    }
}