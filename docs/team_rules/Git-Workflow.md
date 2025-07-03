# Git 브랜치 및 워크플로우 규칙

> [↩ 전체 규칙으로 돌아가기](BeFit-Team-Rules.md)

본 문서는 Git을 사용한 브랜치 관리, 작업 흐름, 커밋 메시지 작성 규칙을 정의합니다.

작성자: [왕택준](https://github.com/TJK98)

---

## 1. 브랜치 전략 및 구조

### 브랜치 종류

| 브랜치         | 용도                                            |
| ----------- | --------------------------------------------- |
| `main`      | 최종 결과물 (직접 작업 금지, 배포용으로만 사용)                  |
| `dev`       | 통합 개발 브랜치 (모든 기능 브랜치는 여기로 PR)                 |
| `feature/*` | 개인 기능 개발 브랜치 (ex. `feature/login`, `feature/map`) |

- GitHub의 **기본 브랜치**는 `dev`로 설정합니다.
- 모든 기능 개발은 `feature/*` 브랜치에서 시작합니다.

### 브랜치 보호 규칙

| 브랜치    | 보호 설정              | 내용                     |
| ------ | ------------------ | ---------------------- |
| `main` | main-protection 적용 | 직접 커밋/삭제 금지, PR만 병합 허용 |
| `dev`  | dev-protection 적용  | 직접 커밋 금지, PR 리뷰 후 병합   |

---

## 2. 기능 개발 브랜치 작업 흐름

1.  **로컬에 최신 `dev` 브랜치 가져오기:**
    ```bash
    git fetch origin
    git switch dev
    git pull origin dev
    ```

2.  **`dev`에서 새로운 기능 브랜치 생성 및 이동:**
    ```bash
    # 예시: 로그인 기능 개발
    git switch -c feature/login
    ```

3.  **작업 및 커밋 수행 후 원격 저장소에 푸시:**
    ```bash
    # ... 작업 후 ...
    git add .
    git commit -m "feat: 로그인 기능 구현"
    git push origin feature/login
    ```

4.  **GitHub에서 `feature/login → dev`로 PR 생성 및 리뷰 진행**

5.  **병합 완료 후 기능 브랜치 삭제:**
    ```bash
    # 로컬 브랜치 삭제 (dev로 이동 후)
    git switch dev
    git branch -d feature/login

    # 원격 브랜치 삭제
    git push origin --delete feature/login
    ```

---

## 3. 커밋 메시지 규칙

### 형식: `<타입>: <변경 요약>`

| 타입         | 설명              |
| ---------- | --------------- |
| `feat`     | 새로운 기능 추가       |
| `fix`      | 버그 수정           |
| `refactor` | 리팩토링 (기능 변화 없음) |
| `style`    | 코드 스타일 수정       |
| `docs`     | 문서 변경           |
| `chore`    | 설정/빌드 변경        |
| `test`     | 테스트 코드 관련 변경    |

### 예시
```bash
feat: 로그인 기능 추가
fix: 지도 마커 좌표 오류 수정
docs: 팀 협업 규칙 문서 분리
```