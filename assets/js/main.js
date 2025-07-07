/* index.html의 js 입니다. */

// 우상단 토글 버튼 클릭
const $asideToggleBtnMain = document.querySelector('.aside-toggle-btn-main');
const $asideWrapperMain = document.querySelector('.aside-wrapper-main');

$asideToggleBtnMain.addEventListener('click', function () {
    $asideWrapperMain.classList.toggle('open');
});

const checkbox = document.getElementById("agree-checkbox");
const continueBtn = document.getElementById("continue-btn");

checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
        continueBtn.disabled = false;
        continueBtn.classList.add("active");
    } else {
        continueBtn.disabled = true;
        continueBtn.classList.remove("active");
    }
});

continueBtn.addEventListener("click", () => {
    // 동의한 내용이 로컬에 있다면 모달 안나오게 설정
    // localStorage.setItem("disclaimerAgreed", "true");
    document.querySelector(".disclaimer-modal").style.display = "none";
});