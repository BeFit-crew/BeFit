/* index.html의 js 입니다. */

// 우상단 토글 버튼 클릭
const $asideToggleBtnMain = document.querySelector('.aside-toggle-btn-main');
const $asideWrapperMain = document.querySelector('.aside-wrapper-main');

$asideToggleBtnMain.addEventListener('click', function () {
    $asideWrapperMain.classList.toggle('open');
});

function loadModalHtmlHs() {
    fetch("../../src/infermedica/infermedica.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("beforeend", html);
            setupModalEventsHs();
        });
}



