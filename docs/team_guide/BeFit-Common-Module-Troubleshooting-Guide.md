# BeFit: 공용 모듈의 `null` 참조 및 렌더링 순서 문제 트러블슈팅 가이드

본 문서는 BeFit 프로젝트의 여러 페이지에서 공용으로 사용되는 `main.js` 파일에서 발생한 두 가지 주요 문제, **(A) `null` 참조 오류**와 **(B) 로컬 스토리지 상태 불일치**의 원인 및 해결 과정을 공식적으로 정리한 기술 문서입니다.

**작성자:** [왕택준](https://github.com/TJK98)

**작성일:** 2025년 7월 7일

---

## 1. 문제 현상

### A. `Null` 참조 오류

-   **에러 메시지 및 에러 콜 스택**:
    ```
    main.js:14 Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
        at main.js:14:10
    ```

-   **발생 배경**:
    여러 페이지에 공통 UI(헤더 메뉴, 면책 조항 모달 등)를 적용하고, 이들의 동작을 제어하는 `main.js`를 공용으로 사용했습니다.

-   **상세 설명**:
    위 에러 로그는 `main.js` 파일의 14번째 줄에서 발생했습니다. 이는 메인 페이지(`index.html`)에만 존재하는 특정 DOM 요소(예: 면책 조항 모달의 버튼)에 `addEventListener`를 추가하려다, 해당 요소가 없는 다른 페이지(예: `playlist.html`)에서는 탐색 결과가 `null`이 되어 발생한 문제입니다. 이로 인해 해당 페이지에서 모든 JavaScript 실행이 중단되었습니다.

### B. 로컬 스토리지 상태 불일치 문제

-   **현상**:
    면책 조항에 동의하면 `localStorage`에 `disclaimerAgreed: "true"` 값이 정상적으로 저장되었습니다. 하지만, 동의 기록이 있음에도 불구하고 페이지를 다시 방문하면 **모달이 숨겨지지 않고 항상 다시 나타나는 문제**가 발생했습니다.
-   **발생 조건**:
    `localStorage`에 동의 기록이 있는 상태에서, `index.html` 페이지가 로드될 때 발생.

---

## 2. 원인 분석

두 문제 모두 **JavaScript의 실행 시점과 DOM의 상태 및 렌더링 순서** 간의 불일치에서 비롯되었습니다.

1.  **`Null` 참조 오류의 원인 (DOM 요소 부재)**:
    -   특정 페이지에 존재하지 않는 DOM 요소를 JavaScript가 참조하려고 시도한 것이 직접적인 원인입니다. 공용 스크립트가 다양한 DOM 구조를 가진 여러 페이지에서 실행될 가능성을 고려하지 못했습니다.

2.  **상태 불일치 문제의 원인 (렌더링 순서)**:
    -   JavaScript가 로컬 스토리지 값을 확인하여 모달을 숨기는 로직을 실행하기 **전에**, 이미 브라우저가 CSS 규칙에 따라 모달을 화면에 렌더링해버렸기 때문입니다.
    -   뒤늦게 실행된 JavaScript의 스타일 변경 명령이, 이미 렌더링된 요소에 제대로 적용되지 않거나 덮어쓰지 못하여 문제가 발생했습니다.

---

## 3. 해결 과정 및 최종 코드

두 문제를 모두 해결하기 위해, **"실행 조건을 먼저 확인하고, 안전할 때만 동작시킨다"**는 방어적인 코딩 원칙을 적용했습니다. 모든 로직은 `DOMContentLoaded` 이벤트 리스너 내부에 배치하여, HTML 문서 구조(DOM)가 완전히 로드되고 파싱된 후에 스크립트가 안전하게 실행되도록 보장했습니다.

```javascript
// main.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. 제어 대상 DOM 요소들을 먼저 찾습니다.
    const agreeCheckbox = document.getElementById("agree-checkbox");
    const continueBtn = document.getElementById("continue-btn");
    const disclaimerModal = document.querySelector(".disclaimer-modal");

    // 2. [해결책 A] Guard Clause: 모든 관련 요소가 존재하는 페이지에서만 실행
    //    이 조건문 덕분에 모달이 없는 페이지에서는 'null 참조 오류'가 발생하지 않습니다.
    if (agreeCheckbox && continueBtn && disclaimerModal) {

        // 3. [해결책 B] 선-숨김 처리: JS 실행 즉시 모달을 강제로 숨겨 렌더링 문제 해결
        disclaimerModal.style.display = 'none';

        const isAgreed = localStorage.getItem("disclaimerAgreed");

        // 4. 상태 확인 후 조건부 노출: 동의 기록이 없을 때만 모달을 다시 보여줍니다.
        if (isAgreed !== "true") {
            disclaimerModal.style.display = 'flex';
        }
        
        // --- 이하 이벤트 리스너 로직 ---
        agreeCheckbox.addEventListener("change", () => {
            continueBtn.disabled = !agreeCheckbox.checked;
            continueBtn.classList.toggle("active", agreeCheckbox.checked);
        });

        continueBtn.addEventListener("click", () => {
            localStorage.setItem("disclaimerAgreed", "true");
            disclaimerModal.style.display = "none";
        });
    }
});
```

- **해결책 A (Guard Clause):** `if (agreeCheckbox && continueBtn && disclaimerModal)` 조건문을 통해, 제어하려는 모든 DOM 요소가 존재하는 것이 확인된 페이지에서만 관련 코드가 실행되도록 하여 `null` 참조 오류를 원천 차단했습니다.
- **해결책 B (선-숨김, 후-판단):** 스크립트 실행 진입점에서 `disclaimerModal.style.display = 'none'`을 먼저 실행하여 CSS 렌더링 상태와 무관하게 모달을 숨기고, 그 후에 `localStorage` 상태에 따라 노출 여부를 결정하도록 로직을 개선했습니다.

---

### 4. 결론 및 배운 점

- **문제**: 공용 JavaScript 모듈은 서로 다른 DOM 구조와 렌더링 시점 차이로 인해 `null` 참조 오류나 상태 불일치 같은 예기치 않은 문제를 일으킬 수 있습니다.
- **해결**: **Guard Clause 패턴**으로 코드 실행의 안정성을 확보하고, **JavaScript로 초기 스타일을 제어**하여 렌더링 문제를 해결하는 방어적인 코딩(Defensive Coding)이 중요합니다.
- **배운 점**: 이번 트러블슈팅을 통해, 단순히 기능을 구현하는 것을 넘어 **다양한 실행 환경과 브라우저의 렌더링 라이프사이클을 고려**하는 것이 안정적인 웹 애플리케이션 개발에 필수적임을 깨달았습니다.

> 본 문서는 공용 JavaScript 모듈의 안정성과 사용자 경험을 동시에 개선한 트러블슈팅 사례를 기록한 기술 문서입니다.