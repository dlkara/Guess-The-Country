$(document).ready(function() {
	// HTML 요소 참조 (jQuery)
	const $curRoundElem = $('#current-round');
	const $totalRoundElem = $('#total-round');
	const $scoreElem = $('#score');
	const $showAnswersElem = $('#answer-list');
	const $latElem = $('#lat');
	const $lngElem = $('#lng');
	const $answerInput = $('#answer-input');
	const $answerSelect = $('#answer-select');
	const $hintDisplay = $('#hint-display');
	const $worldMapDisplay = $('#worldMap-display');
	const $worldMap = $('#worldMap-img');
	const $resultElem = $('#result');
	const $nextBtn = $('#next-question');

	// 지도 표시용 div 생성 및 삽입 (jQuery)
	const $mapContainer = $('<div>').attr('id', 'map').css({
		width: '100%',
		height: '400px',
		'margin-bottom': '10px'
	});
	$resultElem.after($mapContainer);

	// 버튼 요소 참조 (jQuery)
	const $showAnswersBtn = $('#answer-list-popup-button');
	const $hint1Btn = $('#hint1');
	const $hint2Btn = $('#hint2');
	const $hint3Btn = $('#hint3');
	const $mapBtn = $('#worldMap-btn');
	const $submitBtn = $('#submit-answer');

	// 게임 상태 변수
	let currentRound = 1;
	let totalRound = Number.parseInt(localStorage.getItem('totalRound'));
	let totalScore = 0;
	let quizType = localStorage.getItem('quizType');
	let correctCountry = '';
	let correctRegion = '';
	let capital = '';
	let hintUsed = 0;
	let acceptedNames = [];
	let lastLat, lastLng;
	let countries = [];
	let regions = [];
	let answersList = [];
	let lastCountryCode = null; // ⬅ ISO 2자리 코드 저장(예: US, KR)

	// -----------------------------
	// 이벤트 리스너 (jQuery)
	// -----------------------------
	$(window).on('load', function() {
		// 어려움 난이도에서는 세계 지도 표시 X
		if (totalRound > 5) $worldMapDisplay.hide();

		// 난이도에 따른 입력창 변경
		if (quizType === 'region') {
			$answerInput.hide();
			$answerSelect.show();
		} else {
			$answerInput.show();
			$answerSelect.hide();
		}
	});
	$answerInput.on('keyup', function(e) {
		if (e.key === 'Enter') checkAnswer();
	});
	$showAnswersBtn.on('mouseover', function() {
		showAnswersList();
		$showAnswersElem.show();
	});
	$showAnswersBtn.on('mouseout', function() {
		$showAnswersElem.hide();
	});
	$hint1Btn.on('click', showHint1);
	$hint2Btn.on('click', showHint2);
	$hint3Btn.on('click', showHint3);
	$mapBtn.on('click', toggleMap);
	$submitBtn.on('click', checkAnswer);
	$nextBtn.on('click', nextRound);

	// -----------------------------
	// 첫 라운드 시작
	// -----------------------------
	startRound();
	$worldMap.hide();

	async function startRound() {
		$curRoundElem.text(currentRound);

		// 로딩 표시
		$latElem.text('로딩 중...');
		$lngElem.text('로딩 중...');

		// 총 라운드 수 표시
		$totalRoundElem.html(totalRound);

		// 비활성화
		disableInteraction();

		// 이전 라운드 초기화
		$answerInput.val('');
		$answerSelect.val('none');
		$resultElem.text('');
		$hintDisplay.html('');
		$hint1Btn.prop('disabled', true);
		$hint2Btn.prop('disabled', true);
		$hint3Btn.prop('disabled', true);
		$mapBtn.prop('disabled', true);
		$nextBtn.hide();
		$mapContainer.html('');
		hintUsed = 0;
		correctCountry = '';
		acceptedNames = [];
		lastCountryCode = null;

		let country = null;
		let region = null;
		let lat, lng, code;

		// 앞서 출제되지 않은 유효한 국가가 나올 때까지 무작위 좌표 생성
		while (true) {
			lat = getRandomInRange(-90, 90, 6);
			lng = getRandomInRange(-180, 180, 6);

			try {
				// ⬇️ 프록시 사용: /api/geocode → { country, code }
				const geo = await getCountryFromCoordinates(lat, lng);
				country = geo.country;
				code = geo.code; // ISO 3166-1 alpha-2 (예: US)
				if (!country || countries.includes(country)) continue;

				// 국가 세부 정보 (코드 우선)
				const details = await getCountryDetails(country, code);
				region = details.region;
				if (quizType === 'region') {
					if (!region || regions.includes(region)) continue;
				}
				// 조건 통과
				correctCountry = details.displayName || country;
				correctRegion = details.region;
				capital = details.capitalCity;
				acceptedNames = details.acceptedNames;
				$hint3Btn.data('flagUrl', details.flagImageUrl || '');
				lastCountryCode = details.code || code || null;
				break;
			} catch (err) {
				console.warn('국가 정보 없음, 좌표 재시도 중...', err);
			}
		}

		// 좌표 표시
		$latElem.text(lat);
		$lngElem.text(lng);
		lastLat = lat;
		lastLng = lng;

		// 한 번 출제된 국가는 다시 나오지 않도록 기록
		countries.push(correctCountry);
		regions.push(correctRegion);

		// 활성화
		enableInteraction();
	}

	// -----------------------------
	// 상호작용 비활성화/활성화
	// -----------------------------
	function disableInteraction() {
		$answerInput.prop('disabled', true);
		$answerSelect.prop('disabled', true);
		$hint1Btn.prop('disabled', true);
		$hint2Btn.prop('disabled', true);
		$hint3Btn.prop('disabled', true);
		$mapBtn.prop('disabled', true);
		$worldMap.hide();
		$mapBtn.html('세계 지도 보기');
		$submitBtn.prop('disabled', true);
	}
	function enableInteraction() {
		$answerInput.prop('disabled', false);
		$answerSelect.prop('disabled', false);
		$hint1Btn.prop('disabled', false);
		$mapBtn.prop('disabled', false);
		$submitBtn.prop('disabled', false);
	}

	// -----------------------------
	// 난수
	// -----------------------------
	function getRandomInRange(min, max, decimals) {
		const str = (Math.random() * (max - min) + min).toFixed(decimals);
		return parseFloat(str);
	}

	// -----------------------------
	// ⬅ 좌표 → 국가 (프록시)
	// -----------------------------
	async function getCountryFromCoordinates(lat, lng) {
		const r = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
		if (!r.ok) throw new Error('geocode error');
		const data = await r.json();
		// { country: "...", code: "US" }
		if (!data.country) throw new Error('국가 정보를 찾을 수 없습니다.');
		return { country: data.country, code: (data.code || '').toUpperCase() };
	}

	// -----------------------------
	// ⬅ 국가 상세 (ISO 코드 우선 → 정확한 국기/수도/지역)
	//    - 코드가 있으면: https://restcountries.com/v3.1/alpha/{code}
	//    - 코드 없으면:   name?fullText=true → 실패 시 name
	// -----------------------------
	async function getCountryDetails(countryName, countryCode) {
		try {
			let c; // restcountries 응답 객체
			if (countryCode) {
				const r = await fetch(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(countryCode)}?fields=name,cca2,capital,flags,region,altSpellings,translations`);
				if (!r.ok) throw new Error('alpha lookup failed');
				const arr = await r.json();
				c = Array.isArray(arr) ? arr[0] : arr;
			} else {
				// 이름 정확일치 우선
				let r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`);
				let arr = await r.json();
				if (!Array.isArray(arr) || arr.length === 0 || arr.status === 404) {
					r = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
					arr = await r.json();
				}
				c = Array.isArray(arr) ? arr[0] : arr;
			}

			const code = c?.cca2 || countryCode || null;
			const displayName = c?.name?.common || countryName || '정보 없음';
			const region = c?.region || '정보 없음';
			const flagImageUrl = c?.flags?.png || c?.flags?.svg || '';
			const capitalCity = Array.isArray(c?.capital) ? (c.capital[0] || '정보 없음') : (c?.capital || '정보 없음');
			const alt = Array.isArray(c?.altSpellings) ? c.altSpellings : [];
			const trans = c?.translations ? Object.values(c.translations).map(v => v?.common).filter(Boolean) : [];

			// 수용 이름 집합
			const nameSet = new Set([displayName, ...alt, ...trans].map(normalizeName));
			return {
				code,
				displayName,
				region,
				capitalCity,
				flagImageUrl,
				acceptedNames: Array.from(nameSet)
			};
		} catch (err) {
			console.error(err);
			return {
				code: countryCode || null,
				displayName: countryName || '정보 없음',
				region: '정보 없음',
				capitalCity: '정보 없음',
				flagImageUrl: '',
				acceptedNames: [normalizeName(countryName || '')]
			};
		}
	}

	// -----------------------------
	// 정답 리스트 출력
	// -----------------------------
	function showAnswersList() {
		$showAnswersElem.empty();
		const $table = $('<table>').attr('id', 'answer-list-table');
		const $headerRow = $('<tr>').append($('<th>').text('라운드'), $('<th>').text('정답'));
		$table.append($headerRow);

		for (let i = 0; i < answersList.length; i++) {
			const result = answersList[i];
			const $row = $('<tr>').append($('<td>').text(result.round), $('<td>').text(result.answer));
			$row.find('td:last-child').css('color', result.isCorrect ? 'green' : 'red');
			$table.append($row);
		}
		$showAnswersElem.append($table);
	}

	// -----------------------------
	// 힌트 1 : 이미지 (프록시 /api/hint-image)
	// -----------------------------
	function showHint1() {
		$hintDisplay.append(`<p id="loading-text">이미지 로딩 중...</p>`);
		$hint1Btn.prop('disabled', true);
		$hint2Btn.prop('disabled', false);
		hintUsed = 1;

		fetch(`/api/hint-image?country=${encodeURIComponent(correctCountry)}`)
			.then(res => res.json())
			.then(data => {
				$('#loading-text').remove();
				if (data && data.url) {
					$hintDisplay.append(
						`<img src="${data.url}" width="400" style="margin-top: 30px; border: 3px solid #b3daff; margin-top: 0; margin-bottom: 30px">`
					);
				} else {
					$hintDisplay.append(`<p>이미지를 찾을 수 없습니다.</p>`);
				}
			})
			.catch(() => {
				$('#loading-text').remove();
				$hintDisplay.append(`<p>이미지를 불러오지 못했습니다.</p>`);
			});
	}

	// -----------------------------
	// 힌트 2 : 수도
	// -----------------------------
	function showHint2() {
		$hintDisplay.append(`<p style="margin-top: 0;"> 수도: ${capital || '정보 없음'}</p>`);
		$hint2Btn.prop('disabled', true);
		$hint3Btn.prop('disabled', false);
		hintUsed = 2;
	}

	// -----------------------------
	// 힌트 3 : 국기
	// -----------------------------
	function showHint3() {
		const flagUrl = $hint3Btn.data('flagUrl');
		if (flagUrl) {
			$hintDisplay.append(`<img src="${flagUrl}" width="400" style="margin-top: 30px; border: 3px solid #b2e2b2; margin-top: 0; margin-bottom: 30px">`);
		} else {
			$hintDisplay.append(`<p>국기를 불러올 수 없습니다.</p>`);
		}
		$hint3Btn.prop('disabled', true);
		hintUsed = 3;
	}

	// -----------------------------
	// 세계 지도 토글
	// -----------------------------
	function toggleMap() {
		if ($worldMap.is(':hidden')) {
			$worldMap.show();
			$mapBtn.html('세계 지도 숨기기');
		} else {
			$worldMap.hide();
			$mapBtn.html('세계 지도 보기');
		}
	}

	// -----------------------------
	// 이름 정규화
	// -----------------------------
	function normalizeName(str) {
		return (str || '').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
	}

	// -----------------------------
	// 채점
	// -----------------------------
	function checkAnswer() {
		let userAnswer;
		let isCorrect;
		let point = 0;
		let message = '';

		if (quizType === 'region') {
			userAnswer = $answerSelect.val();
			if (userAnswer === 'none') {
				alert('대륙 이름을 선택해주세요.');
				return;
			}
			isCorrect = (correctRegion || '').toLowerCase().includes(userAnswer.toLowerCase());
			if (isCorrect) {
				switch (hintUsed) {
					case 0: point = 20; break;
					case 1: point = 15; break;
					case 2: point = 10; break;
					case 3: point = 5; break;
					default: point = 0;
				}
				totalScore += point;
				message = `정답입니다! (+${point}점)`;
				$resultElem.css('color', 'green');
			} else {
				message = `틀렸습니다. 정답은 ${correctRegion}입니다.`;
				$resultElem.css('color', 'red');
			}
		} else {
			userAnswer = $answerInput.val();
			if (!userAnswer) {
				alert('나라 이름을 입력해주세요.');
				return;
			}
			const normalized = normalizeName(userAnswer);
			isCorrect = acceptedNames.includes(normalized);

			if (isCorrect) {
				switch (hintUsed) {
					case 0: point = 20; break;
					case 1: point = 15; break;
					case 2: point = 10; break;
					case 3: point = 5; break;
					default: point = 0;
				}
				totalScore += point;
				message = `정답입니다! (+${point}점)`;
				$resultElem.css('color', 'green');
			} else {
				message = `틀렸습니다. 정답은 ${correctCountry}입니다.`;
				$resultElem.css('color', 'red');
			}
		}

		answersList.push({
			round: currentRound,
			answer: (quizType === 'region') ? correctRegion : correctCountry,
			isCorrect: isCorrect
		});

		$scoreElem.text(totalScore);
		$resultElem.text(message);

		// 비활성화 + 다음 버튼
		disableInteraction();
		$nextBtn.show();
		$nextBtn.text(currentRound === totalRound ? '결과 확인' : '다음 문제');

		// OSM 임베드(키 불필요)
		const delta = 5;
		const minLat = clamp(lastLat - delta, -90, 90);
		const maxLat = clamp(lastLat + delta, -90, 90);
		const minLng = clamp(lastLng - delta, -180, 180);
		const maxLng = clamp(lastLng + delta, -180, 180);
		const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(minLng)},${encodeURIComponent(minLat)},${encodeURIComponent(maxLng)},${encodeURIComponent(maxLat)}&layer=mapnik&marker=${encodeURIComponent(lastLat)},${encodeURIComponent(lastLng)}`;
		$mapContainer.html(`<iframe width="100%" height="100%" style="border:0" src="${mapSrc}" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`);
	}

	function clamp(val, min, max) {
		return Math.max(min, Math.min(max, val));
	}

	// -----------------------------
	// 다음 라운드
	// -----------------------------
	function nextRound() {
		currentRound++;
		if (currentRound > totalRound) {
			localStorage.setItem('finalScore', totalScore);
			window.location.href = 'result.html';
		} else {
			$curRoundElem.text(currentRound);
			startRound();
		}
	}
});
