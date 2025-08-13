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
		'width': '100%',
		'height': '400px',
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
		if (e.key === 'Enter') {   // Enter 로 정답 제출
			checkAnswer();
		}
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
		// 로딩 표시
		$latElem.text('로딩 중...');
		$lngElem.text('로딩 중...');

		// 난이도에 따른 총 라운드 수 표시
		$totalRoundElem.html(totalRound);

		// 위도와 경도가 정해지기 전까지 버튼 클릭 불가
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

		let country = null;
		let region = null;
		let lat, lng;

		// 앞서 출제되지 않은 유효한 국가가 나올 때까지 무작위 좌표 생성
		while (true) {
			lat = getRandomInRange(-90, 90, 6);    // 랜덤으로 위도 설정
			lng = getRandomInRange(-180, 180, 6);  // 랜덤으로 경도 설정

			try {
				country = await getCountryFromCoordinates(lat, lng);   // 국가명을 가져올 수 있는 위도와 경도인지 확인

				// 중복된 국가가 나온 경우 다시 로딩
				if (!country || countries.includes(country)) continue;

				// 국가 세부 정보를 가져와서 지역 확인
				const {region : newRegion} = await getCountryDetails(country);

				// 중복된 대륙인 경우 다시 로딩
				if (quizType === 'region') {
					if (!newRegion || regions.includes(newRegion)) continue;
				}

				// 조건을 모두 통과한 경우 루프 종료
				region = newRegion;
				break;
			} catch (err) {
				console.warn('국가 정보 없음, 좌표 재시도 중...', err);    // 국가명을 가져올 수 없는 경우, 좌표 재지정 후 시도
			}
		}

		// 좌표 표시
		$latElem.text(lat);
		$lngElem.text(lng);
		lastLat = lat;
		lastLng = lng;

		// 국가 이름 기반으로 국기, 수도, 대체 이름 정보 가져오기
		try {
			correctCountry = country;
			const { flagImageUrl, capitalCity, altSpellings, region } = await getCountryDetails(country);
			capital = capitalCity;
			acceptedNames = altSpellings.map(name => normalizeName(name));
			acceptedNames.push(normalizeName(correctCountry));
			correctRegion = region;

			// 한글 이름도 포함
			try {
				const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}`);
				const data = await res.json();
				const koreanName = data[0]?.translations?.kor?.common;
				if (koreanName) {
					acceptedNames.push(normalizeName(koreanName));
				}
			} catch (err) {
				console.warn('한글 국가명 추가 실패', err);
			}

			$hint3Btn.data('flagUrl', flagImageUrl);   // <button data-flag-url="flagImageUrl" ...></button>
		} catch (err) {
			console.error('국가 상세 정보 오류', err);
			correctCountry = '정보 없음';
			capital = '정보 없음';
			$hint2Btn.data('flagUrl', '');
		}

		// 한 번 출제된 국가는 다시 나오지 않도록 배열에 추가
		countries.push(country);
		regions.push(region);

		// 사용자 입력, 버튼 활성화
		enableInteraction();
	}


	// -----------------------------
	// 상호작용 비활성화 (jQuery)
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

	// -----------------------------
	// 상호작용 활성화 (jQuery)
	// -----------------------------
	function enableInteraction() {
		$answerInput.prop('disabled', false);
		$answerSelect.prop('disabled', false);
		$hint1Btn.prop('disabled', false);
		$mapBtn.prop('disabled', false);
		$submitBtn.prop('disabled', false);
	}


	// -----------------------------
	// 특정 범위에서 소수점 포함 무작위 수 생성 (위도, 경도)
	// -----------------------------
	function getRandomInRange(min, max, decimals) { // 위도, 경도 랜덤 출력 시 사용할 함수
		const str = (Math.random() * (max - min) + min).toFixed(decimals);
		return parseFloat(str);
	}


	// -----------------------------
	// 좌표 → 국가명 변환 (OpenStreetMap Nominatim API)
	//                 : Reverse Geocoding API(좌표 -> 주소 변환) 사용
	// -----------------------------
	async function getCountryFromCoordinates(lat, lng) {
		const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3&addressdetails=1`;
		const response = await fetch(url, {
			headers: { 'User-Agent': 'geo-guess-game' }
		});
		const data = await response.json();
		const country = data.address?.country; // ?. (optional chaining): data.address 가 존재하지 않으면 undefined 반환 (예외 방지)
		if (!country) throw new Error('국가 정보를 찾을 수 없습니다.');
		return country;
	}


	// -----------------------------
	// 국가 이름을 기반으로 국기, 수도, 대체 이름 정보 요청 (REST Countries API)
	// -----------------------------
	async function getCountryDetails(countryName) {
		try {
			// encodeURIComponent() : 특수문자가 포함된 이름도 안전하게 URL 로 인코딩해주는 함수
			// fullText=True : 정확하게 일치하는 국가명 검색
			let res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`);
			let data = await res.json();

			// 정확한 검색이 실패한 경우, 부분 일치로 재시도 (fullText=True 쿼리 없이 검색)
			// (ex. Korea → South Korea, North Korea 포함 결과 반환)
			if (!data || data.status === 404) {
				res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`);
				data = await res.json();
			}

			const country = data[0];   // 첫 번째 결과만 사용
			const region = country.region || '정보 없음';  // 국가의 대륙명 저장
			const flagImageUrl = country.flags?.png || country.flags?.svg; // png 또는 svg 국기 이미지 url 저장
			const capitalCity = country.capital ? country.capital[0] : '정보 없음';    // 수도가 배열로 저장된 경우, 첫 번째 원소만 사용
			const altSpellings = country.altSpellings || [];   // 다른 표기 방식 저장 (ex. "Republic of Korea")
			const translations = Object.values(country.translations || {}).map(obj => obj.common); // 다양한 언어로 번역된 국가명 (ex. "Corée du Sud")

			// 하나의 객체로 모든 정보 반환
			// altSpellings[] : 철자 및 언어 변형을 모두 포함
			return {
				flagImageUrl,
				capitalCity,
				altSpellings: [...altSpellings, ...translations],  // ...배열명 (spread 연산자) : 배열을 펼쳐줌 -> 다른 배열이나 객체로 빠르게 복사 가능
				region,
			};
		} catch (err) {
			console.error(err);
			// API 요청에 실패하거나 구조가 다르면, 기본값 반환
			return {
				flagImageUrl: '',
				capitalCity: '정보 없음',
				altSpellings: []
			};
		}
	}
	/* 결과 예시
	{
	  "flagImageUrl": "https://flagcdn.com/w320/kr.png",
	  "capitalCity": "Seoul",
	  "altSpellings": [
		"KR",
		"Korea, Republic of",
		"대한민국",
		"South Korea",
		"Corée du Sud",
		...
	  ]
	}
	*/


	// -----------------------------
	// 이전 라운드까지의 정답 리스트 출력
	// -----------------------------
	function showAnswersList() {
		$showAnswersElem.empty(); // 이전 내용 비우기

		// 표 생성
		const $table = $('<table>').attr('id', 'answer-list-table');
		const $headerRow = $('<tr>').append($('<th>').text('라운드'), $('<th>').text('정답'));
		$table.append($headerRow);

		// 정답 리스트 추가
		for (let i = 0; i < answersList.length; i++) {
			const result = answersList[i];
			const $row = $('<tr>').append($('<td>').text(result.round), $('<td>').text(result.answer));
			if (result.isCorrect) {
				$row.find('td:last-child').css('color', 'green'); // 정답인 경우 초록색
			} else {
				$row.find('td:last-child').css('color', 'red');   // 오답인 경우 빨간색
			}
			$table.append($row);
		}

		$showAnswersElem.append($table);
	}


	// -----------------------------
	// 힌트 1 : 이미지 힌트 (Unsplash API) (jQuery)
	// -> 국가명을 unsplash 에 검색했을 때 가장 먼저 나오는 이미지 출력
	// -----------------------------
	function showHint1() {
		$hintDisplay.append(`<p id="loading-text">이미지 로딩 중...</p>`);
		$hint1Btn.prop('disabled', true);
		$hint2Btn.prop('disabled', false);
		hintUsed = 1;

		const unsplashApiKey = 'YOUR_UNSPASH_API_KEY';
		fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(correctCountry)}&client_id=${unsplashApiKey}&per_page=1`)
			.then(res => res.json())
			.then(data => {
				$('#loading-text').remove();
				if (data.results && data.results.length > 0) {
					const imgUrl = data.results[0].urls.regular;
					$hintDisplay.append(`<img src="${imgUrl}" width="400" style="margin-top: 30px; border: 3px solid #b3daff; margin-top: 0; margin-bottom: 30px">`);
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
	// 힌트 2 : 수도 힌트 (jQuery)
	// -----------------------------
	function showHint2() {
		$hintDisplay.append(`<p style="margin-top: 0;"> 수도: ${capital || '정보 없음'}</p>`);
		$hint2Btn.prop('disabled', true);
		$hint3Btn.prop('disabled', false);
		hintUsed = 2;
	}

	// -----------------------------
	// 힌트 3 : 국기 힌트 (jQuery)
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
	// 추가 힌트 : 세계 지도 확인 (토글 기능) (jQuery)
	//           -> 난이도 쉬움, 보통 인 경우에만 표시
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
	// 이름 통일 처리 (대소문자, 공백, 발음기호 제거)
	// -----------------------------
	function normalizeName(str) {
		return str.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
	}


	// -----------------------------
	// 정답 제출 → 결과 처리 (jQuery)
	// -----------------------------
	function checkAnswer() {
		let userAnswer;
		let isCorrect;
		let point = 0;
		let message = '';

		if (quizType === 'region') {   // 대륙 맞히기(초보) 난이도인 경우
			userAnswer = $answerSelect.val();
			if (userAnswer === 'none') {
				alert('대륙 이름을 선택해주세요.');
				return;
			}

			isCorrect = correctRegion.includes(userAnswer);
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
		}
		else { // 국가 맞히기 난이도인 경우
			userAnswer = $answerInput.val();
			if (!userAnswer) alert('나라 이름을 입력해주세요.');

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

		// 정답 리스트 배열에 결과 추가
		answersList.push({
			round: currentRound,
			answer: (quizType === 'region') ? correctRegion : correctCountry, // 참일 경우 region 답, 거짓일 경우 country 답 push
			isCorrect: isCorrect,
		});

		// 채점 결과 화면 표시
		$scoreElem.text(totalScore);
		$resultElem.text(message);

		// 다음 라운드 버튼 표시, 상호작용 비활성화
		disableInteraction();
		$nextBtn.show();
		$nextBtn.text(currentRound === totalRound ? '결과 확인' : '다음 문제');

		// 구글 맵에 위치 표시
		const googleApiKey = 'YOUR_GOOGLE_API_KEY';
		const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${googleApiKey}&q=${lastLat},${lastLng}&zoom=5`;
		$mapContainer.html(`<iframe width="100%" height="100%" style="border:0" src="${mapSrc}" allowfullscreen></iframe>`);
	}


	// -----------------------------
	// 다음 라운드로 이동 또는 결과 페이지로 이동 (jQuery)
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