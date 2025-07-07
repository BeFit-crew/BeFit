/* index.html의 js 입니다. */

// 우상단 토글 버튼 클릭
const $asideToggleBtnMain = document.querySelector('.aside-toggle-btn-main');
const $asideWrapperMain = document.querySelector('.aside-wrapper-main');

$asideToggleBtnMain.addEventListener('click', function () {
    $asideWrapperMain.classList.toggle('open');
});

// 문서가 로드된 후 실행
document.addEventListener("DOMContentLoaded", () => {

    // 면책 조항 모달 관련 요소
    const agreeCheckbox = document.getElementById("agree-checkbox");
    const continueBtn = document.getElementById("continue-btn");
    const disclaimerModal = document.querySelector(".disclaimer-modal");

    // 필수 요소가 모두 존재할 때만 실행
    if (agreeCheckbox && continueBtn && disclaimerModal) {

        // 모달 초기 상태: 숨김
        disclaimerModal.style.display = "none";

        // 동의 기록이 없으면 모달 표시
        if (localStorage.getItem("disclaimerAgreed") !== "true") {
            disclaimerModal.style.display = "flex";
        }

        // 체크박스 상태에 따라 버튼 활성화
        agreeCheckbox.addEventListener("change", () => {
            continueBtn.disabled = !agreeCheckbox.checked;
            continueBtn.classList.toggle("active", agreeCheckbox.checked);
        });

        // '계속' 버튼 클릭 시 동의 처리 및 모달 닫기
        continueBtn.addEventListener("click", () => {
            localStorage.setItem("disclaimerAgreed", "true");
            disclaimerModal.style.display = "none";
        });
    }
});