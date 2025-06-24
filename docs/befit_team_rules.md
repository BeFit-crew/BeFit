# 팀 프로젝트 - GitHub 협업 규칙 정리

이 문서는 GitHub 기반으로 팀 프로젝트를 원활하게 협업하기 위한 규칙을 정리한 것입니다.

---

## 1. 네이밍 규칙

### 개인 작업 식별용 네이밍

각자 작성한 HTML 요소나 CSS 클래스, JS 함수/변수에서 충돌을 방지하고 소스 파악을 쉽게 하기 위해, 이름 뒤에 이니셜 또는 페이지명을 하이픈(-)으로 구분하여 덧붙입니다.

#### 예시

| 항목     | 규칙 예시                             |
|--------|------------------------------------|
| ID     | `id="form-tj"`, `id="input-da"`    |
| class  | `class="btn-hs"`, `class="section-login"` |
| JS 함수 | `function handleSubmitTj()`         |
| 변수명   | `const userInputDj = ...`            |

**이니셜 예시**:
- `tj` (택준), befit-ai
- `da` (다영), playlist
- `hs` (현수), infermedica
- `dj` (동준), shopping

---

## 2. 브랜치 전략 및 구조

### 브랜치 종류

| 브랜치         | 용도                                            |
| ----------- | --------------------------------------------- |
| `main`      | 최종 결과물 (직접 작업 금지, 배포용으로만 사용)                  |
| `dev`       | 통합 개발 브랜치 (모든 기능 브랜치는 여기로 PR)                 |
| `feature/*` | 개인 기능 개발 브랜치 (ex. feature/login, feature/map) |

### 규칙 요약

* GitHub의 **기본 브랜치**는 `dev`로 설정
* `main`은 직접 커밋하지 않고, `dev`를 통해 병합
* 모든 기능 개발은 `feature/*` 브랜치에서 시작
* PR은 `feature/*` → `dev`, 이후 `dev` → `main`으로 진행

---

## 3. 기능 개발 브랜치 작업 흐름

### 작업 흐름 요약

1. 로컬에 `origin/dev`를 받는다:

   ```bash
   git fetch origin
   git switch -c dev origin/dev
   ```

2. `dev`에서 새 브랜치 생성:

   ```bash
   git switch dev
   git switch -c feature/login
   ```

3. 작업 및 커밋 수행 후 원격 푸시:

   ```bash
   git push origin feature/login
   ```

4. GitHub에서 `feature/login → dev`로 PR 생성 및 리뷰

5. 병합 후 **기능 브랜치 삭제**:

   ```bash
   git branch -d feature/login           # 로컬 삭제
   git push origin --delete feature/login # 원격 삭제
   ```

6. 새로운 작업 시작 시 동일한 이름으로 브랜치 재생성 가능

---

## 4. 커밋 메시지 규칙

### 형식

```bash
<타입>: <변경 요약>
```

### 타입 예시

| 타입         | 설명              |
| ---------- | --------------- |
| `feat`     | 새로운 기능 추가       |
| `fix`      | 버그 수정           |
| `refactor` | 리팩토링 (기능 변화 없음) |
| `style`    | 코드 스타일 수정       |
| `docs`     | 문서 변경           |
| `chore`    | 설정/빌드 변경        |
| `test`     | 테스트 코드 관련 변경    |

### 커밋 메시지 예시

```bash
feat: 로그인 기능 추가
fix: 지도 마커 좌표 오류 수정
refactor: 추천 알고리즘 함수 분리
style: 들여쓰기 및 세미콜론 정리
```

---

## 5. PR(Pull Request) 작성 및 리뷰 규칙

### 제목 형식

```
[기능] 로그인 구현
[버그수정] 마커 오류 수정
[리팩토링] 함수 분리
```

### 템플릿 예시

```markdown
## 작업 내용 요약
- 무엇을 구현/수정했는지 요약

## 상세 구현 내용
- 구체적 변경 내용 설명

## 관련 이슈
- #이슈번호

## 기타
- 리뷰 참고 사항
```

