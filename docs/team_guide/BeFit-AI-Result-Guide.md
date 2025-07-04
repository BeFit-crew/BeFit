# AI 분석 결과 공유 및 활용 가이드

본 문서는 `befit-ai` 프로젝트의 AI 분석 결과 데이터를 **모던 자바스크립트(ES 모듈) 방식(import/export)**으로 다른 페이지에서 안전하게 활용하는 방법을 안내합니다.

작성자: [왕택준](https://github.com/TJK98)

---

## 핵심 원리 (모듈화 구조)

ES 모듈 시스템을 활용하면, 변수나 함수를 필요한 파일 간에 안전하게 주고받을 수 있습니다.

1. **데이터 생산**: AI 분석 페이지에서 결과를 생성하면, 브라우저의 `localStorage`에 해당 데이터를 저장합니다.
2. **함수 정의**: `storage-befit-ai.js` 모듈에서 localStorage에 접근하는 `getBefitAiResult()` 함수가 정의되어 있습니다.
3. **함수 재수출**: 메인 모듈인 `befit-ai.js`는 위의 함수를 import하여 다시 export(재수출)합니다.
4. **함수 사용**: 다른 페이지에서 해당 함수를 import하여 데이터를 활용할 수 있습니다.

> **[참고] 재수출 방식을 사용하는 이유**
>
> 팀원들이 내부 폴더 구조나 파일 이름 변경에 신경 쓰지 않아도 되도록, 대표 엔트리 파일(`befit-ai.js`)만 알면 일관되게 함수를 사용할 수 있습니다.  
> 이는 모듈화의 핵심 원칙인 **캡슐화(encapsulation)**를 지키기 위함입니다.

---

## 활용 전 체크리스트

- **AI 분석 선실행**: 데이터를 활용하려면 먼저 AI 분석 페이지(`befit-ai.html`)에서 한 번 이상 분석을 실행해야 합니다. (동일 브라우저 내)
- **import 경로 확인**: `import { ... } from '.../befit-ai.js'` 코드에서 경로는 자신의 JS 파일 위치에 맞게 정확히 입력해야 합니다.
- **모듈 타입 설정**: JS 파일을 불러오는 `<script>` 태그에는 반드시 `type="module"` 속성을 추가해야 합니다.

---

## 데이터 생산자(AI 분석 페이지 담당자 : 왕택준) 안내

AI 분석 페이지 담당 개발자는 아래 구조를 참고하여 코드를 유지·관리합니다.

### 1. 데이터 함수 정의 (`storage-befit-ai.js`)

```javascript
// /src/befit-ai/modules/storage-befit-ai.js

/**
 * [실제 함수] localStorage에서 AI 결과를 가져오는 함수입니다.
 */
export function getBefitAiResult() {
    // ... 함수 내용 ...
}
```

### 2. 함수 재수출 (`befit-ai.js`)

```javascript
// /src/befit-ai/befit-ai.js

// storage-befit-ai.js의 함수를 그대로 export하여 외부에서 사용할 수 있게 합니다.
export { getBefitAiResult } from './modules/storage-befit-ai.js';
```

---

## 데이터 소비자(활용 페이지 개발자 : 김다영, 박현수, 신동준) 가이드

AI 분석 데이터를 본인의 페이지에서 사용하고자 하는 팀원은 아래 절차를 따릅니다.

### 1. HTML에 스크립트 추가

HTML 파일의 `<head>` 또는 `<body>` 하단에 아래와 같이 스크립트를 삽입합니다.

```html
<!-- 예시: team-member-page.html -->

<head>
    <!-- ... 기타 head 요소 ... -->
    <script type="module" src="자신의/js/파일.js"></script>
</head>
<body>
    <h1>AI 데이터 활용 페이지</h1>
    <div id="result-display"></div>
    <!-- ... 페이지 내용 ... -->
</body>
```

> **유의:** 반드시 `type="module"`을 추가해야 import/export 구문이 동작합니다.

### 2. JS 파일에서 함수 import 및 활용

```javascript
// 자신의/js/파일.js (경로는 프로젝트 구조에 맞게 조정)
import { getBefitAiResult } from '../../src/befit-ai/befit-ai.js';

// DOM 로드 후 실행
document.addEventListener('DOMContentLoaded', () => {

    // AI 결과 데이터 가져오기
    const aiData = getBefitAiResult();

    // 데이터가 있을 경우 렌더링 예시
    if (aiData) {
        const user = aiData.user;
        const firstDayTraining = aiData.training[0];

        document.querySelector('h1').textContent = `${user.age}세 ${user.gender} 사용자를 위한 분석 결과`;
        document.getElementById('result-display').innerHTML = `
            <h3>${firstDayTraining.day}일차 운동 루틴</h3>
            <ul>
                ${firstDayTraining.routine.map(ex => `<li>${ex.part} - ${ex.exercise}: ${ex.set}</li>`).join('')}
            </ul>
        `;
    } else {
        // 데이터 미존재 시 안내
        document.querySelector('h1').textContent = "저장된 AI 결과가 없습니다.";
    }
});
```

---

## 추가 안내

- AI 분석 데이터는 반드시 **같은 브라우저**에서 접근해야 정상적으로 가져올 수 있습니다.
- 팀원은 내부 폴더 구조를 신경 쓸 필요 없이 `befit-ai.js`만 import하여 일관된 방식으로 데이터를 사용할 수 있습니다.
- 함수명, 파일명 등 내부 구조가 변경될 경우 공식 엔트리 파일(`befit-ai.js`)에서만 경로를 수정하면 전체 프로젝트가 자동으로 반영됩니다.

---

> 본 문서는 프로젝트 내 **AI 분석 결과 데이터의 일관된 공유와 안전한 재사용**을 목표로 작성되었습니다.