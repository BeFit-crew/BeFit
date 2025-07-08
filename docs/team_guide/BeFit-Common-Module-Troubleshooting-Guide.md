# main.js 공통 모듈의 `null` 참조 및 렌더링 순서 문제 트러블슈팅 가이드

본 문서는 BeFit 프로젝트의 여러 페이지에서 공용으로 사용되는 `main.js` 파일에서 발생한 두 가지 주요 문제, **(A) `null` 참조 오류**와 **(B) 로컬 스토리지 상태 불일치**의 원인 및 해결 과정을 정리한 기술 문서입니다.

**작성자:** [왕택준](https://github.com/TJK98)

**작성일:** 2025년 7월 7일

---

## 1. 문제 현상

### A. `null` 참조 오류

-   **에러 메시지**:
    `Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')`

-   **에러 콜 스택**:
```
    at main.js:14:10
```

-   **발생 페이지**: **`index.html`을 제외한 모든 페이지** (`befit-ai.html`, `playlist.html`, `shopping.html`)

-   **상세 설명**: 공용 스크립트인 `main.js`에는 `index.html`에만 존재하는 면책 조항 모달 관련 요소(버튼, 체크박스 등)를 제어하는 코드가 포함되어 있습니다. **모달이 없는 다른 페이지**에서 이 스크립트가 실행될 때, `document.getElementById(...)`의 결과가 `null`이 되어 위와 같은 `TypeError`가 발생했고, 이로 인해 해당 페이지의 모든 JavaScript 실행이 중단되었습니다.

### B. 로컬 스토리지 상태 불일치

-   **현상**: 면책 조항에 이미 동의하여 `localStorage`에 `disclaimerAgreed: "true"` 값이 저장되었음에도 불구하고, 페이지를 다시 방문하면 **모달이 숨겨지지 않고 항상 다시 나타나는 문제**가 발생했습니다.

-   **발생 페이지**: **`index.html` (모달이 존재하는 메인 페이지)**

-   **상세 설명**: JavaScript의 상태 확인 로직보다 브라우저의 CSS 렌더링이 먼저 일어나면서 발생한 **논리적 오류**입니다. 로컬 스토리지의 값을 확인하여 모달을 숨기는 코드가 실행되기 전에, 이미 CSS에 의해 모달이 화면에 그려져 버려 문제가 발생했습니다.

---

## 2. 원인 분석

두 문제 모두 **JavaScript의 실행 시점과 DOM의 상태 및 렌더링 순서** 간의 불일치에서 비롯되었습니다.

1.  **`null` 참조 오류의 원인 (DOM 요소 부재)**:
    -   특정 페이지에 존재하지 않는 DOM 요소를 JavaScript가 참조하려고 시도한 것이 직접적인 원인입니다. 공용 스크립트가 다양한 DOM 구조를 가진 여러 페이지에서 실행될 가능성을 고려하지 못했습니다.

2.  **상태 불일치 문제의 원인 (렌더링 순서)**:
    -   JavaScript가 로컬 스토리지 값을 확인하여 모달을 숨기는 로직을 실행하기 **전에**, 이미 브라우저가 CSS 규칙에 따라 모달을 화면에 렌더링해버렸기 때문입니다.
    -   뒤늦게 실행된 JavaScript의 스타일 변경 명령이, 이미 렌더링된 요소에 제대로 적용되지 않거나 덮어쓰지 못하여 문제가 발생했습니다.

---

## 3. 해결 과정

### 3-1. 비효율적인 접근 방식

- 각 기능마다 `if (element)` 조건문을 추가하는 방법도 있지만, 이는 코드의 가독성과 유지보수성을 떨어뜨립니다.
- CSS에 `display: none !important;`를 사용하는 방식은 **JS가 비활성화된 경우 면책 동의 UI가 아예 안 보이는 문제**를 유발해 접근성 문제가 있습니다.
- 초기에는 **JavaScript 실행 직후에 `disclaimerModal.style.display = "none"`으로 숨기고, 조건에 따라 다시 `display = "flex"`로 보여주는 방식**을 사용했습니다.  
  하지만 이 방식은 **스크립트가 실행되기 전에 브라우저가 모달을 잠깐 렌더링해버리기 때문에**, 사용자가 볼 수 있는 깜빡임(FOUC, Flash of Unstyled Content)이 발생했습니다.

### 3-2. 최종 해결책: 방어적 초기화 + 조건부 표시 방식 적용

- "실행 조건을 먼저 확인하고, 안전할 때만 동작시킨다"는 방어적인 코딩 원칙을 적용했습니다.
- CSS에서 기본적으로 `.disclaimer-modal { display: none; }`를 설정**하여, 페이지 로딩 시 모달이 깜빡이지 않도록 초기 상태를 숨김으로 지정했습니다.
- JavaScript는 **`localStorage` 확인 후 조건이 맞을 때만 `display: flex`로 보여주는 방식**으로 변경하여, 깜빡임 없이 안정적으로 표시됩니다.

```css
/* main.css */

/* 면책 모달*/
.disclaimer-modal {
    display: none; /* 초기 숨김 처리 추가 */
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    position: fixed;
    top: 0;
    left: 0;
    justify-content: center;
    align-items: center;
    z-index: 99999;
}
```


```javascript
// main.js

document.addEventListener("DOMContentLoaded", () => {
    const agreeCheckbox = document.getElementById("agree-checkbox");
    const continueBtn = document.getElementById("continue-btn");
    const disclaimerModal = document.querySelector(".disclaimer-modal");

    // Guard Clause: 필수 요소가 모두 존재할 때만 실행
    if (agreeCheckbox && continueBtn && disclaimerModal) {
        const isAgreed = localStorage.getItem("disclaimerAgreed");

        // 조건 만족 시만 모달 표시 (기본은 CSS에서 숨김)
        if (isAgreed !== "true") {
            disclaimerModal.style.display = "flex";
        }

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

- **해결책 A (`null` 참조 방지)**:  
  `if (agreeCheckbox && continueBtn && disclaimerModal)` 조건문을 통해, 모든 필수 DOM 요소가 존재할 때만 로직이 실행되도록 하여 `null` 참조 오류를 해결했습니다.

- **해결책 B (FOUC 방지)**:  
  모달의 초기 상태를 CSS에서 `display: none`으로 지정하고, `localStorage` 상태를 확인하여 필요할 때만 JS가 `display: flex`로 변경하는 방식으로 렌더링 순서 문제를 해결했습니다.

---

### 4. 결론 및 배운 점

- **문제**: 공용 JavaScript 모듈은 서로 다른 DOM 구조와 렌더링 시점 차이로 인해 `null` 참조 오류나 상태 불일치 같은 예기치 않은 문제를 일으킬 수 있습니다.
- **해결**: **Guard Clause 패턴**으로 코드 실행의 안정성을 확보하고, **CSS로 초기 상태를 제어하고 JS는 조건부로만 동작**하게 만들어 렌더링 문제를 해결했습니다.
- **배운 점**: 이번 트러블슈팅을 통해, 단순히 기능을 구현하는 것을 넘어 **다양한 실행 환경과 브라우저의 렌더링 라이프사이클을 고려**하는 것이 안정적인 웹 애플리케이션 개발에 필수적임을 깨달았습니다.

> 본 문서는 렌더링 순서와 DOM 조건에 따라 발생하는 공용 JavaScript 모듈의 실행 오류 및 UI 깜빡임을 해결한 트러블슈팅 사례입니다.