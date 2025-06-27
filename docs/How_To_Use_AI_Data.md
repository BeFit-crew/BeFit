# 🤖 AI 분석 결과 공유 및 활용 가이드 (모듈화 버전)

이 문서는 `befit-ai` 프로젝트의 AI 분석 결과를 다른 페이지에서 **모던 자바스크립트 방식(import/export)**으로 쉽게 가져와 사용하는 방법을 안내합니다.

## 📌 핵심 원리 (모듈화 버전)

ES 모듈 시스템을 사용하면, 변수나 함수를 필요한 파일끼리만 안전하게 주고받을 수 있습니다.

1.  **데이터 생산 (`befit-ai` 기능)**: AI 분석 페이지에서 결과가 생성되면, 브라우저의 공용 저장소(localStorage)에 데이터를 저장합니다.
2.  **함수 정의 (`storage-befit-ai.js`)**: localStorage의 데이터를 꺼내주는 `getBefitAiResult()` 함수가 **실제로 정의된 곳**은 `storage-befit-ai.js` 모듈입니다.
3.  **함수 재수출 (`befit-ai.js`)**: 기능의 메인 파일인 `befit-ai.js`는 `storage-befit-ai.js`의 함수를 가져와서, 다른 팀원들이 사용할 수 있도록 **다시 외부로 내보내주는(re-export) 창구 역할**을 합니다.
4.  **함수 수입 (팀원 JS 파일)**: 데이터를 사용하고 싶은 팀원은 `befit-ai.js`라는 **공식적인 창구**를 통해 `getBefitAiResult()` 함수를 `import`하여 사용합니다.

> **[참고] 왜 '재수출' 방식을 사용하나요?**
>
> 다른 팀원들이 우리 기능의 복잡한 내부 폴더 구조(`modules/storage-befit-ai.js`)까지 알 필요가 없도록 하기 위함입니다. `befit-ai.js`라는 대표 파일만 알고 있으면, 내부 구조가 어떻게 바뀌든 상관없이 일관된 방법으로 함수를 가져다 쓸 수 있습니다. 이를 **'캡슐화(Encapsulation)'**라고 합니다.

## 📌 시작 전 필수 체크리스트

-   **AI 분석 실행**: 데이터를 사용하기 전에, 반드시 AI 분석 페이지(`befit-ai.html`)에 방문하여 한 번 이상 분석을 실행해야 합니다. (동일한 브라우저 기준)
-   **`import` 경로 확인**: `import { ... } from '.../befit-ai.js'` 코드에서 파일 경로를 자신의 JS 파일 위치에 맞게 정확히 수정해야 합니다.
-   **모듈 타입 설정**: JS 파일을 불러오는 `<script>` 태그에는 반드시 `type="module"` 속성을 추가해야 합니다.

---

## 🙋‍♂️ 데이터 생산자 (AI 분석 페이지 담당)

AI 분석 페이지를 담당하는 개발자는 아래 구조를 유지하면 됩니다. (현재 완료된 상태입니다)

### 📋 작업 내용

#### 1. 데이터 정의 (`storage-befit-ai.js`)

`storage-befit-ai.js` 파일에 `getBefitAiResult` 함수가 정의되고 `export` 되어 있습니다.

```javascript
// /src/befit-ai/modules/storage-befit-ai.js

/**
 * [실제 함수] 로컬 스토리지에서 AI 결과를 가져옵니다.
 */
export function getBefitAiResult() {
    // ... (함수 내용) ...
}
```

#### 2. 함수 재수출 (`befit-ai.js`)

메인 `befit-ai.js` 파일의 맨 마지막 부분에서, 위 함수를 외부에서 사용할 수 있도록 다시 `export` 해줍니다.

```javascript
// /src/befit-ai/befit-ai.js 파일의 맨 마지막 부분

// 외부(다른 JS 파일)에서 befit-ai 결과를 가져다 쓸 경우를 대비해 export
// storage-befit-ai.js 에서 가져온 함수를 그대로 다시 내보냅니다.
export { getBefitAiResult } from './modules/storage-befit-ai.js';
```

---

## 👩‍💻 데이터 소비자 (AI 데이터 활용 담당)

AI 분석 결과를 자신의 페이지에 가져와 사용해야 하는 팀원은 아래 절차를 따릅니다.

### ✅ 1. HTML 파일에 스크립트 추가하기

자신이 작업하는 HTML 파일의 `<head>` 또는 `<body>` 끝부분에 아래와 같이 스크립트를 추가합니다.

⚠️ **매우 중요**: `import`/`export`를 사용하려면 `<script>` 태그에 `type="module"` 속성을 반드시 추가해야 합니다.

```html
<!-- 예시: team-member-page.html -->

<head>
    <!-- ... 다른 head 요소들 ... -->

    <!-- [필수] 모듈 타입으로 자신의 스크립트 파일을 불러옵니다. -->
    <script type="module" src="자신의/js/파일.js"></script>
</head>

<body>
    <h1>AI 데이터 활용 페이지</h1>
    <div id="result-display"></div>
    <!-- ... 자신의 페이지 내용 ... -->
</body>
```

### ✅ 2. 자신의 JS 파일에서 데이터 사용하기

자신의 JS 파일 맨 위에서 `getBefitAiResult` 함수를 `import`하여 사용할 수 있습니다.

```javascript
// 예시: 자신의/js/파일.js

// 1. [핵심] befit-ai.js에서 export된 함수를 { } 안에 넣어 import 합니다.
// ⚠️ 자신의 JS 파일 위치에 따라 상대 경로를 정확히 조정해야 합니다.
import { getBefitAiResult } from '../../src/befit-ai/befit-ai.js'; // 경로는 예시입니다.


// 2. DOM이 완전히 로드된 후에 메인 로직을 실행합니다.
document.addEventListener('DOMContentLoaded', () => {

    console.log("팀원 페이지의 스크립트가 실행되었습니다.");

    // 3. import한 함수를 호출하여 AI 결과 객체를 가져옵니다.
    const aiData = getBefitAiResult();

    // 4. 데이터가 있는지 확인하고, 있으면 활용합니다.
    if (aiData) {
        console.log("성공적으로 가져온 AI 데이터:", aiData);

        // --- 데이터 활용 예시 ---
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
        console.log("가져올 AI 데이터가 없습니다. AI 분석 페이지를 먼저 실행해주세요.");
        document.querySelector('h1').textContent = "저장된 AI 결과가 없습니다.";
    }
});
```