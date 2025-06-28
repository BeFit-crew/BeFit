// /src/befit-ai/modules/dom-befit-ai.js

/**
 * @file BeFit AI 기능에서 사용하는 모든 DOM(Document Object Model) 요소들을 관리하는 모듈입니다.
 * @description 이 파일의 목적은 HTML 문서에서 필요한 모든 요소를 페이지 로딩 시점에 한 번만 조회하여,
 *              'DOM'이라는 단일 객체에 저장하고 관리합니다.
 */

// 'DOM' 객체는 애플리케이션에서 사용하는 모든 HTML 요소에 대한 참조(reference)를 담는 컨테이너입니다.
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

    targetWeight: document.getElementById('targetWeight-befit-ai'),
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

// 이 'DOM' 객체를 모듈의 기본(default) 내보내기 대상으로 지정합니다.
export default DOM;