### 리뷰 규칙 요약

| 항목          | 내용                   |
| ----------- | -------------------- |
| 리뷰 인원       | 최소 1명 이상 팀원의 승인 필요   |
| 자기 PR 병합 금지 | 본인이 작성한 PR은 직접 머지 금지 |

### 리뷰 예시

**승인**:

```
LGTM! 정상 작동 확인했습니다.
```

**수정 요청**:

```
[수정 요청] 하드코딩된 userId를 props로 전달하는 게 좋겠습니다.
```

---

## 6. 브랜치 병합 규칙

| 대상          | 병합 방향    | 병합 방식           |
| ----------- | -------- | --------------- |
| `feature/*` | → `dev`  | PR 후 리뷰 승인 시 병합 |
| `dev`       | → `main` | 최종 검토 후 병합      |

* `main` 병합 전에는 항상 모든 기능이 `dev`에 통합된 상태여야 함
* 발표 또는 배포 시점에만 `main`을 갱신

---

## 7. 이슈 관리 규칙

### 이슈 템플릿

```markdown
## 📌 제목
[기능] 로그인 페이지 구현

## 📝 설명
- 작업 배경 및 목표

## ✅ 작업 내용
- [ ] 레이아웃 구성
- [ ] 스타일 적용
- [ ] 반응형 설정

## 🔗 참고 자료
- Figma 링크, 관련 문서 등
```

---

## 8. 디렉토리 구조 예시
```
BeFit/
├── .gitignore
├── index.html                   # 메인 페이지
├── README.md                    # 프로젝트 소개 문서
│
├── assets/                      # 공통 리소스
│   ├── css/
│   │   ├── common.css
│   │   ├── main.css
│   │   └── reset.css
│   ├── img/
│   │   ├── be-fit-favicon.png
│   │   └── be-fit-logo.png
│   └── js/
│       ├── config.js
│       └── main.js
│
├── docs/                        # 문서 자료
│   └── befit_team_rules.md
│
├── src/                         # 개별 기능별 페이지
│   ├── befit-ai/
│   │   ├── befit-ai.css
│   │   ├── befit-ai.html
│   │   ├── befit-ai.js
│   │   └── img/
│   │       └── .gitkeep
│   │
│   ├── infermedica/
│   │   ├── infermedica.css
│   │   ├── infermedica.html
│   │   ├── infermedica.js
│   │   └── img/
│   │       └── .gitkeep
│   │
│   ├── playlist/
│   │   ├── playlist.css
│   │   ├── playlist.html
│   │   └── playlist.js
│   │
│   └── shopping/
│       ├── shopping.css
│       ├── shopping.html
│       ├── shopping.js
│       └── img/
│           └── .gitkeep

```

---

## 9. 브랜치 보호 규칙 요약

| 브랜치    | 보호 설정              | 내용                     |
| ------ | ------------------ | ---------------------- |
| `main` | main-protection 적용 | 직접 커밋/삭제 금지, PR만 병합 허용 |
| `dev`  | dev-protection 적용  | 직접 커밋 금지, PR 리뷰 후 병합   |

* 병합은 항상 PR을 통해 진행
* GitHub에서 PR 없이 직접 푸시하는 행동은 방지됨

---

## 10. 협업 규칙 요약

| 항목        | 규칙 설명                                   |
| --------- | --------------------------------------- |
| 커밋 단위     | 기능 하나당 하나의 의미 있는 커밋 작성                  |
| 커밋 빈도     | 하루 1~2회 이상 커밋 권장                        |
| 코드 리뷰     | 팀원 1인 이상 승인 필요                          |
| 민감 정보 관리  | `.env`, `config.js`는 `.gitignore`로 커밋 제외 |
| 브랜치 반복 사용 | 병합 후 브랜치를 삭제하고, 동일한 이름으로 새 작업 시 재생성 가능  |
