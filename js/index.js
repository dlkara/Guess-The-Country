$(document).ready(function () {
	const $lightBtn = $('#light, #light-pc');
	const $darkBtn = $('#dark, #dark-pc');
	const $levelBtn = $('#level');
	const $popup = $('#levelPopup');
	const $closeBtn = $('#closePopup');
	const $options = $('.level-option');

	// 저장된 모드 불러오기 (기본값 : 라이트 모드)
	const savedMode = localStorage.getItem('dark-mode') || 'light';

	// 모드 적용 함수
	function applyMode(mode) {
		if (mode === 'dark') {
			$('body').addClass('dark-mode');
			$lightBtn.hide();
			$darkBtn.show();

		} else {
			$('body').removeClass('dark-mode');
			$darkBtn.hide();
			$lightBtn.show();

		}
		localStorage.setItem('dark-mode', mode);
	}

	// 초기 모드 적용
	applyMode(savedMode);

	// 버튼 클릭 시 모드 전환
	$lightBtn.on('click', () => applyMode('dark'));
	$darkBtn.on('click', () => applyMode('light'));


	// 상단 메뉴 토글
	// 상단 메뉴 토글 (jQuery 이벤트 핸들러)
	$('.icon').on('click', function () {
		$('#myLinks').toggle();
	});


	// 난이도 팝업 열기
	$levelBtn.on('click', () => {
		$popup.removeClass('hidden');
	});

	// 난이도 팝업 닫기
	$closeBtn.on('click', () => {
		$popup.addClass('hidden');
	});

	// 난이도 선택 처리
	$options.on('click', function () {
		const level = $(this).data('level');
		$levelBtn.text(level);
		$popup.addClass('hidden');

		switch (level) {
			case '초보':
				localStorage.setItem('totalRound', '3');
				localStorage.setItem('quizType', 'region');
				break;
			case '쉬움':
				localStorage.setItem('totalRound', '3');
				localStorage.setItem('quizType', 'country');
				break;
			case '보통':
				localStorage.setItem('totalRound', '5');
				localStorage.setItem('quizType', 'country');
				break;
			case '어려움':
				localStorage.setItem('totalRound', '10');
				localStorage.setItem('quizType', 'country');
				break;
			default:
				localStorage.setItem('totalRound', '5');
				localStorage.setItem('quizType', 'country');
		}
	});
});