// 최고점일 때 confetti 나오는지 테스트용
// localStorage.setItem('totalRound', '3');
// localStorage.setItem('finalScore', '60');
// localStorage.setItem('totalRound', '5');
// localStorage.setItem('finalScore', '100');
// localStorage.setItem('totalRound', '10');
// localStorage.setItem('finalScore', '200');


$(document).ready(function () {
	const $totalScoreElem = $('#total-score');
	const $maxScoreElem = $('#max-score');
	const $nicknameInput = $('#nickname-input');	// 닉네임 입력 input 요소
	const $nicknamePopup = $('#nickname-popup');	// 닉네임 입력 팝업
	const $saveNicknameBtn = $('#save-nickname-btn');	// 닉네임 저장 버튼

	// 게임 상태 변수
	const totalRound = parseInt(localStorage.getItem('totalRound'));
	const totalScore = parseInt(localStorage.getItem('finalScore'));

	// 난이도별 최고 점수 지정
	let MaxScore;
	switch (totalRound) {
		case 3: MaxScore = 60; break;
		case 5: MaxScore = 100; break;
		case 10: MaxScore = 200; break;
		default: console.log('[에러] 최고 점수를 계산할 수 없습니다.');
	}

	// 최종 점수 표시
	$totalScoreElem.text(totalScore);
	// 최고 점수 표시
	$maxScoreElem.text(MaxScore);

	// 최고점인 경우 컨페티 효과 표시 (canvas confetti)
	if (totalScore === 60 && MaxScore === 60) {
		launchConfettiStars();
	}
	else if (totalScore === 100 && MaxScore === 100) {
		launchConfettiRealistic();
	}
	else if (totalScore === 200 && MaxScore === 200) {
		launchConfettiFireworks();
	}

	function launchConfettiStars() {
		var defaults = {
			spread: 360,
			ticks: 50,
			gravity: 0,
			decay: 0.94,
			startVelocity: 30,
			colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8']
		};

		function shoot() {
			confetti({
				...defaults,
				particleCount: 40,
				scalar: 1.2,
				shapes: ['star']
			});

			confetti({
				...defaults,
				particleCount: 10,
				scalar: 0.75,
				shapes: ['circle']
			});
		}

		setTimeout(shoot, 0);
		setTimeout(shoot, 100);
		setTimeout(shoot, 200);
	}

	function launchConfettiRealistic() {
		var count = 200;
		var defaults = {
			origin: { y: 0.7 }
		};

		function fire(particleRatio, opts) {
			confetti({
				...defaults,
				...opts,
				particleCount: Math.floor(count * particleRatio)
			});
		}

		fire(0.25, {
			spread: 26,
			startVelocity: 55,
		});
		fire(0.2, {
			spread: 60,
		});
		fire(0.35, {
			spread: 100,
			decay: 0.91,
			scalar: 0.8
		});
		fire(0.1, {
			spread: 120,
			startVelocity: 25,
			decay: 0.92,
			scalar: 1.2
		});
		fire(0.1, {
			spread: 120,
			startVelocity: 45,
		});
	}

	function launchConfettiFireworks() {
		var duration = 15 * 1000;
		var animationEnd = Date.now() + duration;
		var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

		function randomInRange(min, max) {
			return Math.random() * (max - min) + min;
		}

		var interval = setInterval(function() {
			var timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			var particleCount = 50 * (timeLeft / duration);
			// since particles fall down, start a bit higher than random
			confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
			confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
		}, 250);
	}
});
